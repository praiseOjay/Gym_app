import React, { useState } from 'react';
import type { Routine, Exercise } from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import {
  Play,
  Clock,
  Dumbbell,
  TrendingUp,
  X
} from 'lucide-react';

interface RoutinesViewProps {
  routines: Routine[];
  onStartRoutine: (routine: Routine) => void;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  routines,
  onStartRoutine
}) => {
  const [activeWeekday, setActiveWeekday] = useState<string>(
    routines[0]?.weekday || 'Monday'
  );
  const [inspectExercise, setInspectExercise] = useState<Exercise | null>(null);

  const currentRoutine =
    routines.find((r) => r.weekday === activeWeekday) || routines[0];

  const getExerciseMeta = (id: string): Exercise | undefined => {
    return EXERCISE_LIBRARY.find((e) => e.id === id);
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="view-content" style={{ paddingBottom: 110 }}>
      {/* Weekday Horizontal Scroll Header (matching user's screenshot) */}
      <div style={{ margin: '-4px -16px 12px', padding: '0 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 8,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            scrollbarWidth: 'none'
          }}
        >
          {weekdays.map((day) => {
            const isSelected = activeWeekday === day;
            return (
              <button
                key={day}
                onClick={() => setActiveWeekday(day)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '1.05rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  padding: '6px 2px 8px',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {day}
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      background: 'var(--accent-volt)',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 0 10px var(--accent-volt)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Overview Header */}
      {currentRoutine && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800, textTransform: 'uppercase' }}>
              {currentRoutine.dayTag} Split
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              {currentRoutine.name}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {currentRoutine.exercises.length} Exercises · Focused Hypertrophy
            </p>
          </div>

          <button
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            onClick={() => onStartRoutine(currentRoutine)}
          >
            <Play size={14} fill="#050D0A" />
            Start
          </button>
        </div>
      )}

      {/* Exercise Cards matching the User's Screenshot Template */}
      {currentRoutine && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentRoutine.exercises.map((template, idx) => {
            const meta = getExerciseMeta(template.exerciseId);
            const targetWeight = template.defaultWeightKg || 20;
            const targetReps = template.targetRepRange[1] || 10;
            const restMins = Math.floor(template.restSeconds / 60);
            const restSecs = template.restSeconds % 60;
            const restFormatted = `0${restMins}:${restSecs < 10 ? '0' : ''}${restSecs}`;

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => meta && setInspectExercise(meta)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  {/* Left thumbnail badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 'var(--radius-lg)',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0A0D14',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        flexShrink: 0
                      }}
                    >
                      <Dumbbell size={26} strokeWidth={2.2} />
                    </div>

                    {/* Title & Muscle */}
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25 }}>
                        {meta?.name || template.exerciseId}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {meta?.muscleGroup || 'Muscle'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> Rest time - {restFormatted}
                      </div>
                    </div>
                  </div>

                  {/* History / Stats Icon Button */}
                  <button
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      meta && setInspectExercise(meta);
                    }}
                    title="Exercise Details & Overload"
                  >
                    <TrendingUp size={16} />
                  </button>
                </div>

                {/* Bottom Stats Strip (matching user's screenshot: • 3 Sets  10 Reps  140 Kg) */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff' }}>
                    <span style={{ color: 'var(--accent-volt)', fontSize: '1.1rem' }}>•</span>
                    <strong>{template.defaultSets} Sets</strong>
                  </div>

                  <div style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: '#fff' }}>{targetReps}</strong> Reps
                  </div>

                  <div style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>
                    {targetWeight} Kg
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (matching user's screenshot green capsule) */}
      {currentRoutine && (
        <div
          style={{
            position: 'fixed',
            bottom: 82,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            width: 'calc(100% - 32px)',
            maxWidth: 460
          }}
        >
          <button
            className="btn-primary"
            style={{ width: '100%', borderRadius: 'var(--radius-full)', padding: '14px 20px', boxShadow: '0 8px 28px rgba(0, 245, 155, 0.4)' }}
            onClick={() => onStartRoutine(currentRoutine)}
          >
            <Play size={20} fill="#050D0A" />
            Start {currentRoutine.weekday} Workout
          </button>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {inspectExercise && (
        <div className="modal-overlay" onClick={() => setInspectExercise(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-volt)', textTransform: 'uppercase' }}>
                  {inspectExercise.muscleGroup} · {inspectExercise.equipment}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                  {inspectExercise.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectExercise(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {inspectExercise.instructions && (
              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Execution Instructions
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {inspectExercise.instructions}
                </p>
              </div>
            )}

            {inspectExercise.tips && inspectExercise.tips.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-volt)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Hypertrophy Cues
                </div>
                <ul style={{ paddingLeft: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {inspectExercise.tips.map((t, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => setInspectExercise(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
