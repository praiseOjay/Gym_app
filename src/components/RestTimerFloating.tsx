import React, { useEffect, useState } from 'react';
import { Timer, X, Plus, Minus } from 'lucide-react';
import { sounds } from '../utils/audio';
import { VoiceCoach } from '../services/voiceCoach';

interface RestTimerFloatingProps {
  initialSeconds: number;
  onFinish: () => void;
  onCancel: () => void;
  soundEnabled: boolean;
}

export const RestTimerFloating: React.FC<RestTimerFloatingProps> = ({
  initialSeconds,
  onFinish,
  onCancel,
  soundEnabled
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setTotalSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (soundEnabled) {
        sounds.playTimerComplete();
      }
      VoiceCoach.announceRestComplete();
      onFinish();
      return;
    }

    // Voice cue at 15 seconds remaining
    if (timeLeft === 15) {
      VoiceCoach.announceRestApproaching(15);
    }

    // Warning beeps at 3, 2, 1
    if (soundEnabled && timeLeft <= 3 && timeLeft > 0) {
      sounds.playWarningBeep();
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, soundEnabled, onFinish]);

  const addTime = (secs: number) => {
    setTimeLeft((prev) => Math.max(5, prev + secs));
    setTotalSeconds((prev) => Math.max(prev, prev + secs));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.min(100, Math.max(0, (timeLeft / totalSeconds) * 100));

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
