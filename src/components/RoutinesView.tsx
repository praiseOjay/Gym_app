import React, { useState, useMemo } from 'react';
import type { Routine, Exercise, RoutineExerciseTemplate } from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/audio';
import { getTodayWorkoutState } from '../utils/dateUtils';
import { preloadRoutineGifs } from '../utils/offlineMedia';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { auditRoutineKinematics } from '../engine/biomechanicsEngine';
import { getExerciseTrackingType, formatDuration } from '../utils/trackingTypeUtils';
import {
  Play,
  Clock,
  Dumbbell,
  TrendingUp,
  X,
  Edit2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Search
} from 'lucide-react';

interface RoutinesViewProps {
  routines: Routine[];
  onStartRoutine: (routine: Routine) => void;
  onUpdateRoutines: (updatedRoutines: Routine[]) => void;
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  routines,
  onStartRoutine,
  onUpdateRoutines
}) => {
  const todayWorkout = useMemo(() => getTodayWorkoutState(routines), [routines]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    todayWorkout.routine?.id || routines[0]?.id || ''
  );
  const [inspectExercise, setInspectExercise] = useState<Exercise | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [showAddExercisePicker, setShowAddExercisePicker] = useState(false);
  const [exerciseFilterMuscle, setExerciseFilterMuscle] = useState<string>('All');
  const [exerciseSearch, setExerciseSearch] = useState<string>('');

  // Keep active selection valid
  const currentRoutine =
    routines.find((r) => r.id === selectedRoutineId) || routines[0];

  const kinematicAudit = useMemo(() => {
    if (!currentRoutine || currentRoutine.exercises.length === 0) return null;
    return auditRoutineKinematics(currentRoutine.exercises.map((e) => e.exerciseId));
  }, [currentRoutine]);

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.toLowerCase().trim();
    return EXERCISE_LIBRARY.filter((e) => {
      const matchMuscle = exerciseFilterMuscle === 'All' || e.muscleGroup === exerciseFilterMuscle;
      if (!matchMuscle) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    });
  }, [exerciseFilterMuscle, exerciseSearch]);

  const getExerciseMeta = (id: string): Exercise | undefined => {
    if (!id) return undefined;
    const lower = id.toLowerCase();
    return EXERCISE_LIBRARY.find(
      (e) => e.id.toLowerCase() === lower || e.name.toLowerCase() === lower
    );
  };

  const handleStartEditing = (routine: Routine) => {
    // Deep clone so edits don't mutate state prematurely
    setEditingRoutine(JSON.parse(JSON.stringify(routine)));
  };

  const handleCreateNewRoutine = () => {
    const newRoutine: Routine = {
      id: `routine-${Date.now()}`,
      name: 'New Custom Workout',
      description: 'Custom training session',
      weekday: 'Monday',
      splitType: 'Custom',
      dayTag: 'Custom',
      exercises: []
    };
    setEditingRoutine(newRoutine);
  };

  const handleSaveEditedRoutine = () => {
    if (!editingRoutine) return;
    if (!editingRoutine.name.trim()) {
      alert('Please enter a routine name.');
      return;
    }

    const existingIndex = routines.findIndex((r) => r.id === editingRoutine.id);
    let updated: Routine[];
    if (existingIndex >= 0) {
      updated = routines.map((r) => (r.id === editingRoutine.id ? editingRoutine : r));
    } else {
      updated = [...routines, editingRoutine];
      setSelectedRoutineId(editingRoutine.id);
    }

    onUpdateRoutines(updated);
    preloadRoutineGifs(editingRoutine).catch(() => {});
    setEditingRoutine(null);
    sounds.playSetComplete();
    triggerHaptic('success');
  };

  const handleDeleteRoutine = (routineId: string) => {
    const target = routines.find((r) => r.id === routineId);
    if (window.confirm(`Are you sure you want to delete "${target?.name || 'this routine'}"?`)) {
      const updated = routines.filter((r) => r.id !== routineId);
      onUpdateRoutines(updated);
      setSelectedRoutineId(updated.length > 0 ? updated[0].id : '');
      triggerHaptic('medium');
    }
  };

  // Editor exercise movements
  const handleMoveEditorExercise = (idx: number, direction: 'up' | 'down') => {
    if (!editingRoutine) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= editingRoutine.exercises.length) return;
    const updatedExercises = [...editingRoutine.exercises];
    const [moved] = updatedExercises.splice(idx, 1);
    updatedExercises.splice(newIdx, 0, moved);
    setEditingRoutine({ ...editingRoutine, exercises: updatedExercises });
  };

  const handleRemoveEditorExercise = (idx: number) => {
    if (!editingRoutine) return;
    const updated = [...editingRoutine.exercises];
    updated.splice(idx, 1);
    setEditingRoutine({ ...editingRoutine, exercises: updated });
  };

  const handleAddExerciseToEditor = (ex: Exercise) => {
    if (!editingRoutine) return;
    const trackingType = ex.trackingType || getExerciseTrackingType(ex);
    const template: RoutineExerciseTemplate = {
      exerciseId: ex.id,
      defaultSets: 3,
      targetRepRange: ex.targetRepRange || [8, 12],
      defaultWeightKg: trackingType === 'weight_reps' ? 20 : 0,
      targetRpe: ex.targetRpe || 8.5,
      restSeconds: 60,
      trackingType,
      defaultDistanceKm: trackingType === 'distance_time' ? 1.0 : undefined,
      defaultDurationSeconds: trackingType === 'distance_time' ? 900 : trackingType === 'time_only' ? 45 : undefined
    };
    setEditingRoutine({
      ...editingRoutine,
      exercises: [...editingRoutine.exercises, template]
    });
    setShowAddExercisePicker(false);
  };

  return (
    <div className="view-content" style={{ paddingBottom: 110 }}>
      {/* Horizontal Scroll Header for all routines + New button */}
      <div style={{ margin: '-4px -16px 12px', padding: '0 16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 8,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            scrollbarWidth: 'none'
          }}
        >
          {routines.map((routine) => {
            const isSelected = currentRoutine?.id === routine.id;
            const isToday = todayWorkout.routine?.id === routine.id && todayWorkout.isScheduledToday;
            return (
              <button
                key={routine.id}
                onClick={() => setSelectedRoutineId(routine.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: isSelected ? '#FFFFFF' : isToday ? 'var(--accent-volt)' : 'var(--text-muted)',
                  fontSize: '1rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  padding: '6px 6px 8px',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{routine.dayTag || routine.weekday}</span>
                {isToday && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      background: 'var(--accent-volt)',
                      color: '#050A0F',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.3px',
                      lineHeight: 1.2
                    }}
                  >
                    TODAY
                  </span>
                )}
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

          <button
            onClick={handleCreateNewRoutine}
            style={{
              background: 'rgba(0, 245, 155, 0.1)',
              border: '1px dashed var(--accent-volt)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent-volt)',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={13} />
            Add Day
          </button>
        </div>
      </div>

      {/* Empty State when no routines exist */}
      {routines.length === 0 && (
        <div className="gym-card" style={{ textAlign: 'center', padding: '48px 24px', marginTop: 12 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚡</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Fresh App Ready
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.5 }}>
            No routines in your split yet. You have full access to all 1,300+ WorkoutX exercises with accurate animated GIFs. Build your custom training routine!
          </p>
          <button
            className="btn-primary"
            style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: '0.95rem' }}
            onClick={handleCreateNewRoutine}
          >
            <Plus size={18} /> Create New Routine
          </button>
        </div>
      )}

      {/* Routine Overview Header with Edit & Start Actions */}
      {currentRoutine && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            gap: 8,
            flexWrap: 'wrap'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800, textTransform: 'uppercase' }}>
              {currentRoutine.dayTag || currentRoutine.weekday} · {currentRoutine.splitType}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              {currentRoutine.name}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {currentRoutine.exercises.length} Exercises · {currentRoutine.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => handleStartEditing(currentRoutine)}
              title="Edit routine exercises, sets, and weights"
            >
              <Edit2 size={13} />
              Edit Split
            </button>

            <button
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              onClick={() => {
                preloadRoutineGifs(currentRoutine).catch(() => {});
                onStartRoutine(currentRoutine);
              }}
            >
              <Play size={14} fill="#050D0A" />
              Start
            </button>
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      {currentRoutine && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentRoutine.exercises.length === 0 ? (
            <div className="gym-card" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
                This routine has no exercises yet. Add exercises to start lifting!
              </p>
              <button
                className="btn-primary"
                style={{ margin: '0 auto' }}
                onClick={() => handleStartEditing(currentRoutine)}
              >
                <Plus size={16} /> Add Exercises
              </button>
            </div>
          ) : (
            currentRoutine.exercises.map((template, idx) => {
              const meta = getExerciseMeta(template.exerciseId);
              const trackingType = getExerciseTrackingType(meta, template.trackingType);
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
                          {meta?.muscleGroup || 'Muscle'} · {meta?.equipment || 'Equipment'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> Rest time - {restFormatted}
                        </div>
                      </div>
                    </div>

                    {/* Stats Button */}
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
                        if (meta) setInspectExercise(meta);
                      }}
                      title="Exercise Details & Overload"
                    >
                      <TrendingUp size={16} />
                    </button>
                  </div>

                  {/* Bottom Stats Strip */}
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

                    {trackingType === 'distance_time' ? (
                      <>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          <strong style={{ color: '#fff' }}>{template.defaultDurationSeconds ? formatDuration(template.defaultDurationSeconds) : '20:00'}</strong> (Time)
                        </div>
                        <div style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                          {template.defaultDistanceKm || 3.0} km
                        </div>
                      </>
                    ) : trackingType === 'time_only' ? (
                      <>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Target Time
                        </div>
                        <div style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>
                          {formatDuration(template.defaultDurationSeconds || 60)}
                        </div>
                      </>
                    ) : trackingType === 'reps_only' ? (
                      <>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          Bodyweight
                        </div>
                        <div style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>
                          {targetReps} Reps
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          <strong style={{ color: '#fff' }}>{targetReps}</strong> Reps (RPE {template.targetRpe})
                        </div>
                        <div style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>
                          {targetWeight} Kg
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Kinematic Profile & Biomechanics Audit Card */}
      {kinematicAudit && kinematicAudit.totalExercises >= 2 && (
        <div
          className="gym-card"
          style={{
            padding: '18px 20px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.06))',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <TrendingUp size={16} color="#fff" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>Kinematic Profile Audit</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Length-tension curve balance analysis</p>
              </div>
            </div>
            <div
              style={{
                background: kinematicAudit.balanceScore >= 80 ? 'rgba(0, 245, 155, 0.15)' : kinematicAudit.balanceScore >= 60 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: kinematicAudit.balanceScore >= 80 ? '#00F59B' : kinematicAudit.balanceScore >= 60 ? '#FBBF24' : '#EF4444',
                borderRadius: 'var(--radius-full)', padding: '4px 10px',
                fontSize: '0.78rem', fontWeight: 800, fontFamily: 'var(--font-mono)'
              }}
            >
              {kinematicAudit.balanceScore}%
            </div>
          </div>

          {/* Profile Distribution Bars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            {(['stretched', 'mid', 'shortened'] as const).map((profile) => {
              const count = kinematicAudit.profileDistribution[profile];
              const pct = kinematicAudit.totalExercises > 0 ? Math.round((count / kinematicAudit.totalExercises) * 100) : 0;
              const colors = {
                stretched: { bg: '#8B5CF6', label: 'Stretched' },
                mid: { bg: '#06B6D4', label: 'Mid-Range' },
                shortened: { bg: '#F59E0B', label: 'Shortened' }
              };
              return (
                <div key={profile} style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, flexWrap: 'wrap', gap: 2 }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{colors[profile].label}</span>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: colors[profile].bg, whiteSpace: 'nowrap' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colors[profile].bg, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Redundancy Warnings */}
          {kinematicAudit.redundancies.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {kinematicAudit.redundancies.map((warn, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FBBF24', marginBottom: 4 }}>
                    ⚠️ {warn.muscle} — {warn.exerciseNames.length} redundant {warn.profile}-range exercises
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {warn.message}
                  </p>
                  {warn.suggestedAlternatives && warn.suggestedAlternatives.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {warn.suggestedAlternatives.map((alt, j) => (
                        <span
                          key={j}
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#A78BFA',
                            borderRadius: 'var(--radius-full)',
                            padding: '3px 10px',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}
                        >
                          💡 {alt.name} ({alt.profile})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {kinematicAudit.recommendations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {kinematicAudit.recommendations.slice(0, 3).map((rec, i) => (
                <p key={i} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {rec.startsWith('Excellent') ? '✅' : '💡'} {rec}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button to Start Current Routine */}
      {currentRoutine && currentRoutine.exercises.length > 0 && (
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
            Start {currentRoutine.dayTag || currentRoutine.weekday} Workout
          </button>
        </div>
      )}

      {/* VISUAL ROUTINE EDITOR MODAL */}
      {editingRoutine && (
        <div className="modal-overlay" onClick={() => setEditingRoutine(null)}>
          <div className="modal-sheet" style={{ maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {routines.some((r) => r.id === editingRoutine.id) ? 'Edit Routine' : 'Create Routine'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Customize routine metadata, exercises, target sets & weights
                </p>
              </div>
              <button
                onClick={() => setEditingRoutine(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Routine Metadata Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Routine Title
                </label>
                <input
                  type="text"
                  className="set-input-box"
                  style={{ textAlign: 'left', padding: '8px 12px', marginTop: 4 }}
                  value={editingRoutine.name}
                  onChange={(e) => setEditingRoutine({ ...editingRoutine, name: e.target.value })}
                  placeholder="e.g. Monday: Upper Body A"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Day Tag / Label
                  </label>
                  <input
                    type="text"
                    className="set-input-box"
                    style={{ textAlign: 'left', padding: '8px 12px', marginTop: 4 }}
                    value={editingRoutine.dayTag || ''}
                    onChange={(e) => setEditingRoutine({ ...editingRoutine, dayTag: e.target.value })}
                    placeholder="e.g. Monday / Push"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Split Type
                  </label>
                  <select
                    className="set-input-box"
                    style={{ textAlign: 'left', padding: '8px 10px', marginTop: 4 }}
                    value={editingRoutine.splitType}
                    onChange={(e) => setEditingRoutine({ ...editingRoutine, splitType: e.target.value as any })}
                  >
                    <option value="Upper/Lower">Upper/Lower</option>
                    <option value="Push/Pull/Legs">Push/Pull/Legs</option>
                    <option value="Full Body">Full Body</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Description / Focus
                </label>
                <input
                  type="text"
                  className="set-input-box"
                  style={{ textAlign: 'left', padding: '8px 12px', marginTop: 4 }}
                  value={editingRoutine.description}
                  onChange={(e) => setEditingRoutine({ ...editingRoutine, description: e.target.value })}
                  placeholder="Focus on chest stretch, heavy rows..."
                />
              </div>
            </div>

            {/* Exercises List in Editor */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-volt)', textTransform: 'uppercase' }}>
                  Exercises ({editingRoutine.exercises.length})
                </span>

                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setShowAddExercisePicker(true)}
                >
                  <Plus size={14} /> Add Exercise
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editingRoutine.exercises.map((template, idx) => {
                  const meta = getExerciseMeta(template.exerciseId);
                  const trackingType = getExerciseTrackingType(meta, template.trackingType);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="exercise-card-controls">
                            <button
                              className="icon-ctrl-btn"
                              disabled={idx === 0}
                              onClick={() => handleMoveEditorExercise(idx, 'up')}
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              className="icon-ctrl-btn"
                              disabled={idx === editingRoutine.exercises.length - 1}
                              onClick={() => handleMoveEditorExercise(idx, 'down')}
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{meta?.name || template.exerciseId}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              {meta?.muscleGroup} · {meta?.equipment}
                            </div>
                          </div>
                        </div>

                        <button
                          className="icon-ctrl-btn"
                          style={{ color: 'var(--accent-crimson)' }}
                          onClick={() => handleRemoveEditorExercise(idx)}
                          title="Remove exercise"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Sets, Reps, Weight & Rest Controls */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, fontSize: '0.75rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Sets</span>
                          <input
                            type="number"
                            className="set-input-box"
                            value={template.defaultSets}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              const updated = [...editingRoutine.exercises];
                              updated[idx].defaultSets = val;
                              setEditingRoutine({ ...editingRoutine, exercises: updated });
                            }}
                          />
                        </div>

                        {trackingType === 'distance_time' ? (
                          <>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Dist (km)</span>
                              <input
                                type="number"
                                step="0.1"
                                className="set-input-box"
                                value={template.defaultDistanceKm ?? 3.0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].defaultDistanceKm = val;
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Time (min)</span>
                              <input
                                type="number"
                                className="set-input-box"
                                value={Math.round((template.defaultDurationSeconds ?? 1200) / 60)}
                                onChange={(e) => {
                                  const mins = parseInt(e.target.value, 10) || 0;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].defaultDurationSeconds = mins * 60;
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Rest (s)</span>
                              <input
                                type="number"
                                step="15"
                                className="set-input-box"
                                value={template.restSeconds}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 60;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].restSeconds = val;
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                          </>
                        ) : trackingType === 'time_only' ? (
                          <>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Time (s)</span>
                              <input
                                type="number"
                                step="5"
                                className="set-input-box"
                                value={template.defaultDurationSeconds ?? 60}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 30;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].defaultDurationSeconds = val;
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Target RPE</span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                className="set-input-box"
                                value={template.targetRpe}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 8;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].targetRpe = val;
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Rest (s)</span>
                              <input
                                type="number"
                                step="15"
                                className="set-input-box"
                                value={template.restSeconds}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 60;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].restSeconds = val;
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                          </>
                        ) : trackingType === 'reps_only' ? (
                          <>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Min Reps</span>
                              <input
                                type="number"
                                className="set-input-box"
                                value={template.targetRepRange[0]}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 5;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].targetRepRange = [val, updated[idx].targetRepRange[1]];
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Max Reps</span>
                              <input
                                type="number"
                                className="set-input-box"
                                value={template.targetRepRange[1]}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 12;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].targetRepRange = [updated[idx].targetRepRange[0], val];
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Rest (s)</span>
                              <input
                                type="number"
                                step="15"
                                className="set-input-box"
                                value={template.restSeconds}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 60;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].restSeconds = val;
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Min Reps</span>
                              <input
                                type="number"
                                className="set-input-box"
                                value={template.targetRepRange[0]}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 6;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].targetRepRange = [val, updated[idx].targetRepRange[1]];
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Max Reps</span>
                              <input
                                type="number"
                                className="set-input-box"
                                value={template.targetRepRange[1]}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 12;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].targetRepRange = [updated[idx].targetRepRange[0], val];
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Weight (kg)</span>
                              <input
                                type="number"
                                className="set-input-box"
                                value={template.defaultWeightKg ?? 20}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = [...editingRoutine.exercises];
                                  updated[idx].defaultWeightKg = val;
                                  setEditingRoutine({ ...editingRoutine, exercises: updated });
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {routines.some((r) => r.id === editingRoutine.id) && (
                <button
                  className="btn-secondary"
                  style={{ color: 'var(--accent-crimson)', borderColor: 'rgba(255, 51, 102, 0.4)' }}
                  onClick={() => {
                    handleDeleteRoutine(editingRoutine.id);
                    setEditingRoutine(null);
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}

              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleSaveEditedRoutine}
              >
                <Save size={16} />
                Save Routine Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXERCISE PICKER MODAL */}
      {showAddExercisePicker && (
        <div className="modal-overlay" onClick={() => setShowAddExercisePicker(false)}>
          <div className="modal-sheet" style={{ maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Choose Exercise</h3>
              <button
                onClick={() => setShowAddExercisePicker(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Search 1,300+ exercises by name or equipment..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px 9px 36px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              {exerciseSearch && (
                <button
                  onClick={() => setExerciseSearch('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Muscle Filter Tabs */}
            <div className="quick-prompts-row" style={{ marginBottom: 10 }}>
              {['All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Biceps', 'Triceps', 'Calves', 'Forearms', 'Abs', 'Cardio'].map(
                (m) => (
                  <button
                    key={m}
                    className="quick-prompt-chip"
                    style={{
                      background: exerciseFilterMuscle === m ? 'var(--accent-volt)' : undefined,
                      color: exerciseFilterMuscle === m ? '#050D0A' : undefined,
                      fontWeight: exerciseFilterMuscle === m ? 800 : undefined
                    }}
                    onClick={() => setExerciseFilterMuscle(m)}
                  >
                    {m}
                  </button>
                )
              )}
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Showing {Math.min(filteredExercises.length, 60)} of {filteredExercises.length} exercises
            </div>

            {/* Exercises List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
              {filteredExercises.slice(0, 60).map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleAddExerciseToEditor(ex)}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{ex.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {ex.muscleGroup} · {ex.equipment} · {ex.targetRepRange[0]}-{ex.targetRepRange[1]} reps
                    </div>
                  </div>
                  <Plus size={18} color="var(--accent-volt)" />
                </div>
              ))}
              {filteredExercises.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No exercises found matching "{exerciseSearch}". Try another search term or filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Detail Modal with Biomechanical Visual Demo */}
      {inspectExercise && (
        <ExerciseDetailModal
          exercise={inspectExercise}
          onClose={() => setInspectExercise(null)}
        />
      )}
    </div>
  );
};
