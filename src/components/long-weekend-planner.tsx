'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Holiday } from '@/types/holiday';
import { Plane, CalendarDays } from 'lucide-react';
import { SuggestionDialog } from './suggestion-dialog';

export interface LongWeekend {
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
  onScrollToMonth?: (monthIndex: number) => void;
  userLocation?: string | null;
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

export function LongWeekendPlanner({ holidays, year, onScrollToMonth, userLocation }: LongWeekendPlannerProps) {
  const [employmentType, setEmploymentType] = useState<'pns' | 'private'>('pns');
  const [workSchedule, setWorkSchedule] = useState<'senin-jumat' | 'senin-sabtu'>('senin-jumat');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeekend, setSelectedWeekend] = useState<LongWeekend | null>(null);

  const handleWeekendClick = (weekend: LongWeekend) => {
    onScrollToMonth?.(weekend.startDate.getMonth());
    setSelectedWeekend(weekend);
    setIsDialogOpen(true);
  };
  
  const longWeekends = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isSaturdayWorkday = workSchedule === 'senin-sabtu';

    // 1. Filter relevant holidays for the year
    let relevantHolidays = holidays
      .map(h => ({ ...h, dateObj: new Date(h.tanggal.replace(/-/g, '/')) }))
      .filter(h => h.dateObj.getFullYear() === year);

    if (employmentType === 'private') {
      relevantHolidays = relevantHolidays.filter(h => !h.is_cuti);
    }
    if (relevantHolidays.length === 0) return [];

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

    // Pass 1: Find concrete long weekends (contiguous off-days)
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
            processedDates.add(dString); // Mark as processed
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

      // Case: Holiday on Tuesday (sandwiched Monday)
      if (day === 2) {
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

      // Case: Holiday on Thursday (sandwiched Friday)
      if (day === 4 && !isSaturdayWorkday) {
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

       // Case: Holiday on Friday, but Saturday is a workday
       if (day === 5 && isSaturdayWorkday) {
         const saturday = new Date(holidayDate);
         saturday.setDate(holidayDate.getDate() + 1);
         if(!isOffDay(saturday)){
             const weekendEnd = new Date(holidayDate);
             weekendEnd.setDate(holidayDate.getDate() + 2); // ends sunday
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
    
    // 3. De-duplicate and sort
    const uniqueWeekends = Array.from(new Map(allWeekends.map(w => [`${w.startDate.getTime()}-${w.endDate.getTime()}-${w.suggestion || ''}`, w])).values());
    
    return uniqueWeekends.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [holidays, year, employmentType, workSchedule]);


  return (
    <>
      <Card className="w-full">
        <CardHeader>
           <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plane className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Perencana Libur Panjang {year}</CardTitle>
              <CardDescription>Sesuaikan rekomendasi berdasarkan jadwal Anda.</CardDescription>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs font-semibold text-muted-foreground">Tipe Kepegawaian</Label>
                        <RadioGroup
                            value={employmentType}
                            onValueChange={(value: 'pns' | 'private') => setEmploymentType(value)}
                            className="flex items-center gap-4 mt-2"
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
                            className="flex items-center gap-4 mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="senin-jumat" id="senin-jumat" />
                                <Label htmlFor="senin-jumat" className="font-normal cursor-pointer">5 Hari Kerja</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="senin-sabtu" id="senin-sabtu" />
                                <Label htmlFor="senin-sabtu" className="font-normal cursor-pointer">6 Hari Kerja</Label>
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
                className="p-4 border rounded-lg bg-card hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer group"
                data-magnetic
              >
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <p className="font-semibold text-primary">{weekend.title}</p>
                        <p className="text-sm text-muted-foreground">{weekend.holidayName}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center shrink-0 h-16 w-16 bg-muted text-foreground rounded-lg p-2 text-center border group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <span className="text-3xl font-bold">{weekend.duration}</span>
                        <span className="text-xs font-medium leading-tight">HARI</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 text-sm font-medium text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    <span>{formatDateRange(weekend.startDate, weekend.endDate)}</span>
                </div>
                {weekend.suggestion && (
                    <div className="mt-3 pt-3 border-t border-dashed">
                        <p className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400 rounded-full px-3 py-1 mt-2 inline-block font-semibold">
                            Saran: {weekend.suggestion}
                        </p>
                    </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-6">
              <p>Tidak ada potensi libur panjang untuk filter yang dipilih.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SuggestionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        weekend={selectedWeekend}
        userLocation={userLocation}
      />
    </>
  );
}
