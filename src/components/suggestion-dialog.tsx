'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { MarkdownRenderer } from './markdown-renderer';
import { LongWeekend } from './long-weekend-planner';
import { Wand2, CalendarDays, ImageIcon, Mountain, Waves, UtensilsCrossed, Landmark, FileText, Sparkles, Backpack, Wallet } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { suggestActivity, SuggestActivityInput } from '@/ai/flows/suggest-long-weekend-activity-flow';
import { generateActivityImage } from '@/ai/flows/generate-activity-image-flow';
import { generateItinerary, GenerateItineraryInput } from '@/ai/flows/generate-itinerary-flow';
import { generatePackingList, GeneratePackingListInput } from '@/ai/flows/generate-packing-list-flow';
import { estimateTripBudget, EstimateTripBudgetInput } from '@/ai/flows/estimate-trip-budget-flow';

const themes = [
    { name: 'Petualangan', icon: Mountain },
    { name: 'Relaksasi', icon: Waves },
    { name: 'Kuliner', icon: UtensilsCrossed },
    { name: 'Budaya', icon: Landmark },
]

interface SuggestionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    weekend: LongWeekend | null;
    preselectedTheme?: string;
    userLocation?: string | null;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatDateRange = (startDate: Date, endDate: Date) => {
    if (!startDate || !endDate) return '';
    const startDay = dayNames[startDate.getDay()];
    const startDateNum = startDate.getDate();
    const startMonth = monthNames[startDate.getMonth()];

    const endDay = dayNames[endDate.getDay()];
    const endDateNum = endDate.getDate();
    const endMonth = monthNames[endDate.getMonth()];
    const endYear = endDate.getFullYear();

    if (startMonth === endMonth) {
        return `${startDay}, ${startDateNum} - ${endDay}, ${endDateNum} ${endMonth} ${endYear}`;
    } else {
        return `${startDay}, ${startDateNum} ${startMonth} - ${endDay}, ${endDateNum} ${endMonth} ${endYear}`;
    }
}

