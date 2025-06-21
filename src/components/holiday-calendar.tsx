
'use client';

import * as React from 'react';
import { DayContent, DayPickerProps } from 'react-day-picker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { explainHoliday } from '@/ai/flows/explain-holiday-flow';
import { generateSpeech } from '@/ai/flows/text-to-speech-flow';
import { LoaderCircle, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = React.useState(false);

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
    setAudioUrl(null);
    setIsGeneratingAudio(false);

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

  const handleListenClick = async () => {
    if (!explanation || isGeneratingAudio || isGenerating) return;

    setIsGeneratingAudio(true);
    setAudioUrl(null);
    try {
      const result = await generateSpeech({ text: explanation });
      setAudioUrl(result.audioUrl);
    } catch (error) {
      console.error("Gagal menghasilkan audio:", error);
      // You could add a toast notification here to inform the user.
    } finally {
      setIsGeneratingAudio(false);
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
    const isSunday = dayProps.date.getDay() === 0;

    const dayNumber = <DayContent {...dayProps} />;

    if (holiday) {
      return (
        <div
          onClick={() => handleHolidayClick(holiday)}
          className={cn(
            'flex h-full w-full cursor-pointer items-center justify-center rounded-full font-semibold transition-transform hover:scale-110',
            holiday.is_cuti
              ? 'bg-warning text-warning-foreground'
              : 'bg-destructive text-destructive-foreground'
          )}
        >
          {dayNumber}
        </div>
      );
    }

    // For all other days, use a consistent wrapper for alignment.
    return (
      <div className={cn(
          "flex h-full w-full items-center justify-center", // This ensures all text is centered.
          isToday && "rounded-full bg-primary/20 font-bold",
          isToday && isSunday && "text-destructive",
          isToday && !isSunday && "text-primary",
          !isToday && isSunday && "font-medium text-destructive"
      )}>
        {dayNumber}
      </div>
    )
  };

  return (
    <>
      <div className="w-full transition-opacity flex duration-500 ease-in-out animate-in fade-in-50" key={props.month?.toString()}>
        <Calendar
          locale={id}
          weekStartsOn={0}
          formatters={{
            formatWeekdayName: (day) => {
              const dayName = format(day, 'eee', { locale: id });
              if (day.getDay() === 0) {
                return <span className="text-destructive">{dayName}</span>;
              }
              return dayName;
            },
          }}
          components={{
            DayContent: CustomDay,
          }}
          {...props}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
             <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="text-xl font-semibold">{selectedHoliday?.keterangan}</DialogTitle>
              </div>
               <Button variant="outline" size="icon" onClick={handleListenClick} disabled={isGenerating || isGeneratingAudio || !explanation}>
                  {isGeneratingAudio ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                  <span className="sr-only">Dengarkan Penjelasan</span>
              </Button>
            </div>
          </DialogHeader>
          <div className="py-2 text-foreground/90 overflow-y-auto pr-2">
            {isGenerating ? (
              <div className="space-y-3 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <p className="text-base leading-relaxed">{explanation}</p>
            )}
            {audioUrl && (
              <div className="mt-4">
                <audio controls autoPlay src={audioUrl} className="h-10 w-full">
                  Browser Anda tidak mendukung elemen audio.
                </audio>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
