'use client';

import * as React from 'react';
import Calendar from 'react-calendar';
import type { TileClassNameFunc, OnClickFunc } from 'react-calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { explainHoliday } from '@/ai/flows/explain-holiday-flow';
import { generateSpeech } from '@/ai/flows/text-to-speech-flow';
import { LoaderCircle, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Holiday } from '@/types/holiday';

interface HolidayCalendarProps {
  activeStartDate: Date;
  holidays: Holiday[];
}

export function HolidayCalendar({ activeStartDate, holidays }: HolidayCalendarProps) {
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

  const getHolidayForDate = (date: Date): Holiday | undefined => {
    const dateString = date.toDateString();
    return parsedHolidays.find(h => h.parsedDate.toDateString() === dateString);
  }

  const tileClassName: TileClassNameFunc = ({ date, view }) => {
    if (view === 'month') {
      const classes = [];
      const holiday = getHolidayForDate(date);
      if (holiday) {
        classes.push(holiday.is_cuti ? 'joint-leave' : 'national-holiday');
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date.getTime() === today.getTime()) {
        classes.push('today');
      }
      
      if (date.getDay() === 0) { // Sunday
        classes.push('sunday');
      }

      return classes.length > 0 ? classes.join(' ') : null;
    }
    return null;
  };

  const onClickDay: OnClickFunc = (value, event) => {
    const holiday = getHolidayForDate(value);
    if (holiday) {
      handleHolidayClick(holiday);
    }
  }

  return (
    <>
      <Calendar
        activeStartDate={activeStartDate}
        onActiveStartDateChange={() => {}} // prevent nav
        showNavigation={false}
        tileClassName={tileClassName}
        onClickDay={onClickDay}
        formatShortWeekday={(locale, date) => ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][date.getDay()]}
        className="w-full"
      />

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
