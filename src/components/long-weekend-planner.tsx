'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Holiday } from '@/types/holiday';
import { Plane, CalendarDays } from 'lucide-react';

interface LongWeekend {
  title: string;
  date: Date;
  holidayName: string;
  duration: number;
  suggestion?: string;
}

interface LongWeekendPlannerProps {
  holidays: Holiday[];
  year: number;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const formatDate = (date: Date) => {
    return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export function LongWeekendPlanner({ holidays, year }: LongWeekendPlannerProps) {
  const [employmentType, setEmploymentType] = useState<'pns' | 'private'>('pns');

  const longWeekends = useMemo(() => {
    const potentialWeekends: LongWeekend[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holidayDates = new Set(holidays.map(h => new Date(h.tanggal.replace(/-/g, '/')).toDateString()));

    let upcomingHolidays = holidays
      .map(h => ({ ...h, dateObj: new Date(h.tanggal.replace(/-/g, '/')) }))
      .filter(h => h.dateObj.getFullYear() === year && h.dateObj >= today);
    
    if (employmentType === 'private') {
      upcomingHolidays = upcomingHolidays.filter(h => !h.is_cuti);
    }

    for (const holiday of upcomingHolidays) {
      const date = holiday.dateObj;
      const day = date.getDay();

      if (day === 0 || day === 6) continue; // Skip holidays on weekends

      if (day === 5) { // Friday
        potentialWeekends.push({
          title: 'Libur Panjang Akhir Pekan',
          date: date,
          holidayName: holiday.keterangan,
          duration: 3,
        });
      } else if (day === 1) { // Monday
        potentialWeekends.push({
          title: 'Libur Panjang Akhir Pekan',
          date: date,
          holidayName: holiday.keterangan,
          duration: 3,
        });
      } else if (day === 4) { // Thursday
        const friday = new Date(date);
        friday.setDate(date.getDate() + 1);
        if (!holidayDates.has(friday.toDateString())) {
            potentialWeekends.push({
              title: 'Potensi Libur Panjang',
              date: date,
              holidayName: holiday.keterangan,
              duration: 4,
              suggestion: 'Ambil cuti pada hari Jumat',
            });
        }
      } else if (day === 2) { // Tuesday
        const monday = new Date(date);
        monday.setDate(date.getDate() - 1);
        if (!holidayDates.has(monday.toDateString())) {
            potentialWeekends.push({
              title: 'Potensi Libur Panjang',
              date: date,
              holidayName: holiday.keterangan,
              duration: 4,
              suggestion: 'Ambil cuti pada hari Senin',
            });
        }
      }
    }

    return potentialWeekends.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [holidays, year, employmentType]);

  return (
    <div className="mt-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plane className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="font-headline">Perencana Libur Panjang {year}</CardTitle>
          </div>
           <div className="pt-4 mt-4 border-t border-border/80">
            <p className="text-sm text-muted-foreground mb-3">
              Sesuaikan rekomendasi liburan berdasarkan tipe kepegawaian Anda.
            </p>
            <RadioGroup
                value={employmentType}
                onValueChange={(value: 'pns' | 'private') => setEmploymentType(value)}
                className="flex items-center gap-6"
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
        </CardHeader>
        <CardContent className="grid gap-4">
           {longWeekends.length > 0 ? (
            longWeekends.map((weekend, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg bg-card hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex flex-col items-center justify-center h-16 w-16 bg-primary text-primary-foreground rounded-lg p-2 text-center">
                        <span className="text-3xl font-bold">{weekend.duration}</span>
                        <span className="text-xs font-medium leading-tight">HARI</span>
                    </div>
                </div>
                <div className="flex-grow">
                    <p className="font-semibold text-foreground">{weekend.title}</p>
                    <p className="text-sm text-muted-foreground">{weekend.holidayName}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm font-medium text-primary">
                        <CalendarDays className="w-4 h-4" />
                        <span>{formatDate(weekend.date)}</span>
                    </div>
                    {weekend.suggestion && (
                      <div className="mt-2">
                          <p className="text-xs text-accent-foreground bg-accent rounded-full px-3 py-1 mt-2 inline-block font-semibold">
                              Saran: {weekend.suggestion}
                          </p>
                      </div>
                    )}
                </div>
              </div>
            ))
           ) : (
            <div className="text-center text-muted-foreground py-6">
              <p>Tidak ada potensi libur panjang yang akan datang untuk tipe pegawai yang dipilih.</p>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
