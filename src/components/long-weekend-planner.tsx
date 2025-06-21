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

export function LongWeekendPlanner({ holidays, year, onScrollToMonth }: LongWeekendPlannerProps) {
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
      <Card className="w-full shadow-sm">
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
      />
    </>
  );
}
