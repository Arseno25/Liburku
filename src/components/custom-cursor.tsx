
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// --- Configuration ---
const CURSOR_BOX_SIZE = 24;
const CORNER_SIZE = 8;
const MAGNETIC_PADDING = 6;
const DOT_SIZE_DEFAULT = 6;
const DOT_SIZE_MAGNETIC = 8;

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isMagnetic, setIsMagnetic] = useState(false);
  const [magneticRect, setMagneticRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      const magneticElement = target.closest<HTMLElement>('[data-magnetic]');

      if (magneticElement) {
        setIsMagnetic(true);
        setMagneticRect(magneticElement.getBoundingClientRect());
      } else {
        setIsMagnetic(false);
        setMagneticRect(null);
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

  const cursorStyle: React.CSSProperties = isMagnetic && magneticRect
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

    const dotStyle: React.CSSProperties = {
        position: 'absolute',
        width: isMagnetic ? DOT_SIZE_MAGNETIC : DOT_SIZE_DEFAULT,
        height: isMagnetic ? DOT_SIZE_MAGNETIC : DOT_SIZE_DEFAULT,
        backgroundColor: 'hsl(var(--primary))',
        borderRadius: '50%',
        transition: 'width 0.2s, height 0.2s, transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
        pointerEvents: 'none',
    };
    
    if (isMagnetic && magneticRect) {
        dotStyle.transform = `translate(
            ${position.x - (magneticRect.left - MAGNETIC_PADDING) - (DOT_SIZE_MAGNETIC / 2)}px,
            ${position.y - (magneticRect.top - MAGNETIC_PADDING) - (DOT_SIZE_MAGNETIC / 2)}px
        )`;
    } else {
        dotStyle.transform = `translate(
            ${CURSOR_BOX_SIZE / 2 - (DOT_SIZE_DEFAULT / 2)}px,
            ${CURSOR_BOX_SIZE / 2 - (DOT_SIZE_DEFAULT / 2)}px
        )`;
    }

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
    <div
      style={cursorStyle}
      className={cn(
        'hidden md:block fixed pointer-events-none z-[9999]',
        { 'opacity-0': !isVisible }
      )}
    >
      <div style={dotStyle} />
      <div style={corners.topLeft} />
      <div style={corners.topRight} />
      <div style={corners.bottomLeft} />
      <div style={corners.bottomRight} />
    </div>
  );
}