export function SuggestionDialog({
    isOpen,
    onOpenChange,
    weekend,
    preselectedTheme = '',
    userLocation
}: SuggestionDialogProps) {
    const { toast } = useToast();

    // Internal state for all generated content
    const [theme, setTheme] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [itinerary, setItinerary] = useState('');
    const [packingList, setPackingList] = useState('');
    const [budget, setBudget] = useState('');

    // State flags
    const [showThemeSelection, setShowThemeSelection] = useState(true);
    const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
    const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
    const [isGeneratingPackingList, setIsGeneratingPackingList] = useState(false);
    const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);

    const resetState = () => {
        setTheme('');
        setSuggestion('');
        setImageUrl('');
        setItinerary('');
        setPackingList('');
        setBudget('');
        setShowThemeSelection(true);
        setIsGeneratingSuggestion(false);
        setIsGeneratingItinerary(false);
        setIsGeneratingPackingList(false);
        setIsGeneratingBudget(false);
    };

    useEffect(() => {
        if (isOpen) {
            resetState();
            if (preselectedTheme && weekend) {
                // For "Surprise Me" feature, kick off generation immediately
                handleThemeSelect(preselectedTheme);
            }
        }
    }, [isOpen, preselectedTheme, weekend]);

    const handleThemeSelect = async (selectedTheme: string) => {
        if (!weekend) return;
        
        setTheme(selectedTheme);
        setShowThemeSelection(false);
        setIsGeneratingSuggestion(true);

        try {
            const suggestionInput: SuggestActivityInput = {
                holidayName: weekend.holidayName,
                duration: weekend.duration,
                dateRange: formatDateRange(weekend.startDate, weekend.endDate),
                theme: selectedTheme,
                userLocation: userLocation || undefined,
            };
            
            // Generate suggestion and image in parallel
            const [suggestionResult, imageResult] = await Promise.all([
                suggestActivity(suggestionInput),
                generateActivityImage({ imagePrompt: `Sebuah foto perjalanan yang indah dan profesional dengan tema: ${selectedTheme}` })
            ]);

            setSuggestion(suggestionResult.suggestion);
            
            // Then generate a more specific image based on the suggestion
            const specificImageResult = await generateActivityImage({ imagePrompt: suggestionResult.imagePrompt });
            setImageUrl(specificImageResult.imageUrl);

        } catch (error) {
            console.error("Gagal menghasilkan saran atau gambar:", error);
            toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat menghasilkan ide liburan. Silakan coba lagi." });
            onOpenChange(false); // Close dialog on error
        } finally {
            setIsGeneratingSuggestion(false);
        }
    };

    const handleGenerateItinerary = async () => {
        if (!weekend || !suggestion || !theme) return;
        setIsGeneratingItinerary(true);
        setItinerary('');
        try {
            const itineraryInput: GenerateItineraryInput = {
                holidayName: weekend.holidayName,
                duration: weekend.duration,
                dateRange: formatDateRange(weekend.startDate, weekend.endDate),
                theme: theme,
                suggestion: suggestion,
                userLocation: userLocation || undefined,
            };
            const result = await generateItinerary(itineraryInput);
            setItinerary(result.itinerary);
        } catch (error) {
            console.error("Gagal membuat rencana perjalanan:", error);
            setItinerary("Maaf, terjadi kesalahan saat membuat rencana perjalanan. Silakan coba lagi nanti.");
        } finally {
            setIsGeneratingItinerary(false);
        }
    };
    
    const handleGenerateBudget = async () => {
        if (!weekend || !suggestion || !itinerary || !theme) return;

        setIsGeneratingBudget(true);
        setBudget('');
        try {
            const budgetInput: EstimateTripBudgetInput = {
                duration: weekend.duration,
                theme: theme,
                suggestion: suggestion,
                itinerary: itinerary,
                userLocation: userLocation || undefined,
            };
            const result = await estimateTripBudget(budgetInput);
            setBudget(result.markdownBudget);
        } catch (error) {
            console.error("Gagal membuat estimasi anggaran:", error);
            setBudget("Maaf, terjadi kesalahan saat membuat estimasi anggaran. Silakan coba lagi nanti.");
        } finally {
            setIsGeneratingBudget(false);
        }
    };

    const handleGeneratePackingList = async () => {
        if (!weekend || !suggestion || !itinerary || !theme) return;
        setIsGeneratingPackingList(true);
        setPackingList('');
        try {
            const packingListInput: GeneratePackingListInput = {
                duration: weekend.duration,
                theme: theme,
                suggestion: suggestion,
                itinerary: itinerary,
            };
            const result = await generatePackingList(packingListInput);
            setPackingList(result.packingList);
        } catch (error) {
            console.error("Gagal membuat daftar barang bawaan:", error);
            setPackingList("Maaf, terjadi kesalahan saat membuat daftar barang bawaan. Silakan coba lagi nanti.");
        } finally {
            setIsGeneratingPackingList(false);
        }
    };

    const isSuggestionReady = !showThemeSelection && !isGeneratingSuggestion && suggestion;
    const isBudgetReady = !!budget;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90dvh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/10 rounded-lg">
                            <Wand2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold">{weekend?.title || "Inspirasi Liburan"}</DialogTitle>
                            <p className="text-sm text-muted-foreground">{weekend?.holidayName}</p>
                        </div>
                    </div>
                    {weekend && (
                        <div className="flex items-center gap-2 text-sm font-medium text-primary/90">
                            <CalendarDays className="w-4 h-4" />
                            <span>{formatDateRange(weekend.startDate, weekend.endDate)}</span>
                        </div>
                    )}
                </DialogHeader>
                <div className="py-2 space-y-4 overflow-y-auto pr-2">
                    {showThemeSelection && (
                        <div className="animate-in fade-in-50 duration-300">
                            <p className="text-center font-medium text-foreground mb-4">Pilih tema liburan Anda:</p>
                            <div className="grid grid-cols-2 gap-3">
                                {themes.map(t => (
                                    <Button
                                        key={t.name}
                                        variant="outline"
                                        className="py-6 flex-col gap-2 h-auto text-base"
                                        onClick={() => handleThemeSelect(t.name)}
                                        data-magnetic
                                    >
                                        <t.icon className="w-6 h-6 text-primary" />
                                        <span>{t.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isGeneratingSuggestion && (
                        <div className="space-y-4">
                            <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                <div className="h-full w-full flex flex-col items-center justify-center bg-transparent gap-3 text-muted-foreground animate-pulse">
                                    <ImageIcon className="w-14 h-14" />
                                    <p className="font-medium">Membuat gambar inspiratif...</p>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        </div>
                    )}
                    
                    {isSuggestionReady && (
                         <div className="space-y-4 animate-in fade-in-50 duration-300">
                            <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                <img
                                    src={imageUrl}
                                    alt={suggestion.substring(0, 100)}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-foreground/90">
                                <p className="text-base leading-relaxed whitespace-pre-wrap">{suggestion}</p>
                            </div>

                            <Separator className="my-2" />

                            {isGeneratingItinerary ? (
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                                        <FileText className="w-6 h-6" />
                                        <p className="font-medium">Membuat rencana perjalanan detail...</p>
                                    </div>
                                    <div className="space-y-3 pl-9">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-4/5" />
                                    </div>
                                </div>
                            ) : itinerary ? (
                                <div className="space-y-4 animate-in fade-in-50">
                                    <div>
                                        <h4 className="font-semibold text-lg flex items-center gap-2.5 mb-2">
                                            <FileText className="w-5 h-5 text-primary" />
                                            Rencana Perjalanan
                                        </h4>
                                        <div className="text-sm bg-muted/30 border p-4 rounded-lg leading-relaxed" data-magnetic>
                                            <MarkdownRenderer>{itinerary}</MarkdownRenderer>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    {/* Budget Section */}
                                    {isGeneratingBudget ? (
                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                                                <Wallet className="w-6 h-6" />
                                                <p className="font-medium">Menyusun estimasi anggaran...</p>
                                            </div>
                                            <div className="pl-9 space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-4/5" />
                                            </div>
                                        </div>
                                    ) : isBudgetReady ? (
                                        <div className="animate-in fade-in-50">
                                            <h4 className="font-semibold text-lg flex items-center gap-2.5 mb-2">
                                                <Wallet className="w-5 h-5 text-primary" />
                                                Estimasi Anggaran
                                            </h4>
                                            <div className="text-sm bg-muted/30 border p-4 rounded-lg leading-relaxed" data-magnetic>
                                                <MarkdownRenderer>{budget}</MarkdownRenderer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Button onClick={handleGenerateBudget} disabled={isGeneratingBudget} data-magnetic>
                                                <Wallet className="mr-2 h-4 w-4" />
                                                Buatkan Estimasi Anggaran
                                            </Button>
                                        </div>
                                    )}
                                    
                                    {/* Packing List Section appears after budget is done */}
                                    {isBudgetReady && (
                                        <>
                                            <Separator className="my-4" />
                                            {isGeneratingPackingList ? (
                                                <div className="space-y-4 pt-2">
                                                    <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                                                        <Backpack className="w-6 h-6" />
                                                        <p className="font-medium">Menyiapkan daftar barang bawaan...</p>
                                                    </div>
                                                    <div className="space-y-3 pl-9">
                                                        <Skeleton className="h-4 w-full" />
                                                        <Skeleton className="h-4 w-full" />
                                                        <Skeleton className="h-4 w-4/5" />
                                                    </div>
                                                </div>
                                            ) : packingList ? (
                                                <div className="animate-in fade-in-50">
                                                    <h4 className="font-semibold text-lg flex items-center gap-2.5 mb-2">
                                                        <Backpack className="w-5 h-5 text-primary" />
                                                        Daftar Barang Bawaan
                                                    </h4>
                                                    <div className="text-sm bg-muted/30 border p-4 rounded-lg leading-relaxed" data-magnetic>
                                                        <MarkdownRenderer>{packingList}</MarkdownRenderer>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <Button onClick={handleGeneratePackingList} disabled={isGeneratingPackingList} data-magnetic>
                                                        <Backpack className="mr-2 h-4 w-4" />
                                                        Buatkan Daftar Barang Bawaan
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center pt-2">
                                    <Button onClick={handleGenerateItinerary} disabled={isGeneratingItinerary} data-magnetic>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Buatkan Rencana Perjalanan
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
