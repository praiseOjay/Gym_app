import { useState, useRef, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UseSwipeToDismissOptions {
  onClose: () => void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
  handleOnly?: boolean;
}

/**
 * Checks whether an element or any of its ancestors up to rootSheet is a scrollable container
 * or marked as a non-swipable zone.
 */
function isInsideScrollable(target: HTMLElement | null, rootSheet: HTMLElement | null): boolean {
  let curr = target;
  while (curr && curr !== rootSheet && curr !== document.body && curr !== document.documentElement) {
    if (
      curr.getAttribute('data-no-swipe') === 'true' ||
      curr.getAttribute('data-scrollable') === 'true' ||
      curr.classList.contains('scrollable-content')
    ) {
      return true;
    }
    const style = window.getComputedStyle(curr);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

export function useSwipeToDismiss({
  onClose,
  threshold = 120,
  resistance = 1,
  enabled = true,
  handleOnly = false
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

    // Check if touch started directly on handle or handle container
    const onHandle =
      handleRef.current?.contains(target) ||
      target.classList.contains('modal-handle') ||
      target.closest('.modal-handle') !== null ||
      target.closest('.modal-handle-container') !== null;

    // If handleOnly mode is active, only touches on the handle can initiate dismiss
    if (handleOnly && !onHandle) {
      return;
    }

    // Interactive form elements, buttons, and explicitly marked no-swipe zones never dismiss
    const inNoSwipeZone =
      target.closest('[data-no-swipe="true"]') !== null ||
      target.closest('input, textarea, select, button, a') !== null;

    if (!onHandle && inNoSwipeZone) {
      return;
    }

    // If touch is inside ANY scrollable container (e.g. exercise list, routine cards),
    // NEVER initiate swipe dismiss - let the user scroll cleanly!
    if (!onHandle && isInsideScrollable(target, sheet)) {
      return;
    }

    // If the modal sheet itself is already scrolled down, don't dismiss when user drags back up
    if (!onHandle && sheet.scrollTop > 0) {
      return;
    }

    // For non-handle touches, only allow dragging from the top header zone (first 80px)
    if (!onHandle) {
      const sheetRect = sheet.getBoundingClientRect();
      const relativeY = touch.clientY - sheetRect.top;
      if (relativeY > 80) {
        return;
      }
    }

    startedOnHandleRef.current = onHandle;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    isTrackingRef.current = true;
  }, [enabled, isClosing, handleOnly]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTrackingRef.current || !enabled || isClosing) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startXRef.current);
    const rawDeltaY = touch.clientY - startYRef.current;

    // If horizontal motion dominates, abort dismiss tracking (user is swiping tabs/carousels)
    if (deltaX > Math.abs(rawDeltaY)) {
      isTrackingRef.current = false;
      setTranslateY(0);
      setIsDragging(false);
      return;
    }

    // If user is dragging upward (scrolling down into content)
    if (rawDeltaY <= 0) {
      // If touch did not start on the handle, release tracking immediately to allow native scrolling
      if (!startedOnHandleRef.current) {
        isTrackingRef.current = false;
        setTranslateY(0);
        setIsDragging(false);
        return;
      }
      // On the handle, slight rubber band dampening
      const delta = Math.max(-10, rawDeltaY * 0.08);
      setTranslateY(delta);
      return;
    }

    // Swiping downward (rawDeltaY > 0)
    if (rawDeltaY > 0) {
      // Require clear downward intent when not on handle
      if (!startedOnHandleRef.current && (rawDeltaY < 15 || rawDeltaY < deltaX * 1.5)) {
        return;
      }

      // Check if sheet is scrolled; if scrolled, abort dismiss
      const sheet = sheetRef.current;
      if (!startedOnHandleRef.current && sheet && sheet.scrollTop > 0) {
        isTrackingRef.current = false;
        setTranslateY(0);
        setIsDragging(false);
        return;
      }

      if (e.cancelable) e.preventDefault();
      const delta = rawDeltaY * resistance;
      setTranslateY(delta);
      setIsDragging(true);
      currentYRef.current = touch.clientY;
    }
  }, [enabled, isClosing, resistance]);

  const handleTouchEnd = useCallback(() => {
    if (!isTrackingRef.current || !enabled || isClosing) return;
    isTrackingRef.current = false;
    setIsDragging(false);

    const deltaY = currentYRef.current - startYRef.current;
    const timeTaken = Math.max(1, Date.now() - startTimeRef.current);
    const velocity = deltaY / timeTaken; // px/ms

    // Close if dragged past threshold or swiped downward with significant velocity
    if (deltaY > threshold || (deltaY > 80 && velocity > 0.65)) {
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
      target.closest('.modal-handle') !== null ||
      target.closest('.modal-handle-container') !== null;

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
