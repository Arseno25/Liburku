
'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const activeMagneticElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      
      // Cursor style logic (pointer, etc.)
      const isInteractive = target.closest('a, button, [role="button"], .cursor-pointer');
      setIsPointer(!!isInteractive);

      // --- Magnetic Element Logic ---
      const magneticElement = target.closest<HTMLElement>('[data-magnetic]');

      if (magneticElement) {
        // If we've found a new magnetic element, reset the old one
        if (activeMagneticElement.current && activeMagneticElement.current !== magneticElement) {
          activeMagneticElement.current.style.transition = 'transform 0.3s ease';
          activeMagneticElement.current.style.transform = 'translate(0px, 0px)';
        }
        
        activeMagneticElement.current = magneticElement;
        const rect = magneticElement.getBoundingClientRect();
        const strength = 0.4;
        const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
        const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
        
        magneticElement.style.transition = 'transform 0.1s linear';
        magneticElement.style.transform = `translate(${x}px, ${y}px)`;

      } else if (activeMagneticElement.current) {
        // If we've moved off a magnetic element, reset it
        activeMagneticElement.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'; // a 'snap back' ease
        activeMagneticElement.current.style.transform = 'translate(0px, 0px)';
        activeMagneticElement.current = null;
      }
    };
    
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => {
        setIsVisible(false);
        // also reset magnetic element on mouse leave window
        if (activeMagneticElement.current) {
            activeMagneticElement.current.style.transition = 'transform 0.3s ease';
            activeMagneticElement.current.style.transform = 'translate(0px, 0px)';
            activeMagneticElement.current = null;
        }
    };

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
