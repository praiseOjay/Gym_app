import React, { useState } from 'react';
import type { WorkoutReadiness } from '../types/gym';
import { Zap, Moon, Activity, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { SwipeableModalSheet } from './SwipeableModalSheet';

interface ReadinessCheckinModalProps {
  onComplete: (readiness: WorkoutReadiness) => void;
  onSkip: () => void;
}

export const ReadinessCheckinModal: React.FC<ReadinessCheckinModalProps> = ({
  onComplete,
  onSkip
}) => {
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [energyRating, setEnergyRating] = useState<number>(4);
  const [sorenessLevel, setSorenessLevel] = useState<'recovered' | 'mild' | 'sore'>('recovered');

  // Compute readiness score (0 - 100)
  const calculateScore = () => {
    let score = 50;

    // Sleep contribution (0 to 30 pts)
    if (sleepHours >= 8) score += 30;
    else if (sleepHours >= 7) score += 25;
    else if (sleepHours >= 6) score += 15;
    else score += 5;

    // Energy contribution (0 to 20 pts)
    score += energyRating * 4;

    // Soreness deduction
    if (sorenessLevel === 'recovered') score += 0;
    else if (sorenessLevel === 'mild') score -= 12;
    else if (sorenessLevel === 'sore') score -= 25;

    return Math.max(20, Math.min(100, score));
  };

  const score = calculateScore();
  const status: 'optimal' | 'moderate' | 'fatigued' =
    score >= 80 ? 'optimal' : score >= 65 ? 'moderate' : 'fatigued';

  const calibratedRirDelta = status === 'fatigued' ? 1 : 0;
  const calibratedVolumeDelta = status === 'fatigued' ? -1 : 0;

  const handleFinish = () => {
    triggerHaptic('medium');
    const record: WorkoutReadiness = {
      id: `readiness-${Date.now()}`,
      date: new Date().toISOString(),
      sleepHours,
      energyRating,
      sorenessLevel,
      readinessScore: score,
      status,
      calibratedRirDelta,
      calibratedVolumeDelta,
      calibratedNote:
        status === 'optimal'
          ? 'Optimal readiness. Prime for maximum mechanical tension and target RIR.'
          : status === 'moderate'
          ? 'Moderate readiness. Stick to plan with controlled eccentric tempo.'
          : 'Low recovery readiness. Added +1 RIR buffer and capped secondary accessory sets to prevent CNS crash.'
    };
    onComplete(record);
  };

  const statusTheme = {
    optimal: { color: 'var(--accent-volt)', bg: 'rgba(0, 245, 155, 0.12)', border: 'rgba(0, 245, 155, 0.3)', label: 'Optimal Readiness' },
    moderate: { color: 'var(--accent-cyan)', bg: 'rgba(0, 229, 255, 0.12)', border: 'rgba(0, 229, 255, 0.3)', label: 'Moderate Capacity' },
    fatigued: { color: '#FFB800', bg: 'rgba(255, 184, 0, 0.12)', border: 'rgba(255, 184, 0, 0.3)', label: 'Fatigue Detected' }
  }[status];

  return (
    <SwipeableModalSheet
      onClose={onSkip}
      overlayStyle={{ zIndex: 10000 }}
      style={{ maxWidth: 480 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              ⚡ 15-Second Tactical Calibration
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: '2px 0 0' }}>
              Pre-Workout Readiness
            </h2>
          </div>
          <button
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontWeight: 700,
              padding: '6px 10px'
            }}
          >
            Skip
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          Calibrate today’s progressive overload and RIR targets to your acute physiological state.
        </p>

        {/* Dynamic Readiness HUD */}
        <div
          style={{
            background: statusTheme.bg,
            border: `1px solid ${statusTheme.border}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
              Calculated Capacity
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: statusTheme.color }}>
              {statusTheme.label}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: statusTheme.color }}>
              {score}%
            </span>
          </div>
        </div>

        {/* 1. Sleep Duration */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Moon size={14} color="var(--accent-cyan)" /> Sleep Duration
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {sleepHours} hrs
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {[5, 6, 7, 8, 9].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setSleepHours(hours)}
                style={{
                  padding: '7px 0',
                  borderRadius: 'var(--radius-sm)',
                  background: sleepHours === hours ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.05)',
                  color: sleepHours === hours ? '#050D0A' : 'var(--text-secondary)',
                  border: sleepHours === hours ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {hours}h{hours === 9 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Energy Level */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color="var(--accent-volt)" /> Energy & Drive
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-volt)' }}>
              {['Exhausted', 'Low', 'Normal', 'High', 'Unstoppable'][energyRating - 1]}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setEnergyRating(level)}
                style={{
                  padding: '7px 0',
                  borderRadius: 'var(--radius-sm)',
                  background: energyRating === level ? 'var(--accent-volt)' : 'rgba(255, 255, 255, 0.05)',
                  color: energyRating === level ? '#050D0A' : 'var(--text-secondary)',
                  border: energyRating === level ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {level}⚡
              </button>
            ))}
          </div>
        </div>

        {/* 3. Target Muscle Soreness */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Activity size={14} color="#FF6B00" /> Target Muscle Soreness
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { id: 'recovered', label: 'Fresh / 0 Sore' },
              { id: 'mild', label: 'Mild / Tender' },
              { id: 'sore', label: 'Stiff & Sore' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSorenessLevel(item.id as any)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-sm)',
                  background: sorenessLevel === item.id ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: sorenessLevel === item.id ? '#fff' : 'var(--text-secondary)',
                  border: sorenessLevel === item.id ? '1px solid var(--accent-volt)' : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleFinish}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #00F59B 0%, #00E5FF 100%)',
            color: '#050D0A',
            border: 'none',
            fontSize: '0.92rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 20px rgba(0, 245, 155, 0.35)'
          }}
        >
          <span>Apply Calibration & Start Workout</span>
          <ArrowRight size={17} />
        </button>
    </SwipeableModalSheet>
  );
};
