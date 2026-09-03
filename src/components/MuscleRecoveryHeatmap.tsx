import React, { useState } from 'react';
import type { MuscleRecoveryState, MuscleGroup } from '../types/gym';
import { Zap } from 'lucide-react';

interface MuscleRecoveryHeatmapProps {
  recoveryStates: MuscleRecoveryState[];
  onSelectMuscle?: (muscle: MuscleGroup) => void;
}

export const MuscleRecoveryHeatmap: React.FC<MuscleRecoveryHeatmapProps> = ({
  recoveryStates
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleRecoveryState | null>(
    recoveryStates[0] || null
  );
  const [viewAngle, setViewAngle] = useState<'front' | 'back'>('front');

  const getStatusColor = (status: 'Fresh' | 'Recovering' | 'Fatigued') => {
    switch (status) {
      case 'Fresh':
        return '#00F59B';
      case 'Recovering':
        return '#FFB800';
      case 'Fatigued':
        return '#FF3366';
    }
  };

  const getMuscle = (name: MuscleGroup): MuscleRecoveryState => {
    return (
      recoveryStates.find((m) => m.muscle === name) || {
        muscle: name,
        fatigueScore: 0,
        recoveryPercentage: 100,
        lastTrainedHoursAgo: 999,
        status: 'Fresh'
      }
    );
  };

  return (
    <div className="gym-card">
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div>
          <h3 className="section-title">
            <Zap size={18} color="var(--accent-volt)" />
            Muscle Recovery Heatmap
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Real-time hypertrophy fatigue & readiness
          </p>
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', padding: 3, borderRadius: 'var(--radius-full)' }}>
          <button
            className="timer-chip"
            style={{
              background: viewAngle === 'front' ? 'var(--accent-volt)' : 'transparent',
              color: viewAngle === 'front' ? '#050D0A' : 'var(--text-secondary)',
              border: 'none',
              fontWeight: 800
            }}
            onClick={() => setViewAngle('front')}
          >
            Front
          </button>
          <button
            className="timer-chip"
            style={{
              background: viewAngle === 'back' ? 'var(--accent-volt)' : 'transparent',
              color: viewAngle === 'back' ? '#050D0A' : 'var(--text-secondary)',
              border: 'none',
              fontWeight: 800
            }}
            onClick={() => setViewAngle('back')}
          >
            Back
          </button>
        </div>
      </div>

      {/* SVG Anatomical Diagram */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 0',
          background: 'radial-gradient(circle, rgba(23, 30, 45, 0.9) 0%, #0A0D14 90%)',
          borderRadius: 'var(--radius-lg)',
          position: 'relative'
        }}
      >
        <svg
          viewBox="0 0 240 320"
          width="200"
          height="260"
          style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.8))' }}
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Head & Neck Base Outline */}
          <circle cx="120" cy="35" r="18" fill="#1C2433" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <path d="M112 52 L112 62 L128 62 L128 52 Z" fill="#1C2433" />

          {viewAngle === 'front' ? (
            <>
              {/* SHOULDERS / DELTOIDS */}
              <path
                d="M86 64 C76 66, 68 76, 70 88 C73 98, 84 94, 88 88 Z"
                fill={getStatusColor(getMuscle('Shoulders').status)}
                opacity="0.85"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Shoulders'))}
              />
              <path
                d="M154 64 C164 66, 172 76, 170 88 C167 98, 156 94, 152 88 Z"
                fill={getStatusColor(getMuscle('Shoulders').status)}
                opacity="0.85"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Shoulders'))}
              />

              {/* CHEST / PECS */}
              <path
                d="M92 68 C110 68, 118 72, 118 96 C105 102, 92 98, 88 88 Z"
                fill={getStatusColor(getMuscle('Chest').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Chest'))}
              />
              <path
                d="M148 68 C130 68, 122 72, 122 96 C135 102, 148 98, 152 88 Z"
                fill={getStatusColor(getMuscle('Chest').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Chest'))}
              />

              {/* BICEPS */}
              <path
                d="M68 94 C62 104, 60 120, 68 126 C75 124, 76 110, 74 98 Z"
                fill={getStatusColor(getMuscle('Biceps').status)}
                opacity="0.85"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Biceps'))}
              />
              <path
                d="M172 94 C178 104, 180 120, 172 126 C165 124, 164 110, 166 98 Z"
                fill={getStatusColor(getMuscle('Biceps').status)}
                opacity="0.85"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Biceps'))}
              />

              {/* ABS */}
              <rect
                x="102"
                y="104"
                width="36"
                height="48"
                rx="6"
                fill={getStatusColor(getMuscle('Abs').status)}
                opacity="0.85"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Abs'))}
              />

              {/* QUADS */}
              <path
                d="M92 162 C84 175, 82 215, 96 235 C108 235, 114 195, 112 162 Z"
                fill={getStatusColor(getMuscle('Quads').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Quads'))}
              />
              <path
                d="M148 162 C156 175, 158 215, 144 235 C132 235, 126 195, 128 162 Z"
                fill={getStatusColor(getMuscle('Quads').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Quads'))}
              />

              {/* CALVES (Front shins) */}
              <path
                d="M94 246 C90 260, 92 290, 100 300 C106 295, 108 275, 104 246 Z"
                fill={getStatusColor(getMuscle('Calves').status)}
                opacity="0.8"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Calves'))}
              />
              <path
                d="M146 246 C150 260, 148 290, 140 300 C134 295, 132 275, 136 246 Z"
                fill={getStatusColor(getMuscle('Calves').status)}
                opacity="0.8"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Calves'))}
              />
            </>
          ) : (
            <>
              {/* BACK & LATS */}
              <path
                d="M90 66 C105 64, 135 64, 150 66 C160 85, 148 135, 120 148 C92 135, 80 85, 90 66 Z"
                fill={getStatusColor(getMuscle('Back').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Back'))}
              />

              {/* TRICEPS */}
              <path
                d="M66 90 C60 102, 58 118, 66 126 C72 120, 74 105, 72 94 Z"
                fill={getStatusColor(getMuscle('Triceps').status)}
                opacity="0.85"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Triceps'))}
              />
              <path
                d="M174 90 C180 102, 182 118, 174 126 C168 120, 166 105, 168 94 Z"
                fill={getStatusColor(getMuscle('Triceps').status)}
                opacity="0.85"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Triceps'))}
              />

              {/* GLUTES */}
              <path
                d="M94 154 C90 168, 92 186, 116 186 C118 165, 114 154, 94 154 Z"
                fill={getStatusColor(getMuscle('Glutes').status)}
                opacity="0.85"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Glutes'))}
              />
              <path
                d="M146 154 C150 168, 148 186, 124 186 C122 165, 126 154, 146 154 Z"
                fill={getStatusColor(getMuscle('Glutes').status)}
                opacity="0.85"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Glutes'))}
              />

              {/* HAMSTRINGS */}
              <path
                d="M94 190 C88 202, 88 226, 98 238 C108 238, 114 215, 114 190 Z"
                fill={getStatusColor(getMuscle('Hamstrings').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Hamstrings'))}
              />
              <path
                d="M146 190 C152 202, 152 226, 142 238 C132 238, 126 215, 126 190 Z"
                fill={getStatusColor(getMuscle('Hamstrings').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Hamstrings'))}
              />

              {/* CALVES */}
              <path
                d="M92 246 C84 262, 86 288, 98 300 C106 295, 108 275, 104 246 Z"
                fill={getStatusColor(getMuscle('Calves').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Calves'))}
              />
              <path
                d="M148 246 C156 262, 154 288, 142 300 C134 295, 132 275, 136 246 Z"
                fill={getStatusColor(getMuscle('Calves').status)}
                opacity="0.9"
                filter="url(#glow)"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedMuscle(getMuscle('Calves'))}
              />
            </>
          )}
        </svg>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'rgba(10, 13, 20, 0.8)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.68rem',
            fontWeight: 700
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00F59B' }} />
            <span>Fresh (90-100%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB800' }} />
            <span>Recovering (55-89%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF3366' }} />
            <span>Fatigued (&lt;55%)</span>
          </div>
        </div>
      </div>

      {/* Selected Muscle Detail Card */}
      {selectedMuscle && (
        <div
          style={{
            marginTop: 12,
            background: 'var(--bg-surface)',
            border: `1px solid ${getStatusColor(selectedMuscle.status)}`,
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ fontSize: '0.95rem' }}>{selectedMuscle.muscle}</strong>
              <span
                className={`recovery-status-chip ${selectedMuscle.status.toLowerCase()}`}
              >
                {selectedMuscle.status}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {selectedMuscle.lastTrainedHoursAgo > 100
                ? 'Trained > 4 days ago. Primed for overload!'
                : `Trained ${selectedMuscle.lastTrainedHoursAgo}h ago · ${selectedMuscle.recoveryPercentage}% recovered`}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: getStatusColor(selectedMuscle.status) }}>
              {selectedMuscle.recoveryPercentage}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
