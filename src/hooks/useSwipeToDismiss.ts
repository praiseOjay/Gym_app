import { useState, useRef, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UseSwipeToDismissOptions {
  onClose: () => void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function useSwipeToDismiss({
  onClose,
  threshold = 85,
  resistance = 1,
  enabled = true
}: UseSwipeToDismissOptions) {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isTrackingRef = useRef(false);
  const startedOnHandleRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isClosing) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const touch = e.touches[0];
    const target = e.target as HTMLElement;

    // Check if touch started directly on handle or top header area
    const onHandle =
      handleRef.current?.contains(target) ||
      target.classList.contains('modal-handle') ||
      target.closest('.modal-handle') !== null;

    // If touch started in an element explicitly marked data-no-swipe, or input/textarea/select, don't initiate sheet dismiss
    const inNoSwipeZone =
      target.closest('[data-no-swipe="true"]') !== null ||
      target.closest('input, textarea, select') !== null;

    if (!onHandle && inNoSwipeZone) {
      return;
    }

    // If not on handle, allow swipe-down only if content is scrolled to top
    if (!onHandle && sheet.scrollTop > 5) {
      return;
    }

    startedOnHandleRef.current = onHandle;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    isTrackingRef.current = true;
  }, [enabled, isClosing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTrackingRef.current || !enabled || isClosing) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startXRef.current);
    const rawDeltaY = touch.clientY - startYRef.current;

    // If not dragging by the handle and horizontal motion dominates, abort dismiss tracking (user is swiping tabs/carousels)
    if (!startedOnHandleRef.current && deltaX > Math.abs(rawDeltaY)) {
      isTrackingRef.current = false;
      setTranslateY(0);
      setIsDragging(false);
      return;
    }

    const sheet = sheetRef.current;
    // If we started inside content and user scrolls up, let default scroll happen
    if (!startedOnHandleRef.current && sheet && sheet.scrollTop > 0 && rawDeltaY < 0) {
      isTrackingRef.current = false;
      setTranslateY(0);
      setIsDragging(false);
      return;
    }

    if (rawDeltaY > 0) {
      // Require clear downward intent before locking touch into dismiss mode
      if (!startedOnHandleRef.current && (rawDeltaY < 6 || rawDeltaY < deltaX * 1.2)) {
        return;
      }

      // Swiping down: apply pull resistance
      if (e.cancelable) e.preventDefault();
      const delta = rawDeltaY * resistance;
      setTranslateY(delta);
      setIsDragging(true);
      currentYRef.current = touch.clientY;
    } else {
      // Pulling up: slight dampening rubber band
      const delta = Math.max(-20, rawDeltaY * 0.15);
      setTranslateY(delta);
    }
  }, [enabled, isClosing, resistance]);

  const handleTouchEnd = useCallback(() => {
    if (!isTrackingRef.current || !enabled || isClosing) return;
    isTrackingRef.current = false;
    setIsDragging(false);

    const deltaY = currentYRef.current - startYRef.current;
    const timeTaken = Math.max(1, Date.now() - startTimeRef.current);
    const velocity = deltaY / timeTaken; // px/ms

    // Close if dragged past threshold or swiped fast downwards
    if (deltaY > threshold || (deltaY > 40 && velocity > 0.45)) {
      setIsClosing(true);
      triggerHaptic('light');
      // Animate off-screen downwards then call onClose
      setTranslateY(window.innerHeight || 800);
      setTimeout(() => {
        onClose();
      }, 220);
    } else {
      // Snap back smoothly
      setTranslateY(0);
    }
  }, [enabled, isClosing, threshold, onClose]);

  // Mouse drag support for desktop testing
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!enabled || isClosing) return;
    const target = e.target as HTMLElement;
    const onHandle =
      handleRef.current?.contains(target) ||
      target.classList.contains('modal-handle') ||
      target.closest('.modal-handle') !== null;

    if (!onHandle) return; // Mouse drag only on handle for desktop to not break text selection

    e.preventDefault();
    startYRef.current = e.clientY;
    currentYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    isTrackingRef.current = true;
    startedOnHandleRef.current = true;
    setIsDragging(true);

    const onMouseMove = (moveEv: MouseEvent) => {
      if (!isTrackingRef.current) return;
      const rawDelta = moveEv.clientY - startYRef.current;
      if (rawDelta > 0) {
        setTranslateY(rawDelta * resistance);
        currentYRef.current = moveEv.clientY;
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      handleTouchEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [enabled, isClosing, resistance, handleTouchEnd]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false });
    sheet.addEventListener('touchend', handleTouchEnd);
    sheet.addEventListener('touchcancel', handleTouchEnd);
    sheet.addEventListener('mousedown', handleMouseDown);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
      sheet.removeEventListener('touchcancel', handleTouchEnd);
      sheet.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown]);

  // Combined style for the modal sheet
  const sheetStyle: React.CSSProperties = {
    transform: translateY !== 0 ? `translateY(${translateY}px)` : undefined,
    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    touchAction: isDragging ? 'none' : undefined,
    userSelect: isDragging ? 'none' : undefined
  };

  // Backdrop dimming factor
  const backdropOpacity = translateY > 0 ? Math.max(0.1, 1 - translateY / 350) : 1;

  return {
    sheetRef,
    handleRef,
    sheetStyle,
    backdropOpacity,
    isDragging,
    isClosing
  };
}
