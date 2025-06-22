
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// --- Configuration ---
const CURSOR_BOX_SIZE = 24; // The size of the default cursor box
const CORNER_SIZE = 8;      // The size of each corner piece
const MAGNETIC_PADDING = 6; // Padding around the magnetic element

export function CustomCursor() {
  // State for cursor position
  const [position, setPosition] = useState({ x: -100, y: -100 });
  
  // State for magnetic effect
  const [isMagnetic, setIsMagnetic] = useState(false);
  const [magneticRect, setMagneticRect] = useState<DOMRect | null>(null);
  
  // State for visibility
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Always update the base position for smooth movement
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      const magneticElement = target.closest<HTMLElement>('[data-magnetic]');

      if (magneticElement) {
        // If hovering over a magnetic element, store its properties
        setIsMagnetic(true);
        setMagneticRect(magneticElement.getBoundingClientRect());
      } else {
        // Otherwise, reset the magnetic state
        setIsMagnetic(false);
        setMagneticRect(null);
      }
    };
    
    // Handlers to show/hide the cursor when entering/leaving the viewport
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

  // Dynamically calculate styles for the main cursor container
  const cursorStyle: React.CSSProperties = isMagnetic && magneticRect
    ? { // --- Magnetic State ---
        // Position and size the cursor to wrap the element
        width: magneticRect.width + MAGNETIC_PADDING * 2,
        height: magneticRect.height + MAGNETIC_PADDING * 2,
        top: magneticRect.top - MAGNETIC_PADDING,
        left: magneticRect.left - MAGNETIC_PADDING,
        // Match the border radius of the target element (buttons in this app)
        borderRadius: 'var(--radius)',
        // Use a faster, smoother transition when snapping to elements
        transition: 'width 0.2s, height 0.2s, top 0.2s, left 0.2s, border-radius 0.2s',
        transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
      }
    : { // --- Default State ---
        // Center the cursor box on the mouse pointer
        width: CURSOR_BOX_SIZE,
        height: CURSOR_BOX_SIZE,
        top: position.y - CURSOR_BOX_SIZE / 2,
        left: position.x - CURSOR_BOX_SIZE / 2,
        // A slightly slower transition for the "following" effect
        transition: 'top 0.1s, left 0.1s',
        transitionTimingFunction: 'linear',
      };

  // Base styles for the corner pieces
  const cornerBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: 'hsl(var(--primary))',
    transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
  };

  // Define the four corners with their respective borders
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
        // Base styles for the cursor container
        'hidden md:block fixed pointer-events-none z-[9999]',
        // Hide if the mouse is outside the window
        { 'opacity-0': !isVisible }
      )}
    >
      {/* Render the four corner pieces */}
      <div style={corners.topLeft} />
      <div style={corners.topRight} />
      <div style={corners.bottomLeft} />
      <div style={corners.bottomRight} />
    </div>
  );
}
