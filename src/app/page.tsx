'use client';

import { useState, useEffect } from 'react';
import { startOfMonth } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HolidayCalendar } from '@/components/holiday-calendar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Holiday } from '@/types/holiday';
import { useToast } from "@/hooks/use-toast"

const years = Array.from({ length: 13 }, (_, i) => (2018 + i).toString());
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: new Date(0, i).toLocaleString('id-ID', { month: 'long' }),
}));

export default function Home() {
  const { toast } = useToast();
  const [displayMonth, setDisplayMonth] = useState<Date>(startOfMonth(new Date()));
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        const year = displayMonth.getFullYear();
        const month = displayMonth.getMonth() + 1; // getMonth() is 0-indexed

        const url = `https://dayoffapi.vercel.app/api?month=${month}&year=${year}`;
          
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Gagal mengambil data hari libur.');
        }
        const data = await response.json();
        
        // The API might return an empty object {} if no holidays, handle this.
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
  }, [displayMonth, toast]);

  const handleYearChange = (newYear: string) => {
    const currentMonth = displayMonth.getMonth();
    setDisplayMonth(new Date(parseInt(newYear), currentMonth, 1));
  };

  const handleMonthChange = (newMonth: string) => {
    const currentYear = displayMonth.getFullYear();
    setDisplayMonth(new Date(currentYear, parseInt(newMonth), 1));
  };
  
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
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
            <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-2'>
              <div>
                <CardTitle className="font-headline">Kalender Hari Libur Indonesia</CardTitle>
                <CardDescription>Jelajahi hari libur nasional dan cuti bersama.</CardDescription>
              </div>
              <div className="flex flex-row gap-2 pt-4 sm:pt-0">
                <Select value={displayMonth.getFullYear().toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-full sm:w-[120px]">
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
                <Select value={displayMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-full max-w-md">
              <HolidayCalendar
                mode="single"
                month={displayMonth}
                onMonthChange={setDisplayMonth}
                holidays={holidays}
                loading={loading}
                showOutsideDays
                fixedWeeks
                classNames={{ caption_layout: 'flex justify-between' }}
              />
            </div>
            <div className="flex justify-center items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span>Hari Libur Nasional</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span>Cuti Bersama</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
