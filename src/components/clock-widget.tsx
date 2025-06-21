
'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function ClockWidget() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client mount to avoid hydration mismatch
    setTime(new Date());

    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  if (!time) {
    return (
      <div className="hidden sm:flex items-center gap-3">
        <Skeleton className="w-8 h-8 shrink-0" />
        <div className="flex flex-col gap-1.5">
            <Skeleton className="w-24 h-5 rounded-md" />
            <Skeleton className="w-16 h-4 rounded-md" />
        </div>
      </div>
    );
  }
  
  const formattedTime = time.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
  });

  return (
    <div className="hidden sm:flex items-center gap-3" title="Waktu Saat Ini">
      <Clock className="w-8 h-8 text-primary shrink-0" />
      <div className="text-sm font-medium text-foreground">
        <div className='font-mono text-lg tracking-wider'>{formattedTime}</div>
        <div className="text-xs text-muted-foreground font-normal">Waktu Lokal</div>
      </div>
    </div>
  );
}
