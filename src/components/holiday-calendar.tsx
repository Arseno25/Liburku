'use client';

import * as React from 'react';
import { DayContent, DayPickerProps } from 'react-day-picker';

import { Holiday } from '@/types/holiday';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HolidayCalendarProps extends DayPickerProps {
  holidays: Holiday[];
}

export function HolidayCalendar({ holidays, ...props }: HolidayCalendarProps) {

  const parsedHolidays = React.useMemo(() => {
    return holidays.map(h => ({
        ...h,
        parsedDate: new Date(h.tanggal.replace(/-/g, '/'))
    }));
  }, [holidays]);

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
      const holidayContent = (
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              holiday.is_cuti
                ? 'bg-warning text-warning-foreground'
                : 'bg-destructive text-destructive-foreground'
            )}
          >
            {dayNumber}
          </div>
      );
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              {holidayContent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{holiday.keterangan}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
    <div className="w-full transition-opacity duration-500 ease-in-out animate-in fade-in-50" key={props.month?.toString()}>
      <Calendar
        components={{
          DayContent: CustomDay,
        }}
        {...props}
      />
    </div>
  );
}
