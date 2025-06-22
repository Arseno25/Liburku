'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Calendar from 'react-calendar';
import { Calendar as CalendarIcon, Wand2, CalendarDays, Bot } from 'lucide-react';
import './react-calendar.css';

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
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ClockWidget } from '@/components/clock-widget';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

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
  const [userLocation, setUserLocation] = useState<string | null>(null);

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
    if (holidays.length === 0) return [];
  
    const findWeekends = (isSaturdayWorkday: boolean): LongWeekend[] => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const relevantHolidays = holidays
        .map(h => ({ ...h, dateObj: new Date(h.tanggal.replace(/-/g, '/')) }))
        .filter(h => h.dateObj.getFullYear() === selectedYear);
  
      const holidayDateSet = new Set(relevantHolidays.map(h => h.dateObj.toDateString()));
      const holidayMap = new Map(relevantHolidays.map(h => [h.dateObj.toDateString(), h.keterangan]));
      
      const sortedUpcomingHolidays = relevantHolidays
        .filter(h => h.dateObj >= today)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  
      const isOffDay = (date: Date): boolean => {
        const day = date.getDay();
        if (day === 0) return true; // Sunday
        if (day === 6 && !isSaturdayWorkday) return true; // Saturday for 5-day week
        return holidayDateSet.has(date.toDateString());
      };
  
      const allWeekends: LongWeekend[] = [];
      const processedDates = new Set<string>();
  
      // Pass 1: Find concrete long weekends
      for (const holiday of sortedUpcomingHolidays) {
        const holidayDate = holiday.dateObj;
        if (processedDates.has(holidayDate.toDateString())) continue;
  
        let currentStart = new Date(holidayDate);
        while (true) {
          const prevDay = new Date(currentStart);
          prevDay.setDate(currentStart.getDate() - 1);
          if (isOffDay(prevDay)) {
            currentStart = prevDay;
          } else {
            break;
          }
        }
        const startDate = currentStart;
  
        let currentEnd = new Date(holidayDate);
        while (true) {
          const nextDay = new Date(currentEnd);
          nextDay.setDate(currentEnd.getDate() + 1);
          if (isOffDay(nextDay)) {
            currentEnd = nextDay;
          } else {
            break;
          }
        }
        const endDate = currentEnd;
  
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1;
        
        if (duration >= (isSaturdayWorkday ? 2 : 3)) {
          let d = new Date(startDate);
          const holidaysInWeekend: string[] = [];
          while (d <= endDate) {
            const dString = d.toDateString();
            if (holidayMap.has(dString)) {
              holidaysInWeekend.push(holidayMap.get(dString)!);
              processedDates.add(dString);
            }
            d.setDate(d.getDate() + 1);
          }
          allWeekends.push({
            title: 'Libur Panjang Akhir Pekan',
            startDate,
            endDate,
            holidayName: holidaysInWeekend.join(' & '),
            duration,
          });
        }
      }
  
      // Pass 2: Find potential long weekends (Harpitnas)
      for (const holiday of sortedUpcomingHolidays) {
        const holidayDate = holiday.dateObj;
        const day = holidayDate.getDay();
  
        if (day === 2) { // Tuesday holiday
          const monday = new Date(holidayDate);
          monday.setDate(holidayDate.getDate() - 1);
          if (!isOffDay(monday)) {
            const weekendStart = new Date(holidayDate);
            weekendStart.setDate(holidayDate.getDate() - (isSaturdayWorkday ? 2 : 3));
            allWeekends.push({
              title: 'Potensi Libur Panjang',
              startDate: weekendStart,
              endDate: holidayDate,
              holidayName: holiday.keterangan,
              duration: isSaturdayWorkday ? 3 : 4,
              suggestion: 'Ambil cuti pada hari Senin',
            });
          }
        }
  
        if (day === 4 && !isSaturdayWorkday) { // Thursday holiday
          const friday = new Date(holidayDate);
          friday.setDate(holidayDate.getDate() + 1);
          if (!isOffDay(friday)) {
            const weekendEnd = new Date(holidayDate);
            weekendEnd.setDate(holidayDate.getDate() + 3);
            allWeekends.push({
              title: 'Potensi Libur Panjang',
              startDate: holidayDate,
              endDate: weekendEnd,
              holidayName: holiday.keterangan,
              duration: 4,
              suggestion: 'Ambil cuti pada hari Jumat',
            });
          }
        }
  
        if (day === 5 && isSaturdayWorkday) { // Friday holiday, but Sat is work
          const saturday = new Date(holidayDate);
          saturday.setDate(holidayDate.getDate() + 1);
          if (!isOffDay(saturday)) {
            const weekendEnd = new Date(holidayDate);
            weekendEnd.setDate(holidayDate.getDate() + 2);
            allWeekends.push({
              title: 'Potensi Libur Panjang',
              startDate: holidayDate,
              endDate: weekendEnd,
              holidayName: holiday.keterangan,
              duration: 3,
              suggestion: 'Ambil cuti pada hari Sabtu',
            });
          }
        }
      }
      return allWeekends;
    }
  
    // Get all possibilities for "Surprise Me"
    const weekends5day = findWeekends(false);
    const weekends6day = findWeekends(true);
  
    const combined = [...weekends5day, ...weekends6day];
    const uniqueWeekends = Array.from(new Map(combined.map(w => [`${w.startDate.getTime()}-${w.endDate.getTime()}-${w.suggestion || ''}`, w])).values());
  
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
    <div className="flex min-h-screen w-full flex-col">
      <header className={cn(
          "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b px-4 transition-colors duration-300 sm:h-auto sm:px-6 sm:py-4",
          scrolled ? "border-border bg-background/80 backdrop-blur-sm" : "border-transparent"
      )}>
         <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Liburku</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Kalender & Perencana Liburan AI</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <ClockWidget />
            <WeatherWidget onLocationUpdate={setUserLocation} />
            <ThemeToggle />
          </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
        <div className="pt-4" />
        <Card className="w-full">
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between sm:items-start gap-4'>
              <div className="flex-grow">
                <CardTitle>Kalender Libur {selectedYear}</CardTitle>
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
             <div className="pt-4 mt-4 border-t flex flex-wrap items-center justify-start gap-x-6 gap-y-2">
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
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                   <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-7 w-8 rounded-md" />
                    </CardHeader>
                    <CardContent className="p-0">
                      <Skeleton key={i} className="w-full h-[220px] rounded-lg" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 12 }).map((_, monthIndex) => {
                   const monthDate = new Date(selectedYear, monthIndex, 1);
                   const monthName = monthDate.toLocaleString('id-ID', { month: 'long' });
                   return (
                    <Card 
                      key={monthIndex} 
                      ref={(el) => (monthRefs.current[monthIndex] = el)}
                      className="flex flex-col bg-card/70 transition-shadow duration-300 hover:shadow-lg"
                      data-magnetic
                    >
                      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                        <h3 className="text-base font-semibold text-foreground">
                          {monthName}
                        </h3>
                         <div className="text-2xl font-bold text-primary/80 dark:text-primary/70 select-none">
                          {(monthIndex + 1).toString().padStart(2, '0')}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow flex p-2 justify-center">
                        <HolidayCalendar
                          activeStartDate={monthDate}
                          holidays={holidays}
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
                userLocation={userLocation}
              />
            )}
          </div>
          <div className="lg:col-span-1">
             <Card className="w-full sticky top-28" data-magnetic>
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
                    data-magnetic
                  >
                    <Wand2 className="mr-2 h-5 w-5" />
                    Kejutkan Saya!
                  </Button>
                </CardContent>
              </Card>
          </div>
        </div>
      </main>

      <footer className="border-t bg-background py-5 mt-auto">
        <div className="container flex items-center justify-center text-sm text-muted-foreground">
            Developer by{' '}
            <a
                href="https://github.com/arseno25"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-semibold text-primary/90 transition-colors hover:text-primary"
            >
                Arseno
            </a>
        </div>
      </footer>
      
      <WelcomeDialog isOpen={isWelcomeOpen} onOpenChange={setIsWelcomeOpen} />

      <SuggestionDialog
        isOpen={isInspirationOpen}
        onOpenChange={setIsInspirationOpen}
        weekend={inspirationData.weekend}
        preselectedTheme={inspirationData.theme}
        userLocation={userLocation}
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
          data-magnetic
        >
          <Bot className="h-7 w-7" />
        </Button>
      )}
    </div>
  );
}
