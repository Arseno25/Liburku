'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { MarkdownRenderer } from './markdown-renderer';
import { LongWeekend } from './long-weekend-planner';
import { Wand2, CalendarDays, ImageIcon, Mountain, Waves, UtensilsCrossed, Landmark, FileText, Sparkles } from 'lucide-react';

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
    theme: string;
    suggestion: string;
    imageUrl: string;
    itinerary: string;
    isGeneratingSuggestion: boolean;
    isGeneratingItinerary: boolean;
    showThemeSelection: boolean;
    onThemeSelect?: (theme: string) => void;
    onGenerateItinerary?: () => void;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatDateRange = (startDate: Date, endDate: Date) => {
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
    theme,
    suggestion,
    imageUrl,
    itinerary,
    isGeneratingSuggestion,
    isGeneratingItinerary,
    showThemeSelection,
    onThemeSelect,
    onGenerateItinerary
}: SuggestionDialogProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90dvh] flex flex-col">
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
                    <div className="flex items-center gap-2 text-sm font-medium text-primary/90">
                        <CalendarDays className="w-4 h-4" />
                        <span>{weekend && formatDateRange(weekend.startDate, weekend.endDate)}</span>
                    </div>
                </DialogHeader>
                <div className="py-2 space-y-4 overflow-y-auto pr-2">
                    {showThemeSelection && onThemeSelect && (
                        <div className="animate-in fade-in-50 duration-300">
                            <p className="text-center font-medium text-foreground mb-4">Pilih tema liburan Anda:</p>
                            <div className="grid grid-cols-2 gap-3">
                                {themes.map(t => (
                                    <Button
                                        key={t.name}
                                        variant="outline"
                                        className="py-6 flex-col gap-2 h-auto text-base"
                                        onClick={() => onThemeSelect(t.name)}
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
                            <div className="w-full aspect-video rounded-lg bg-secondary/40 flex items-center justify-center overflow-hidden border">
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

                    {!showThemeSelection && !isGeneratingSuggestion && suggestion && (
                        <div className="space-y-4 animate-in fade-in-50 duration-300">
                            <div className="w-full aspect-video rounded-lg bg-secondary/40 flex items-center justify-center overflow-hidden border">
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
                                <div className="space-y-3 animate-in fade-in-50">
                                    <h4 className="font-semibold text-lg flex items-center gap-2.5">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Rencana Perjalanan
                                    </h4>
                                    <div className="text-sm bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4 rounded-lg leading-relaxed font-mono">
                                        <MarkdownRenderer>{itinerary}</MarkdownRenderer>
                                    </div>
                                </div>
                            ) : (
                                onGenerateItinerary && (
                                <div className="text-center pt-2">
                                    <Button onClick={onGenerateItinerary}>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Buatkan Rencana Perjalanan
                                    </Button>
                                </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
