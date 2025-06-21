
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Calendar as CalendarIcon, Wand2, CalendarDays, Bot } from 'lucide-react';

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
import { WeatherWidget } from '@/components/weather-widget';
import { ChatInterface } from '@/components/chat-interface';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { cn } from '@/lib/utils';

const years = Array.from({ length: 13 }, (_, i) => (2018 + i).toString());
const themes = [ 'Petualangan', 'Relaksasi', 'Kuliner', 'Budaya' ];

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
  const [inspirationData, setInspirationData] = useState<{
    weekend: LongWeekend | null;
    theme: string;
  }>({ weekend: null, theme: '' });

  // State for floating chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // State for welcome dialog
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  // State for scroll detection
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleScrollToMonth = useCallback((monthIndex: number) => {
    monthRefs.current[monthIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
        // Set a small delay to allow the main UI to render first
        const timer = setTimeout(() => {
            setIsWelcomeOpen(true);
        }, 500);
        return () => clearTimeout(timer);
    }
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

    const randomWeekend = upcomingLongWeekends[Math.floor(Math.random() * upcomingLongWeekends.length)];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    
    setInspirationData({ weekend: randomWeekend, theme: randomTheme });
    setIsInspirationOpen(true);
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
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className={cn(
          "sticky top-0 z-30 flex h-14 items-center justify-between px-4 transition-colors duration-300 sm:h-auto sm:px-6 sm:py-4",
          scrolled ? "border-b bg-background/80 backdrop-blur-sm" : "border-b border-transparent"
      )}>
         <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Liburku</h1>
                <p className="text-xs text-muted-foreground">Kalender & Perencana Liburan AI</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <WeatherWidget />
            <ThemeToggle />
          </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
        <div className="pt-4" />
        <Card className="w-full shadow-sm">
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between sm:items-start gap-4'>
              <div className="flex-grow">
                <CardTitle className="text-2xl">Kalender Libur {selectedYear}</CardTitle>
                <CardDescription className="mt-1.5">Jelajahi hari libur nasional dan cuti bersama. Klik tanggal untuk detail.</CardDescription>
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
             <div className="pt-4 mt-4 border-t flex flex-wrap items-center justify-between gap-y-2">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <span>Hari Libur Nasional</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span>Cuti Bersama</span>
                </div>
              </div>
              {currentDate && (
                <Button 
                    variant="ghost" 
                    onClick={handleGoToToday} 
                    className="text-sm font-medium h-auto p-1.5 rounded-md"
                    aria-label="Lompat ke bulan ini"
                >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {currentDate}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                   <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-7 w-8 rounded-md" />
                    </CardHeader>
                    <CardContent className="p-3">
                      <Skeleton key={i} className="w-full h-[220px] rounded-lg" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, monthIndex) => {
                   const monthDate = new Date(selectedYear, monthIndex, 1);
                   const monthName = monthDate.toLocaleString('id-ID', { month: 'long' });
                   return (
                    <Card 
                      key={monthIndex} 
                      ref={(el) => (monthRefs.current[monthIndex] = el)}
                      className="flex flex-col transition-shadow duration-300 hover:shadow-md"
                    >
                      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                        <CardTitle className="text-base font-semibold text-foreground">
                          {monthName}
                        </CardTitle>
                         <div className="text-2xl font-bold text-primary select-none">
                          {(monthIndex + 1).toString().padStart(2, '0')}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow flex justify-center items-center p-3">
                        <HolidayCalendar
                          month={monthDate}
                          holidays={holidays}
                          showOutsideDays
                          fixedWeeks
                          classNames={{
                            caption: 'hidden',
                            table: 'w-full border-collapse space-y-1',
                            day: "h-8 w-8 text-xs",
                            head_cell: "w-8 font-normal text-muted-foreground text-[0.7rem]",
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
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
             <Card className="w-full shadow-sm sticky top-28">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Wand2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Inspirasi Instan</CardTitle>
                      <CardDescription>Biarkan AI merencanakan untuk Anda!</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="lg" 
                    className="w-full font-semibold"
                    onClick={handleSurpriseMe}
                    disabled={loading || upcomingLongWeekends.length === 0}
                  >
                    <Wand2 className="mr-2 h-5 w-5" />
                    Kejutkan Saya!
                  </Button>
                </CardContent>
              </Card>
          </div>
        </div>
      </main>
      
      <WelcomeDialog isOpen={isWelcomeOpen} onOpenChange={setIsWelcomeOpen} />

      <SuggestionDialog
        isOpen={isInspirationOpen}
        onOpenChange={setIsInspirationOpen}
        weekend={inspirationData.weekend}
        preselectedTheme={inspirationData.theme}
      />

      {/* Floating Chat Widget */}
      {isChatOpen && (
        <div className={`fixed bottom-6 right-6 z-40 w-[400px] max-w-[calc(100vw-3rem)] bg-card rounded-xl shadow-2xl border flex flex-col transition-all duration-300 ease-in-out animate-in fade-in zoom-in-95 slide-in-from-bottom-4 ${isChatMinimized ? 'h-[76px]' : 'h-[600px] max-h-[calc(100vh-8.5rem)]'}`}>
          <ChatInterface
            holidays={holidays}
            year={selectedYear}
            isMinimized={isChatMinimized}
            onMinimizeToggle={() => setIsChatMinimized(!isChatMinimized)}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}

      {/* FAB to open chat */}
      {!isChatOpen && (
        <Button
          onClick={() => {
            setIsChatOpen(true);
            setIsChatMinimized(false);
          }}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-in fade-in zoom-in-95"
          aria-label="Buka Asisten AI"
          title="Buka Asisten AI"
        >
          <Bot className="h-7 w-7" />
        </Button>
      )}
    </div>
  );
}
