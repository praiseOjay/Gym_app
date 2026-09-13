import React from 'react';
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss';

export interface SwipeableModalSheetProps {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  showHandle?: boolean;
  maxHeight?: string;
  threshold?: number;
  enabled?: boolean;
}

export const SwipeableModalSheet: React.FC<SwipeableModalSheetProps> = ({
  onClose,
  children,
  className = 'modal-sheet',
  style,
  overlayClassName = 'modal-overlay',
  overlayStyle,
  showHandle = true,
  maxHeight,
  threshold = 85,
  enabled = true
}) => {
  const { sheetRef, handleRef, sheetStyle, backdropOpacity, isDragging } = useSwipeToDismiss({
    onClose,
    threshold,
    enabled
  });

  return (
    <div
      className={overlayClassName}
      onClick={onClose}
      style={{
        ...overlayStyle,
        opacity: backdropOpacity,
        transition: isDragging ? 'none' : 'opacity 0.2s ease'
      }}
    >
      <div
        ref={sheetRef}
        className={className}
        style={{
          ...(maxHeight ? { maxHeight } : {}),
          ...sheetStyle,
          ...style
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showHandle && (
          <div
            ref={handleRef}
            className="modal-handle"
            style={{ cursor: 'grab', touchAction: 'none' }}
          />
        )}
        {children}
      </div>
    </div>
  );
};
