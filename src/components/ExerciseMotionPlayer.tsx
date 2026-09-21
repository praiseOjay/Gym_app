import React, { useState } from 'react';
import type { MuscleGroup } from '../types/gym';
import { getExerciseVisual } from '../data/exerciseVisualMap';
import { Dumbbell } from 'lucide-react';

interface ExerciseMotionPlayerProps {
  exerciseId?: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
  category?: 'Compound' | 'Isolation';
}

export const ExerciseMotionPlayer: React.FC<ExerciseMotionPlayerProps> = ({
  exerciseId,
  exerciseName,
  muscleGroup,
  equipment = 'Barbell'
}) => {
  const visualData = getExerciseVisual(exerciseId || exerciseName);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="motion-player-container">
      {/* Top HUD Header */}
      <div className="motion-hud-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="live-indicator-dot" />
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-volt)', letterSpacing: '0.3px' }}>
            3D Motion Demonstration
          </span>
        </div>

        <div
          style={{
            fontSize: '0.66rem',
            fontWeight: 800,
            color: 'var(--accent-volt)',
            background: 'rgba(0, 245, 155, 0.12)',
            border: '1px solid rgba(0, 245, 155, 0.3)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
        >
          <span>✓ Cached Offline</span>
        </div>
      </div>

      {/* Anatomical Demonstration Stage */}
      <div className="anatomical-stage">
        {visualData?.gifUrl && !imgError ? (
          <div className="anatomical-card-canvas">
            {imgLoading && <div className="anatomical-skeleton" />}
            <img
              src={visualData.gifUrl}
              alt={visualData.name}
              className="anatomical-gif-img"
              style={{ display: imgLoading ? 'none' : 'block' }}
              onLoad={() => {
                setImgLoading(false);
                setImgError(false);
              }}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              minHeight: 180,
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 16
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(0, 245, 155, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-volt)'
              }}
            >
              <Dumbbell size={22} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#fff' }}>
              {exerciseName}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {muscleGroup} · {equipment}
            </span>
          </div>
        )}

        {/* Highlighted Target Muscles Chips */}
        {visualData && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: 10,
              padding: '0 4px'
            }}
          >
            {visualData.targetMuscles.map((tm) => (
              <span
                key={tm}
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: 'rgba(255, 77, 77, 0.16)',
                  color: '#FF6B6B',
                  border: '1px solid rgba(255, 77, 77, 0.35)',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                🔴 {tm}
              </span>
            ))}
            {visualData.secondaryMuscles.slice(0, 2).map((sm) => (
              <span
                key={sm}
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                ⚪ {sm}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
