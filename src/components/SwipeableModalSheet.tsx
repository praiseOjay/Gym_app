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
  handleOnly?: boolean;
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
  threshold = 120,
  enabled = true,
  handleOnly = false
}) => {
  const { sheetRef, handleRef, sheetStyle, backdropOpacity, isDragging } = useSwipeToDismiss({
    onClose,
    threshold,
    enabled,
    handleOnly
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
            className="modal-handle-container"
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              padding: '0 0 4px 0',
              cursor: 'grab',
              touchAction: 'none'
            }}
          >
            <div className="modal-handle" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
