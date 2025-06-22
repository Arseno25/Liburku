'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { MarkdownRenderer } from './markdown-renderer';
import { LongWeekend } from './long-weekend-planner';
import { Wand2, CalendarDays, ImageIcon, Mountain, Waves, UtensilsCrossed, Landmark, FileText, Sparkles, Backpack, Wallet, LoaderCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card";


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
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isPlanReady, setIsPlanReady] = useState(false);


    const resetState = () => {
        setTheme('');
        setSuggestion('');
        setImageUrl('');
        setItinerary('');
        setPackingList('');
        setBudget('');
        setShowThemeSelection(true);
        setIsGeneratingSuggestion(false);
        setIsGeneratingPlan(false);
        setIsPlanReady(false);
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
            
            // Generate suggestion and initial image in parallel
            const [suggestionResult] = await Promise.all([
                suggestActivity(suggestionInput),
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

    const handleGenerateFullPlan = async () => {
        if (!weekend || !suggestion || !theme) return;
        setIsGeneratingPlan(true);
        setIsPlanReady(false);
        setItinerary('');
        setBudget('');
        setPackingList('');

        try {
            // First, generate the itinerary
            const itineraryInput: GenerateItineraryInput = {
                holidayName: weekend.holidayName,
                duration: weekend.duration,
                dateRange: formatDateRange(weekend.startDate, weekend.endDate),
                theme: theme,
                suggestion: suggestion,
                userLocation: userLocation || undefined,
            };
            const itineraryResult = await generateItinerary(itineraryInput);
            setItinerary(itineraryResult.itinerary);

            // Now that we have the itinerary, we can generate the budget and packing list in parallel
            const budgetInput: EstimateTripBudgetInput = {
                duration: weekend.duration,
                theme: theme,
                suggestion: suggestion,
                itinerary: itineraryResult.itinerary,
                userLocation: userLocation || undefined,
            };
            const packingListInput: GeneratePackingListInput = {
                duration: weekend.duration,
                theme: theme,
                suggestion: suggestion,
                itinerary: itineraryResult.itinerary,
            };

            const [budgetResult, packingListResult] = await Promise.all([
                estimateTripBudget(budgetInput),
                generatePackingList(packingListInput)
            ]);

            setBudget(budgetResult.markdownBudget);
            setPackingList(packingListResult.packingList);
            setIsPlanReady(true);

        } catch (error) {
            console.error("Gagal membuat rencana lengkap:", error);
            toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat menghasilkan rencana lengkap. Silakan coba lagi nanti." });
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const isSuggestionReady = !showThemeSelection && !isGeneratingSuggestion && suggestion;
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90dvh] flex flex-col">
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
                                {imageUrl ? (
                                     <img
                                        src={imageUrl}
                                        alt={suggestion.substring(0, 100)}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center bg-transparent gap-3 text-muted-foreground animate-pulse">
                                        <ImageIcon className="w-14 h-14" />
                                    </div>
                                )}
                            </div>
                            <div className="text-foreground/90">
                                <p className="text-base leading-relaxed whitespace-pre-wrap">{suggestion}</p>
                            </div>

                            <Separator className="my-2" />

                            {isGeneratingPlan ? (
                                <div className="space-y-4 pt-2 text-center">
                                    <LoaderCircle className="w-8 h-8 text-primary animate-spin inline-block" />
                                    <p className="font-medium text-muted-foreground">AI sedang menyusun rencana lengkap untuk Anda... Ini mungkin perlu waktu sejenak.</p>
                                    <Skeleton className="h-10 w-full rounded-md" />
                                    <div className="border rounded-lg p-4 mt-4">
                                        <Skeleton className="h-32 w-full" />
                                    </div>
                                </div>
                            ) : !isPlanReady ? (
                                <div className="text-center pt-2">
                                    <Button size="lg" onClick={handleGenerateFullPlan} disabled={isGeneratingPlan} data-magnetic>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Buatkan Rencana Lengkap!
                                    </Button>
                                </div>
                            ) : (
                                <div className="animate-in fade-in-50">
                                     <Tabs defaultValue="itinerary" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3" data-magnetic>
                                            <TabsTrigger value="itinerary"><FileText className="mr-2 h-4 w-4"/>Rencana Perjalanan</TabsTrigger>
                                            <TabsTrigger value="budget"><Wallet className="mr-2 h-4 w-4"/>Estimasi Anggaran</TabsTrigger>
                                            <TabsTrigger value="packing"><Backpack className="mr-2 h-4 w-4"/>Daftar Bawaan</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="itinerary">
                                            <Card>
                                                <CardContent className="p-4 md:p-6" data-magnetic>
                                                    <MarkdownRenderer>{itinerary}</MarkdownRenderer>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                        <TabsContent value="budget">
                                            <Card>
                                                <CardContent className="p-4 md:p-6" data-magnetic>
                                                    <MarkdownRenderer>{budget}</MarkdownRenderer>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                        <TabsContent value="packing">
                                            <Card>
                                                <CardContent className="p-4 md:p-6" data-magnetic>
                                                     <MarkdownRenderer>{packingList}</MarkdownRenderer>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
