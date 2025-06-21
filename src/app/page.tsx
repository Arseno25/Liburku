'use client';

import { useState, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        const response = await fetch(`https://dayoffapi.vercel.app/api?year=${year}`);
        if (!response.ok) {
          throw new Error('Failed to fetch holiday data.');
        }
        const data = await response.json();
        setHolidays(data);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch holiday data. Please try again later.",
        })
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, [year, toast]);

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    setDisplayMonth(new Date(parseInt(newYear), displayMonth.getMonth(), 1));
  };

  const handleMonthChange = (newMonth: string) => {
    setDisplayMonth(new Date(parseInt(year), parseInt(newMonth), 1));
  };
  
  useEffect(() => {
    const newYear = displayMonth.getFullYear().toString();
    if (newYear !== year && years.includes(newYear)) {
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
