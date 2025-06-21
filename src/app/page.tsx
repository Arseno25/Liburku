'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Info } from 'lucide-react';

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
            <div className="pt-4 mt-4 border-t border-border/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
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
                      <CardHeader className="text-center border-b p-4 bg-accent/5 dark:bg-accent/10">
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
