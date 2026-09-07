import React, { useEffect, useState } from 'react';
import { Timer, X, Plus, Minus } from 'lucide-react';
import { sounds } from '../utils/audio';
import { VoiceCoach } from '../services/voiceCoach';

interface RestTimerFloatingProps {
  initialSeconds?: number;
  endsAt?: number;
  totalSeconds?: number;
  onFinish: () => void;
  onCancel: () => void;
  onAdjust?: (newEndsAt: number, newTotalSeconds: number) => void;
  soundEnabled: boolean;
}

export const RestTimerFloating: React.FC<RestTimerFloatingProps> = ({
  initialSeconds = 90,
  endsAt,
  totalSeconds,
  onFinish,
  onCancel,
  onAdjust,
  soundEnabled
}) => {
  const [targetEndsAt, setTargetEndsAt] = useState<number>(() => {
    return endsAt || Date.now() + initialSeconds * 1000;
  });
  const [totalSec, setTotalSec] = useState<number>(() => {
    return totalSeconds || initialSeconds;
  });

  const getRemaining = (end: number) => Math.max(0, Math.ceil((end - Date.now()) / 1000));
  const [timeLeft, setTimeLeft] = useState<number>(() => getRemaining(targetEndsAt));

  const hasFired15Ref = React.useRef(false);
  const firedBeepsRef = React.useRef<Set<number>>(new Set());
  const hasFinishedRef = React.useRef(false);

  // Sync when parent props change
  useEffect(() => {
    if (endsAt) {
      setTargetEndsAt(endsAt);
      setTimeLeft(getRemaining(endsAt));
    }
    if (totalSeconds) {
      setTotalSec(totalSeconds);
    }
  }, [endsAt, totalSeconds]);

  useEffect(() => {
    const checkTimer = () => {
      const remaining = getRemaining(targetEndsAt);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (!hasFinishedRef.current) {
          hasFinishedRef.current = true;
          if (soundEnabled) {
            sounds.playTimerComplete();
          }
          VoiceCoach.announceRestComplete();
          onFinish();
        }
        return;
      }

      // Voice cue at 15 seconds remaining
      if (remaining === 15 && !hasFired15Ref.current) {
        hasFired15Ref.current = true;
        VoiceCoach.announceRestApproaching(15);
      }

      // Warning beeps at 3, 2, 1
      if (soundEnabled && remaining <= 3 && remaining > 0 && !firedBeepsRef.current.has(remaining)) {
        firedBeepsRef.current.add(remaining);
        sounds.playWarningBeep();
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 500);

    return () => clearInterval(interval);
  }, [targetEndsAt, soundEnabled, onFinish]);

  const addTime = (secs: number) => {
    const newEndsAt = Math.max(Date.now() + 5000, targetEndsAt + secs * 1000);
    const newTotal = Math.max(5, totalSec + secs);
    setTargetEndsAt(newEndsAt);
    setTotalSec(newTotal);
    setTimeLeft(getRemaining(newEndsAt));
    if (onAdjust) {
      onAdjust(newEndsAt, newTotal);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.min(100, Math.max(0, (timeLeft / totalSec) * 100));

  return (
    <div className="floating-rest-timer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            position: 'relative',
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="38" height="38" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="19"
              cy="19"
              r="15"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3"
            />
            <circle
              cx="19"
              cy="19"
              r="15"
              fill="transparent"
              stroke="var(--accent-amber)"
              strokeWidth="3"
              strokeDasharray={94.2}
              strokeDashoffset={94.2 - (progressPercent / 100) * 94.2}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <Timer
            size={16}
            color="var(--accent-amber)"
            style={{ position: 'absolute' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
            Rest Interval
          </div>
          <div className="timer-digits">{formattedTime}</div>
        </div>
      </div>

      {/* Adjust chips */}
      <div className="timer-adjust-chips">
        <button className="timer-chip" onClick={() => addTime(-15)}>
          <Minus size={11} /> 15s
        </button>
        <button className="timer-chip" onClick={() => addTime(30)}>
          <Plus size={11} /> 30s
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={onCancel}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: 'var(--text-secondary)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Skip Rest Timer"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
