import React, { useState } from 'react';
import type { Routine, Exercise, RoutineExerciseTemplate } from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { triggerHaptic } from '../utils/haptics';
import { sounds } from '../utils/audio';
import { ExerciseDetailModal } from './ExerciseDetailModal';
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
  Save
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
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    routines[0]?.id || ''
  );
  const [inspectExercise, setInspectExercise] = useState<Exercise | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [showAddExercisePicker, setShowAddExercisePicker] = useState(false);
  const [exerciseFilterMuscle, setExerciseFilterMuscle] = useState<string>('All');

  // Keep active selection valid
  const currentRoutine =
    routines.find((r) => r.id === selectedRoutineId) || routines[0];

  const getExerciseMeta = (id: string): Exercise | undefined => {
    return EXERCISE_LIBRARY.find((e) => e.id === id);
  };

  const handleStartEditing = (routine: Routine) => {
    // Deep clone so edits don't mutate state prematurely
    setEditingRoutine(JSON.parse(JSON.stringify(routine)));
  };

  const handleCreateNewRoutine = () => {
    const newRoutine: Routine = {
      id: `routine-${Date.now()}`,
      name: 'New Custom Workout',
      description: 'Custom hypertrophy training session',
      weekday: 'Saturday',
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
    setEditingRoutine(null);
    sounds.playSetComplete();
    triggerHaptic('success');
  };

  const handleDeleteRoutine = (routineId: string) => {
    if (routines.length <= 1) {
      alert('You must have at least one routine in your split.');
      return;
    }
    const target = routines.find((r) => r.id === routineId);
    if (window.confirm(`Are you sure you want to delete "${target?.name}"?`)) {
      const updated = routines.filter((r) => r.id !== routineId);
      onUpdateRoutines(updated);
      setSelectedRoutineId(updated[0].id);
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
    const template: RoutineExerciseTemplate = {
      exerciseId: ex.id,
      defaultSets: 3,
      targetRepRange: ex.targetRepRange || [8, 12],
      defaultWeightKg: 20,
      targetRpe: ex.targetRpe || 8.5,
      restSeconds: 60
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
            return (
              <button
                key={routine.id}
                onClick={() => setSelectedRoutineId(routine.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '1rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  padding: '6px 4px 8px',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {routine.dayTag || routine.weekday}
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
              onClick={() => onStartRoutine(currentRoutine)}
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

                    <div style={{ color: 'var(--text-secondary)' }}>
                      <strong style={{ color: '#fff' }}>{targetReps}</strong> Reps (RPE {template.targetRpe})
                    </div>

                    <div style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>
                      {targetWeight} Kg
                    </div>
                  </div>
                </div>
              );
            })
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

            {/* Muscle Filter Tabs */}
            <div className="quick-prompts-row" style={{ marginBottom: 12 }}>
              {['All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Biceps', 'Triceps', 'Forearms', 'Calves', 'Abs'].map(
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

            {/* Exercises List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
              {EXERCISE_LIBRARY.filter(
                (e) => exerciseFilterMuscle === 'All' || e.muscleGroup === exerciseFilterMuscle
              ).map((ex) => (
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
