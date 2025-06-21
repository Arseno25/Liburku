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

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 13 }, (_, i) => (2018 + i).toString());
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i.toString(),
  label: new Date(0, i).toLocaleString('default', { month: 'long' }),
}));

export default function Home() {
  const { toast } = useToast();
  const [year, setYear] = useState<string>(currentYear.toString());
  const [displayMonth, setDisplayMonth] = useState<Date>(startOfMonth(new Date()));
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchedKeys, setFetchedKeys] = useState(new Set<string>());

  useEffect(() => {
    const fetchHolidays = async () => {
      const fetchYear = displayMonth.getFullYear();
      const fetchMonth = displayMonth.getMonth();
      const fetchKey = `${fetchYear}-${fetchMonth}`;

      if (fetchedKeys.has(fetchKey)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`https://dayoffapi.vercel.app/api?year=${fetchYear}&month=${fetchMonth + 1}`);
        if (!response.ok) {
          throw new Error('Failed to fetch holiday data.');
        }
        const data: Holiday[] = await response.json();
        
        setHolidays(prevHolidays => {
            const newHolidays = data.filter(
                (h) => !prevHolidays.some((existing) => existing.date === h.date)
            );
            return [...prevHolidays, ...newHolidays];
        });
        
        setFetchedKeys(prev => new Set(prev).add(fetchKey));

      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch holiday data. Please try again later.",
        })
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [displayMonth, toast, fetchedKeys]);

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    const currentMonth = displayMonth.getMonth();
    // When year changes, reset holidays and fetched keys cache
    setHolidays([]);
    setFetchedKeys(new Set());
    setDisplayMonth(new Date(parseInt(newYear), currentMonth, 1));
  };

  const handleMonthChange = (newMonth: string) => {
    setDisplayMonth(new Date(parseInt(year), parseInt(newMonth), 1));
  };
  
  useEffect(() => {
    const newYear = displayMonth.getFullYear().toString();
    if (newYear !== year) {
        if (years.includes(newYear)) {
          // Navigated to a new year via calendar, reset holidays and fetched keys
          setHolidays([]);
          setFetchedKeys(new Set());
        }
        setYear(newYear);
    }
  }, [displayMonth, year]);

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
                <CardTitle className="font-headline">Indonesian Holiday Calendar</CardTitle>
                <CardDescription>Explore national holidays and joint leave days.</CardDescription>
              </div>
              <div className="flex flex-row gap-2 pt-4 sm:pt-0">
                <Select value={year} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Year" />
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
                    <SelectValue placeholder="Month" />
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
                    <span>National Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span>Joint Leave</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
