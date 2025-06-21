'use client';

import * as React from 'react';
import { DayContent, DayPickerProps } from 'react-day-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { explainHoliday } from '@/ai/flows/explain-holiday-flow';

import { Holiday } from '@/types/holiday';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface HolidayCalendarProps extends DayPickerProps {
  holidays: Holiday[];
}

export function HolidayCalendar({ holidays, ...props }: HolidayCalendarProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedHoliday, setSelectedHoliday] = React.useState<Holiday | null>(null);
  const [explanation, setExplanation] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  const parsedHolidays = React.useMemo(() => {
    return holidays.map(h => ({
        ...h,
        parsedDate: new Date(h.tanggal.replace(/-/g, '/'))
    }));
  }, [holidays]);
  
  const handleHolidayClick = async (holiday: Holiday) => {
    if (!holiday) return;
    setSelectedHoliday(holiday);
    setIsDialogOpen(true);
    setIsGenerating(true);
    setExplanation('');

    try {
      const result = await explainHoliday({ holidayName: holiday.keterangan });
      setExplanation(result.explanation);
    } catch (error) {
      console.error("Gagal menghasilkan penjelasan:", error);
      setExplanation("Maaf, terjadi kesalahan saat mencoba menjelaskan hari libur ini. Silakan coba lagi nanti.");
    } finally {
      setIsGenerating(false);
    }
  };

  const CustomDay = (dayProps: React.ComponentProps<typeof DayContent>) => {
    const dayDateString = dayProps.date.toDateString();
    
    const holiday = parsedHolidays.find(
      (h) => h.parsedDate.toDateString() === dayDateString
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = dayProps.date.getTime() === today.getTime();

    const dayNumber = <DayContent {...dayProps} />;

    if (holiday) {
      return (
        <div
          onClick={() => handleHolidayClick(holiday)}
          className={cn(
            'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110',
            holiday.is_cuti
              ? 'bg-warning/80 text-warning-foreground'
              : 'bg-destructive/80 text-destructive-foreground'
          )}
        >
          {dayNumber}
        </div>
      );
    }

    if (isToday) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {dayNumber}
        </div>
      );
    }

    return dayNumber;
  };

  return (
    <>
      <div className="w-full transition-opacity duration-500 ease-in-out animate-in fade-in-50" key={props.month?.toString()}>
        <Calendar
          components={{
            DayContent: CustomDay,
          }}
          {...props}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedHoliday?.keterangan}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isGenerating ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{explanation}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
