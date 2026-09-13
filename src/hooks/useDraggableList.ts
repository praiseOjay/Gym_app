import { useState, useRef, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface UseDraggableListOptions {
  onReorder: (fromIndex: number, toIndex: number) => void;
  vibrationEnabled?: boolean;
}

export function useDraggableList({
  onReorder,
  vibrationEnabled = true
}: UseDraggableListOptions) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState<boolean>(false);

  const draggedIndexRef = useRef<number | null>(null);
  const overIndexRef = useRef<number | null>(null);

  // Sync ref with state
  draggedIndexRef.current = draggedIndex;
  overIndexRef.current = overIndex;

  // Touch Drag Handlers (Mobile touch screens)
  const handleTouchStart = useCallback(
    (index: number, e: React.TouchEvent) => {
      // Prevent scrolling while actively dragging the drag handle
      e.stopPropagation();
      setDraggedIndex(index);
      setOverIndex(index);
      setIsTouchDragging(true);
      triggerHaptic('medium', vibrationEnabled);
    },
    [vibrationEnabled]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (draggedIndexRef.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;

    // Determine target item under current touch position
    const elemUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elemUnderTouch) return;

    const dragItem = elemUnderTouch.closest('[data-drag-index]') as HTMLElement | null;
    if (dragItem && dragItem.dataset.dragIndex !== undefined) {
      const targetIdx = parseInt(dragItem.dataset.dragIndex, 10);
      if (!isNaN(targetIdx) && targetIdx !== overIndexRef.current) {
        setOverIndex(targetIdx);
        triggerHaptic('light', vibrationEnabled);
      }
    }
  }, [vibrationEnabled]);

  const handleTouchEnd = useCallback(() => {
    const from = draggedIndexRef.current;
    const to = overIndexRef.current;

    if (from !== null && to !== null && from !== to) {
      onReorder(from, to);
      triggerHaptic('success', vibrationEnabled);
    }

    setDraggedIndex(null);
    setOverIndex(null);
    setIsTouchDragging(false);
  }, [onReorder, vibrationEnabled]);

  // Desktop HTML5 Drag & Drop Handlers
  const handleDragStart = useCallback(
    (index: number, e: React.DragEvent) => {
      setDraggedIndex(index);
      setOverIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      triggerHaptic('light', vibrationEnabled);
    },
    [vibrationEnabled]
  );

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIndexRef.current !== index) {
      setOverIndex(index);
    }
  }, []);

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      const from = draggedIndexRef.current;
      if (from !== null && from !== index) {
        onReorder(from, index);
        triggerHaptic('success', vibrationEnabled);
      }
      setDraggedIndex(null);
      setOverIndex(null);
    },
    [onReorder, vibrationEnabled]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setOverIndex(null);
  }, []);

  // Helper to determine drop indicator class
  const getItemDragProps = useCallback(
    (index: number) => {
      const isDragging = draggedIndex === index;
      const isOver = overIndex === index && draggedIndex !== null && draggedIndex !== index;
      const isDropTop = isOver && draggedIndex !== null && draggedIndex > index;
      const isDropBottom = isOver && draggedIndex !== null && draggedIndex < index;

      return {
        'data-drag-index': index,
        className: [
          isDragging ? 'exercise-card-dragging' : '',
          isDropTop ? 'exercise-drop-indicator-top' : '',
          isDropBottom ? 'exercise-drop-indicator-bottom' : ''
        ]
          .filter(Boolean)
          .join(' ')
      };
    },
    [draggedIndex, overIndex]
  );

  return {
    draggedIndex,
    overIndex,
    isTouchDragging,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    getItemDragProps
  };
}
