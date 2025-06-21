'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DayContent, DayPickerProps } from 'react-day-picker';

import { Holiday } from '@/types/holiday';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from './ui/skeleton';

interface HolidayCalendarProps extends DayPickerProps {
  holidays: Holiday[];
  loading: boolean;
}

export function HolidayCalendar({ holidays, loading, ...props }: HolidayCalendarProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center w-full">
        <Skeleton className="w-full max-w-md h-[380px] rounded-lg" />
      </div>
    );
  }

  const { nationalHolidays, jointLeaves } = React.useMemo(() => {
    const nationalHolidays = holidays
      .filter((h) => h.is_national_holiday && !h.holiday_name.toLowerCase().includes('cuti bersama'))
      .map((h) => new Date(h.date.replace(/-/g, '/')));

    const jointLeaves = holidays
      .filter((h) => h.is_national_holiday && h.holiday_name.toLowerCase().includes('cuti bersama'))
      .map((h) => new Date(h.date.replace(/-/g, '/')));
      
    return { nationalHolidays, jointLeaves };
  }, [holidays]);

  const modifiers = {
    nationalHoliday: nationalHolidays,
    jointLeave: jointLeaves,
  };

  const modifierClassNames = {
    nationalHoliday: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:bg-destructive',
    jointLeave: 'bg-warning text-warning-foreground hover:bg-warning/90 focus:bg-warning',
  };

  const CustomDay = (dayProps: React.ComponentProps<typeof DayContent>) => {
    const holiday = holidays.find(
      (h) => format(dayProps.date, 'yyyy-MM-dd') === h.date
    );

    if (holiday) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative w-full h-full flex items-center justify-center">
                <DayContent {...dayProps} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{holiday.holiday_name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <div className="relative w-full h-full flex items-center justify-center"><DayContent {...dayProps} /></div>;
  };

  return (
    <div className="w-full transition-opacity duration-500 ease-in-out animate-in fade-in-50" key={props.month?.toString()}>
      <Calendar
        modifiers={modifiers}
        classNames={{
          day_modifier_nationalHoliday: modifierClassNames.nationalHoliday,
          day_modifier_jointLeave: modifierClassNames.jointLeave,
        }}
        components={{
          DayContent: CustomDay,
        }}
        {...props}
      />
    </div>
  );
}
