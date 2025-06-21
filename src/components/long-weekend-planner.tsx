'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Holiday } from '@/types/holiday';
import { Plane, CalendarDays, Sparkles, Wand2, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { suggestActivity, SuggestActivityInput } from '@/ai/flows/suggest-long-weekend-activity-flow';
import { generateActivityImage } from '@/ai/flows/generate-activity-image-flow';
import { Badge } from '@/components/ui/badge';

interface LongWeekend {
  title: string;
  startDate: Date;
  endDate: Date;
  holidayName: string;
  duration: number;
  suggestion?: string;
}

interface LongWeekendPlannerProps {
  holidays: Holiday[];
  year: number;
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

export function LongWeekendPlanner({ holidays, year }: LongWeekendPlannerProps) {
  const [employmentType, setEmploymentType] = useState<'pns' | 'private'>('pns');
  const [workSchedule, setWorkSchedule] = useState<'senin-jumat' | 'senin-sabtu'>('senin-jumat');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeekend, setSelectedWeekend] = useState<LongWeekend | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleWeekendClick = async (weekend: LongWeekend) => {
    if (!weekend) return;
    setSelectedWeekend(weekend);
    setIsDialogOpen(true);

    // Reset states
    setIsGeneratingSuggestion(true);
    setIsGeneratingImage(true);
    setSuggestion('');
    setImageUrl('');

    try {
      const suggestionInput: SuggestActivityInput = {
        holidayName: weekend.holidayName,
        duration: weekend.duration,
        dateRange: formatDateRange(weekend.startDate, weekend.endDate),
      };
      
      const suggestionPromise = suggestActivity(suggestionInput);
      const suggestionResult = await suggestionPromise;
      
      setSuggestion(suggestionResult.suggestion);
      setIsGeneratingSuggestion(false);
      
      const imagePromise = generateActivityImage({ imagePrompt: suggestionResult.imagePrompt });
      const imageResult = await imagePromise;
      setImageUrl(imageResult.imageUrl);

    } catch (error) {
      console.error("Gagal menghasilkan saran atau gambar:", error);
      if (!suggestion) {
        setSuggestion("Maaf, terjadi kesalahan saat mencoba memberikan ide liburan. Silakan coba lagi nanti.");
      }
      setImageUrl('https://placehold.co/600x400.png');
    } finally {
      setIsGeneratingSuggestion(false);
      setIsGeneratingImage(false);
    }
  };


  const longWeekends = useMemo(() => {
    const potentialWeekends: LongWeekend[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holidayDates = new Set(holidays.map(h => new Date(h.tanggal.replace(/-/g, '/')).toDateString()));
    const isSaturdayWorkday = workSchedule === 'senin-sabtu';

    let upcomingHolidays = holidays
      .map(h => ({ ...h, dateObj: new Date(h.tanggal.replace(/-/g, '/')) }))
      .filter(h => h.dateObj.getFullYear() === year && h.dateObj >= today);
    
    if (employmentType === 'private') {
      upcomingHolidays = upcomingHolidays.filter(h => !h.is_cuti);
    }

    for (const holiday of upcomingHolidays) {
      const date = holiday.dateObj;
      const day = date.getDay();

      if (day === 0) continue; 
      if (day === 6 && isSaturdayWorkday) continue;

      if (day === 1) { // Monday
        const weekendEnd = date;
        const weekendStart = new Date(date);
        let duration;

        if (isSaturdayWorkday) {
            weekendStart.setDate(date.getDate() - 1); // Starts Sunday
            duration = 2;
        } else {
            weekendStart.setDate(date.getDate() - 2); // Starts Saturday
            duration = 3;
        }
        potentialWeekends.push({
          title: 'Libur Panjang Akhir Pekan',
          startDate: weekendStart,
          endDate: weekendEnd,
          holidayName: holiday.keterangan,
          duration: duration,
        });
      } else if (day === 2) { // Tuesday ("Harpitnas" on Monday)
        const monday = new Date(date);
        monday.setDate(date.getDate() - 1);
        if (!holidayDates.has(monday.toDateString())) {
            const weekendEnd = date;
            const weekendStart = new Date(date);
            let duration;

            if (isSaturdayWorkday) {
                weekendStart.setDate(date.getDate() - 2); // Starts Sunday
                duration = 3;
            } else {
                weekendStart.setDate(date.getDate() - 3); // Starts Saturday
                duration = 4;
            }
            potentialWeekends.push({
                title: 'Potensi Libur Panjang',
                startDate: weekendStart,
                endDate: weekendEnd,
                holidayName: holiday.keterangan,
                duration,
                suggestion: 'Ambil cuti pada hari Senin',
            });
        }
      } else if (day === 4 && !isSaturdayWorkday) { // Thursday ("Harpitnas" on Friday)
        const friday = new Date(date);
        friday.setDate(date.getDate() + 1);
        if (!holidayDates.has(friday.toDateString())) {
            const weekendStart = date;
            const weekendEnd = new Date(date);
            weekendEnd.setDate(date.getDate() + 3); // Ends Sunday
            potentialWeekends.push({
              title: 'Potensi Libur Panjang',
              startDate: weekendStart,
              endDate: weekendEnd,
              holidayName: holiday.keterangan,
              duration: 4,
              suggestion: 'Ambil cuti pada hari Jumat',
            });
        }
      } else if (day === 5) { // Friday
        const weekendStart = date;
        const weekendEnd = new Date(date);
        if (isSaturdayWorkday) {
            weekendEnd.setDate(date.getDate() + 2); // Ends Sunday
            potentialWeekends.push({
                title: 'Potensi Libur Panjang',
                startDate: weekendStart,
                endDate: weekendEnd,
                holidayName: holiday.keterangan,
                duration: 3,
                suggestion: 'Ambil cuti pada hari Sabtu',
            });
        } else {
            weekendEnd.setDate(date.getDate() + 2); // Ends Sunday
            potentialWeekends.push({
                title: 'Libur Panjang Akhir Pekan',
                startDate: weekendStart,
                endDate: weekendEnd,
                holidayName: holiday.keterangan,
                duration: 3,
            });
        }
      }
    }

    return potentialWeekends.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [holidays, year, employmentType, workSchedule]);

  return (
    <>
      <div className="mt-8">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plane className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-headline">Perencana Libur Panjang {year}</CardTitle>
            </div>
            <div className="pt-4 mt-4 border-t border-border/80">
                  <p className="text-sm text-muted-foreground mb-3">
                  Sesuaikan rekomendasi liburan berdasarkan tipe kepegawaian dan jadwal kerja Anda.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                      <div>
                          <Label className="text-xs font-semibold text-muted-foreground">Tipe Kepegawaian</Label>
                          <RadioGroup
                              value={employmentType}
                              onValueChange={(value: 'pns' | 'private') => setEmploymentType(value)}
                              className="flex items-center gap-6 mt-1"
                          >
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="pns" id="pns" />
                                  <Label htmlFor="pns" className="font-normal cursor-pointer">PNS / ASN</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="private" id="private" />
                                  <Label htmlFor="private" className="font-normal cursor-pointer">Swasta</Label>
                              </div>
                          </RadioGroup>
                      </div>
                      <div>
                          <Label className="text-xs font-semibold text-muted-foreground">Jadwal Kerja</Label>
                          <RadioGroup
                              value={workSchedule}
                              onValueChange={(value: 'senin-jumat' | 'senin-sabtu') => setWorkSchedule(value)}
                              className="flex items-center gap-6 mt-1"
                          >
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="senin-jumat" id="senin-jumat" />
                                  <Label htmlFor="senin-jumat" className="font-normal cursor-pointer">Senin - Jumat</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="senin-sabtu" id="senin-sabtu" />
                                  <Label htmlFor="senin-sabtu" className="font-normal cursor-pointer">Senin - Sabtu</Label>
                              </div>
                          </RadioGroup>
                      </div>
                  </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {longWeekends.length > 0 ? (
              longWeekends.map((weekend, index) => (
                <div 
                  key={index} 
                  onClick={() => handleWeekendClick(weekend)}
                  className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex flex-col items-center justify-center h-16 w-16 bg-primary text-primary-foreground rounded-lg p-2 text-center">
                          <span className="text-3xl font-bold">{weekend.duration}</span>
                          <span className="text-xs font-medium leading-tight">HARI</span>
                      </div>
                  </div>
                  <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{weekend.title}</p>
                          <p className="text-sm text-muted-foreground">{weekend.holidayName}</p>
                        </div>
                        <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 border-primary/50 text-primary/80">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Lihat Ide</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm font-medium text-primary">
                          <CalendarDays className="w-4 h-4" />
                          <span>{formatDateRange(weekend.startDate, weekend.endDate)}</span>
                      </div>
                      {weekend.suggestion && (
                        <div className="mt-2">
                            <p className="text-xs text-accent-foreground bg-accent rounded-full px-3 py-1 mt-2 inline-block font-semibold">
                                Saran: {weekend.suggestion}
                            </p>
                        </div>
                      )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-6">
                <p>Tidak ada potensi libur panjang yang akan datang untuk filter yang dipilih.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">{selectedWeekend?.title}</DialogTitle>
                 <p className="text-sm text-muted-foreground">{selectedWeekend?.holidayName}</p>
              </div>
            </div>
             <div className="flex items-center gap-2 text-sm font-medium text-primary/90">
                <CalendarDays className="w-4 h-4" />
                <span>{selectedWeekend && formatDateRange(selectedWeekend.startDate, selectedWeekend.endDate)}</span>
            </div>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="w-full aspect-video rounded-lg bg-secondary/40 flex items-center justify-center overflow-hidden border">
              {isGeneratingImage ? (
                <div className="h-full w-full flex flex-col items-center justify-center bg-transparent gap-3 text-muted-foreground animate-pulse">
                  <ImageIcon className="w-14 h-14" />
                  <p className="font-medium">Membuat gambar inspiratif...</p>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={suggestion.substring(0, 100)}
                  className="w-full h-full object-cover animate-in fade-in duration-300"
                />
              )}
            </div>
            <div className="text-foreground/90">
              {isGeneratingSuggestion ? (
                <div className="space-y-3 pt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <p className="text-base leading-relaxed whitespace-pre-wrap">{suggestion}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
