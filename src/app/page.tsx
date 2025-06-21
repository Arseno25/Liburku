'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Calendar as CalendarIcon, Info, Wand2, CalendarDays } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HolidayCalendar } from '@/components/holiday-calendar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Holiday } from '@/types/holiday';
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from '@/components/ui/skeleton';
import { LongWeekend, LongWeekendPlanner } from '@/components/long-weekend-planner';
import { Button } from '@/components/ui/button';
import { SuggestionDialog } from '@/components/suggestion-dialog';
import { suggestActivity, SuggestActivityInput } from '@/ai/flows/suggest-long-weekend-activity-flow';
import { generateActivityImage } from '@/ai/flows/generate-activity-image-flow';
import { generateItinerary, GenerateItineraryInput } from '@/ai/flows/generate-itinerary-flow';
import { WeatherWidget } from '@/components/weather-widget';

const years = Array.from({ length: 13 }, (_, i) => (2018 + i).toString());

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const themes = [ 'Petualangan', 'Relaksasi', 'Kuliner', 'Budaya' ];

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

export default function Home() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState('');
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scrollToMonth, setScrollToMonth] = useState<number | null>(null);

  // State for Instant Inspiration feature
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [isGeneratingInspiration, setIsGeneratingInspiration] = useState(false);
  const [inspirationResult, setInspirationResult] = useState<{
    weekend: LongWeekend | null;
    suggestion: string;
    imageUrl: string;
    itinerary: string;
    theme: string;
  }>({ weekend: null, suggestion: '', imageUrl: '', itinerary: '', theme: '' });

  const handleScrollToMonth = useCallback((monthIndex: number) => {
    monthRefs.current[monthIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  useEffect(() => {
    if (scrollToMonth !== null && !loading) {
      handleScrollToMonth(scrollToMonth);
      setScrollToMonth(null); // Reset after scrolling
    }
  }, [scrollToMonth, loading, handleScrollToMonth]);

  useEffect(() => {
    setCurrentDate(
        new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    );
  }, []);

  const upcomingLongWeekends = useMemo(() => {
      const allUpcoming: LongWeekend[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const holidayDates = new Set(holidays.map(h => new Date(h.tanggal.replace(/-/g, '/')).toDateString()));

      const processHolidays = (filteredHolidays: Holiday[], isSaturdayWorkday: boolean) => {
          let upcomingHolidays = filteredHolidays
            .map(h => ({ ...h, dateObj: new Date(h.tanggal.replace(/-/g, '/')) }))
            .filter(h => h.dateObj.getFullYear() === selectedYear && h.dateObj >= today);

          for (const holiday of upcomingHolidays) {
              const date = holiday.dateObj;
              const day = date.getDay();

              if (day === 0) continue;
              if (day === 6 && isSaturdayWorkday) continue;
              
              let potentialWeekend: Omit<LongWeekend, 'title'> | null = null;
              
              if (day === 1) { // Monday
                  const weekendEnd = date;
                  const weekendStart = new Date(date);
                  let duration;
                  if (isSaturdayWorkday) { weekendStart.setDate(date.getDate() - 1); duration = 2; } 
                  else { weekendStart.setDate(date.getDate() - 2); duration = 3; }
                  potentialWeekend = { startDate: weekendStart, endDate: weekendEnd, holidayName: holiday.keterangan, duration: duration };
              } else if (day === 2) { // Tuesday ("Harpitnas" on Monday)
                  const monday = new Date(date);
                  monday.setDate(date.getDate() - 1);
                  if (!holidayDates.has(monday.toDateString())) {
                      const weekendEnd = date;
                      const weekendStart = new Date(date);
                      let duration;
                      if (isSaturdayWorkday) { weekendStart.setDate(date.getDate() - 2); duration = 3; } 
                      else { weekendStart.setDate(date.getDate() - 3); duration = 4; }
                      potentialWeekend = { startDate: weekendStart, endDate: weekendEnd, holidayName: holiday.keterangan, duration, suggestion: 'Ambil cuti pada hari Senin' };
                  }
              } else if (day === 4 && !isSaturdayWorkday) { // Thursday ("Harpitnas" on Friday)
                  const friday = new Date(date);
                  friday.setDate(date.getDate() + 1);
                  if (!holidayDates.has(friday.toDateString())) {
                      const weekendStart = date;
                      const weekendEnd = new Date(date);
                      weekendEnd.setDate(date.getDate() + 3);
                      potentialWeekend = { startDate: weekendStart, endDate: weekendEnd, holidayName: holiday.keterangan, duration: 4, suggestion: 'Ambil cuti pada hari Jumat' };
                  }
              } else if (day === 5) { // Friday
                  const weekendStart = date;
                  const weekendEnd = new Date(date);
                  let duration, suggestion;
                  if (isSaturdayWorkday) { weekendEnd.setDate(date.getDate() + 2); duration = 3; suggestion = 'Ambil cuti pada hari Sabtu';} 
                  else { weekendEnd.setDate(date.getDate() + 2); duration = 3; }
                  potentialWeekend = { startDate: weekendStart, endDate: weekendEnd, holidayName: holiday.keterangan, duration, suggestion };
              }

              if(potentialWeekend) {
                  allUpcoming.push({ ...potentialWeekend, title: potentialWeekend.suggestion ? 'Potensi Libur Panjang' : 'Libur Panjang Akhir Pekan'});
              }
          }
      };

      // Process for both schedules to get all possibilities
      processHolidays(holidays, false); // Senin-Jumat
      processHolidays(holidays, true);  // Senin-Sabtu

      // Remove duplicates
      const uniqueWeekends = Array.from(new Map(allUpcoming.map(w => [w.startDate.getTime(), w])).values());
      return uniqueWeekends.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [holidays, selectedYear]);

  const handleSurpriseMe = async () => {
    if (upcomingLongWeekends.length === 0) {
      toast({
        variant: "destructive",
        title: "Tidak Ditemukan",
        description: `Tidak ada potensi libur panjang di sisa tahun ${selectedYear}.`,
      });
      return;
    }

    setIsGeneratingInspiration(true);
    setIsInspirationOpen(true);
    setInspirationResult({ weekend: null, suggestion: '', imageUrl: '', itinerary: '', theme: '' });

    try {
      const randomWeekend = upcomingLongWeekends[Math.floor(Math.random() * upcomingLongWeekends.length)];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];

      const suggestionInput: SuggestActivityInput = {
        holidayName: randomWeekend.holidayName,
        duration: randomWeekend.duration,
        dateRange: formatDateRange(randomWeekend.startDate, randomWeekend.endDate),
        theme: randomTheme,
      };

      const suggestionResult = await suggestActivity(suggestionInput);
      setInspirationResult(prev => ({ ...prev, weekend: randomWeekend, theme: randomTheme, suggestion: suggestionResult.suggestion }));
      
      const imageResult = await generateActivityImage({ imagePrompt: suggestionResult.imagePrompt });
      setInspirationResult(prev => ({ ...prev, imageUrl: imageResult.imageUrl }));
      
      setIsGeneratingInspiration(false); // Suggestion and image are ready

      const itineraryInput: GenerateItineraryInput = {
          holidayName: randomWeekend.holidayName,
          duration: randomWeekend.duration,
          dateRange: formatDateRange(randomWeekend.startDate, randomWeekend.endDate),
          theme: randomTheme,
          suggestion: suggestionResult.suggestion,
      };

      const itineraryResult = await generateItinerary(itineraryInput);
      setInspirationResult(prev => ({ ...prev, itinerary: itineraryResult.itinerary }));

    } catch (error) {
      console.error(error);
      setIsGeneratingInspiration(false);
      setIsInspirationOpen(false);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Tidak dapat menghasilkan inspirasi liburan. Silakan coba lagi.",
      });
    }
  };
  
  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const url = selectedYear === currentYear 
          ? `https://dayoffapi.vercel.app/api`
          : `https://dayoffapi.vercel.app/api?year=${selectedYear}`;
          
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Gagal mengambil data hari libur.');
        }
        const data = await response.json();
        
        if (Array.isArray(data)) {
            setHolidays(data);
        } else {
            setHolidays([]);
        }
        
      } catch (error) {
        console.error(error);
        setHolidays([]);
        toast({
          variant: "destructive",
          title: "Gagal",
          description: "Tidak dapat mengambil data hari libur. Silakan coba lagi nanti.",
        })
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [selectedYear, toast]);

  const handleGoToToday = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();

    if (selectedYear !== currentYear) {
      setSelectedYear(currentYear);
      setScrollToMonth(currentMonthIndex);
    } else {
      handleScrollToMonth(currentMonthIndex);
    }
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(parseInt(newYear));
  };
  
  return (
    <main className="min-h-screen w-full flex flex-col items-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">Liburku</h1>
                <p className="text-sm text-muted-foreground">Kalender & Perencana Liburan AI</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <WeatherWidget />
            <ThemeToggle />
          </div>
        </header>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between sm:items-start gap-4'>
              <div className="flex-grow">
                <CardTitle className="font-headline">Kalender Hari Libur Indonesia</CardTitle>
                <CardDescription>Jelajahi hari libur nasional dan cuti bersama untuk tahun {selectedYear}.</CardDescription>
              </div>
              <div className="flex-shrink-0">
                <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
             <div className="pt-4 mt-4 border-t border-border/80 flex flex-wrap items-center justify-between gap-y-2">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-destructive/80"></div>
                  <span>Hari Libur Nasional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-warning/80"></div>
                  <span>Cuti Bersama</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Klik tanggal untuk detail</span>
                </div>
              </div>
              {currentDate && (
                <Button 
                    variant="ghost" 
                    onClick={handleGoToToday} 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground h-auto p-1.5 rounded-md"
                    aria-label="Lompat ke bulan ini"
                >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {currentDate}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                   <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-24 rounded-md" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton key={i} className="w-full h-[280px] rounded-lg" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, monthIndex) => {
                   const monthDate = new Date(selectedYear, monthIndex, 1);
                   const monthName = monthDate.toLocaleString('id-ID', { month: 'long' });
                   return (
                    <Card 
                      key={monthIndex} 
                      ref={(el) => (monthRefs.current[monthIndex] = el)}
                      className="flex flex-col transition-shadow duration-300 hover:shadow-xl overflow-hidden bg-card border"
                    >
                      <CardHeader className="text-center border-b p-4 bg-muted/50">
                        <CardTitle className="text-lg font-semibold font-headline text-secondary-foreground">
                          {monthName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow flex justify-center items-center p-2">
                        <HolidayCalendar
                          month={monthDate}
                          holidays={holidays}
                          showOutsideDays
                          fixedWeeks
                          classNames={{
                            caption: 'hidden',
                            table: 'w-full border-collapse space-y-1.5',
                            day: "h-9 w-9",
                            head_cell: "w-9 font-medium text-muted-foreground",
                          }}
                        />
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            {!loading && holidays.length > 0 && (
              <LongWeekendPlanner 
                holidays={holidays} 
                year={selectedYear}
                onScrollToMonth={handleScrollToMonth} 
              />
            )}
          </div>
          <div className="lg:col-span-1">
             <Card className="w-full shadow-lg sticky top-8">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Wand2 className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline">Inspirasi Instan</CardTitle>
                  </div>
                   <CardDescription>Bingung mau liburan ke mana? Biarkan AI yang merencanakan untuk Anda!</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={handleSurpriseMe}
                    disabled={isGeneratingInspiration || loading}
                  >
                    <Wand2 className="mr-2 h-5 w-5" />
                    Kejutkan Saya!
                  </Button>
                </CardContent>
              </Card>
          </div>
        </div>

      </div>
      
      <SuggestionDialog
        isOpen={isInspirationOpen}
        onOpenChange={setIsInspirationOpen}
        weekend={inspirationResult.weekend}
        theme={inspirationResult.theme}
        suggestion={inspirationResult.suggestion}
        imageUrl={inspirationResult.imageUrl}
        itinerary={inspirationResult.itinerary}
        isGeneratingSuggestion={isGeneratingInspiration}
        isGeneratingItinerary={!!inspirationResult.suggestion && !inspirationResult.itinerary}
        showThemeSelection={false}
      />
    </main>
  );
}
