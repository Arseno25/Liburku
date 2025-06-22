
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

// --- Configuration ---
const CURSOR_BOX_SIZE = 24;
const CORNER_SIZE = 8;
const MAGNETIC_PADDING = 6;
const DOT_SIZE_DEFAULT = 6;
const DOT_SIZE_MAGNETIC = 12;

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [magneticRect, setMagneticRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const magneticElementRef = useRef<HTMLElement | null>(null);

  const isMagnetic = !!magneticRect;

  const updateMagneticRect = useCallback(() => {
    if (magneticElementRef.current) {
      setMagneticRect(magneticElementRef.current.getBoundingClientRect());
    } else {
      setMagneticRect(null);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const newMagneticElement = target.closest<HTMLElement>('[data-magnetic]');

      if (newMagneticElement !== magneticElementRef.current) {
        magneticElementRef.current = newMagneticElement;
        updateMagneticRect();
      }
    };

    const handleScroll = () => {
        if (magneticElementRef.current) {
            updateMagneticRect();
        }
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, true);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll, true);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [updateMagneticRect]);

  // Style for the magnetic BOX (which contains the corners)
  const boxStyle: React.CSSProperties = isMagnetic && magneticRect
    ? {
        width: magneticRect.width + MAGNETIC_PADDING * 2,
        height: magneticRect.height + MAGNETIC_PADDING * 2,
        top: magneticRect.top - MAGNETIC_PADDING,
        left: magneticRect.left - MAGNETIC_PADDING,
        borderRadius: 'var(--radius)',
        transition: 'width 0.2s, height 0.2s, top 0.2s, left 0.2s, border-radius 0.2s',
        transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
      }
    : {
        width: CURSOR_BOX_SIZE,
        height: CURSOR_BOX_SIZE,
        top: position.y - CURSOR_BOX_SIZE / 2,
        left: position.x - CURSOR_BOX_SIZE / 2,
        transition: 'top 0.1s, left 0.1s',
        transitionTimingFunction: 'linear',
      };
      
  // Style for the central DOT
  const dotStyle: React.CSSProperties = {
    top: position.y,
    left: position.x,
    width: isMagnetic ? DOT_SIZE_MAGNETIC : DOT_SIZE_DEFAULT,
    height: isMagnetic ? DOT_SIZE_MAGNETIC : DOT_SIZE_DEFAULT,
    transform: 'translate(-50%, -50%)',
    transition: 'width 0.2s, height 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
    backgroundColor: 'hsl(var(--primary))',
    borderRadius: '50%',
    mixBlendMode: isMagnetic ? 'difference' : 'normal',
  };

  const cornerBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: 'hsl(var(--primary))',
    transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
  };

  const corners = {
    topLeft: { ...cornerBaseStyle, top: 0, left: 0, borderTop: '2px solid', borderLeft: '2px solid' },
    topRight: { ...cornerBaseStyle, top: 0, right: 0, borderTop: '2px solid', borderRight: '2px solid' },
    bottomLeft: { ...cornerBaseStyle, bottom: 0, left: 0, borderBottom: '2px solid', borderLeft: '2px solid' },
    bottomRight: { ...cornerBaseStyle, bottom: 0, right: 0, borderBottom: '2px solid', borderRight: '2px solid' },
  };

  return (
    <>
      {/* The magnetic box with corners. This has a lower z-index. */}
      <div
        style={boxStyle}
        className={cn(
          'custom-cursor-box hidden md:block fixed pointer-events-none',
          { 'opacity-0': !isVisible }
        )}
      >
        <div style={corners.topLeft} />
        <div style={corners.topRight} />
        <div style={corners.bottomLeft} />
        <div style={corners.bottomRight} />
      </div>

      {/* The central dot. This has a very high z-index. */}
      <div
        style={dotStyle}
        className={cn(
          'custom-cursor-dot hidden md:block fixed pointer-events-none',
          { 'opacity-0': !isVisible }
        )}
      />
    </>
  );
}
