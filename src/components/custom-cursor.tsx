'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      // Check if the cursor is over a link or button
      if (target.closest('a, button, [role="button"], .cursor-pointer')) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };
    
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      className={cn(
        'hidden md:block fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-300',
        { 'opacity-0': !isVisible }
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Outer ring */}
      <div
        className={cn(
          'absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary transition-transform duration-500 ease-out',
          { 'scale-150 opacity-40': isPointer }
        )}
        style={{
          width: '32px',
          height: '32px',
        }}
      />
      {/* Inner dot */}
      <div
        className={cn(
          'absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-transform duration-200 ease-out',
          { 'scale-0': isPointer }
        )}
        style={{
          width: '6px',
          height: '6px',
        }}
      />
    </div>
  );
}
