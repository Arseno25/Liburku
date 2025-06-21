'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Plane, Briefcase } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HolidayCalendar } from '@/components/holiday-calendar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Holiday } from '@/types/holiday';
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from '@/components/ui/skeleton';

const years = Array.from({ length: 13 }, (_, i) => (2018 + i).toString());

export default function Home() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        // Use default API endpoint for the current year
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
        setHolidays([]); // Clear holidays on error
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

  const {
    totalNationalHolidays,
    totalCollectiveLeave,
    upcomingNationalHolidays,
    upcomingCollectiveLeave,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day for accurate comparison

    // De-duplicate holidays to ensure one event per day, giving precedence to national holidays.
    const uniqueHolidaysMap = new Map<string, Holiday>();
    for (const holiday of holidays) {
      const dateStr = holiday.tanggal;
      const existing = uniqueHolidaysMap.get(dateStr);
      // Overwrite if no entry exists, or if the existing entry is collective leave and the new one is a national holiday.
      if (!existing || (existing.is_cuti && !holiday.is_cuti)) {
        uniqueHolidaysMap.set(dateStr, holiday);
      }
    }
    const uniqueHolidays = Array.from(uniqueHolidaysMap.values());

    return uniqueHolidays.reduce(
      (acc, holiday) => {
        // Replace hyphens with slashes to avoid timezone issues and treat date as local.
        const holidayDate = new Date(holiday.tanggal.replace(/-/g, '/'));
        holidayDate.setHours(0, 0, 0, 0); // Also normalize holiday date to start of the day

        const isUpcoming = holidayDate >= today;

        if (holiday.is_cuti) {
          acc.totalCollectiveLeave += 1;
          if (isUpcoming) {
            acc.upcomingCollectiveLeave += 1;
          }
        } else {
          acc.totalNationalHolidays += 1;
          if (isUpcoming) {
            acc.upcomingNationalHolidays += 1;
          }
        }
        return acc;
      },
      {
        totalNationalHolidays: 0,
        totalCollectiveLeave: 0,
        upcomingNationalHolidays: 0,
        upcomingCollectiveLeave: 0,
      }
    );
  }, [holidays]);


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
             <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">Liburku</h1>
          </div>
          <ThemeToggle />
        </header>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between sm:items-start gap-4'>
              <div className="flex-grow">
                <CardTitle className="font-headline">Kalender Hari Libur Indonesia</CardTitle>
                <CardDescription>Jelajahi hari libur nasional dan cuti bersama untuk tahun {selectedYear}. Angka di bawah menunjukkan sisa hari dari total hari libur.</CardDescription>
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
             <div className="border-t border-border/50 pt-4 mt-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
                {loading ? (
                    <>
                        <div className="flex items-center gap-4">
                           <Skeleton className="w-12 h-12 rounded-full" />
                           <div className="space-y-2">
                             <Skeleton className="h-6 w-8" />
                             <Skeleton className="h-4 w-32" />
                           </div>
                        </div>
                         <div className="flex items-center gap-4">
                           <Skeleton className="w-12 h-12 rounded-full" />
                           <div className="space-y-2">
                             <Skeleton className="h-6 w-8" />
                             <Skeleton className="h-4 w-24" />
                           </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-destructive/10 rounded-full">
                                <Plane className="w-6 h-6 text-destructive" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                  {upcomingNationalHolidays}<span className="text-lg font-normal text-muted-foreground"> / {totalNationalHolidays}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">Hari Libur Nasional</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="p-3 bg-warning/10 rounded-full">
                                <Briefcase className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                  {upcomingCollectiveLeave}<span className="text-lg font-normal text-muted-foreground"> / {totalCollectiveLeave}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">Cuti Bersama</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 bg-secondary/20">
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
                    <Card key={monthIndex} className="flex flex-col transition-shadow duration-300 hover:shadow-xl overflow-hidden bg-card">
                      <CardHeader className="text-center border-b p-4 bg-card/50">
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
      </div>
    </main>
  );
}
