import React, { useState, useEffect } from 'react';
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  UserSettings,
  Exercise,
  PRRecord
} from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import {
  calculateProgressiveOverload,
  checkIfPR,
  kgToLbs,
  lbsToKg
} from '../engine/overloadEngine';
import { sounds } from '../utils/audio';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { SmartSwapModal } from './SmartSwapModal';
import { RestTimerFloating } from './RestTimerFloating';
import {
  Check,
  Plus,
  Sparkles,
  Calculator,
  Flame,
  CheckCircle2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActiveWorkoutViewProps {
  session: WorkoutSession;
  historySessions: WorkoutSession[];
  existingPRs: PRRecord[];
  settings: UserSettings;
  onUpdateSession: (updated: WorkoutSession) => void;
  onFinishWorkout: (completedSession: WorkoutSession) => void;
  onCancelWorkout: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  session,
  historySessions,
  existingPRs,
  settings,
  onUpdateSession,
  onFinishWorkout,
  onCancelWorkout
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(session.durationSeconds || 0);
  const [activeRestSeconds, setActiveRestSeconds] = useState<number | null>(null);
  const [plateModalWeight, setPlateModalWeight] = useState<{
    weight: number;
    exerciseIdx: number;
    setIdx: number;
  } | null>(null);
  const [swapExercise, setSwapExercise] = useState<{
    exerciseIdx: number;
    exercise: Exercise;
  } | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('All');
  const [newPRNotice, setNewPRNotice] = useState<string | null>(null);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Periodic sync to session
        if (next % 5 === 0) {
          onUpdateSession({ ...session, durationSeconds: next });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session, onUpdateSession]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Convert display values based on unit
  const displayWeight = (kg: number) => {
    if (settings.unit === 'lbs') return kgToLbs(kg);
    return kg;
  };

  const toStorageWeight = (val: number) => {
    if (settings.unit === 'lbs') return lbsToKg(val);
    return val;
  };

  // Set updates
  const handleSetChange = (
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    value: any
  ) => {
    const updatedExercises = [...session.exercises];
    const targetSet = { ...updatedExercises[exIdx].sets[setIdx], [field]: value };
    updatedExercises[exIdx].sets[setIdx] = targetSet;

    // Recalculate total volume
    const totalVol = calculateTotalVolume(updatedExercises);
    onUpdateSession({
      ...session,
      exercises: updatedExercises,
      totalVolumeKg: totalVol
    });
  };

  const calculateTotalVolume = (exercises: WorkoutExercise[]) => {
    return exercises.reduce((sum, ex) => {
      return (
        sum +
        ex.sets.reduce((sSum, s) => {
          return s.completed ? sSum + s.weightKg * s.reps : sSum;
        }, 0)
      );
    }, 0);
  };

  // Toggle set completion
  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const updatedExercises = [...session.exercises];
    const currentSet = updatedExercises[exIdx].sets[setIdx];
    const isNowCompleted = !currentSet.completed;

    let isPRFound = false;
    let prTitle = '';

    if (isNowCompleted && currentSet.weightKg > 0 && currentSet.reps > 0) {
      // Check PR
      const prCheck = checkIfPR(
        updatedExercises[exIdx].exerciseId,
        currentSet.weightKg,
        currentSet.reps,
        existingPRs
      );

      if (prCheck.isPR) {
        isPRFound = true;
        prTitle = `🔥 NEW PR: ${updatedExercises[exIdx].name} (${displayWeight(currentSet.weightKg)} ${settings.unit} × ${currentSet.reps} reps)`;
        setNewPRNotice(prTitle);
        if (settings.soundEnabled) sounds.playPRCelebration();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 }
        });
        setTimeout(() => setNewPRNotice(null), 4000);
      } else {
        if (settings.soundEnabled) sounds.playSetComplete();
      }

      // Trigger Rest Timer
      const restSec = updatedExercises[exIdx].restSeconds || settings.defaultRestSeconds || 90;
      setActiveRestSeconds(restSec);
    }

    updatedExercises[exIdx].sets[setIdx] = {
      ...currentSet,
      completed: isNowCompleted,
      isPR: isPRFound
    };

    const totalVol = calculateTotalVolume(updatedExercises);
    onUpdateSession({
      ...session,
      exercises: updatedExercises,
      totalVolumeKg: totalVol
    });
  };

  const handleAddSet = (exIdx: number) => {
    const updated = [...session.exercises];
    const sets = updated[exIdx].sets;
    const lastSet = sets[sets.length - 1];
    const newSetNumber = sets.length + 1;

    const newSet: WorkoutSet = {
      id: `set-${Date.now()}-${newSetNumber}`,
      setNumber: newSetNumber,
      type: 'working',
      weightKg: lastSet ? lastSet.weightKg : 20,
      reps: lastSet ? lastSet.reps : 10,
      completed: false
    };

    updated[exIdx].sets.push(newSet);
    onUpdateSession({ ...session, exercises: updated });
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    const updated = [...session.exercises];
    updated[exIdx].sets.splice(setIdx, 1);
    // Renumber
    updated[exIdx].sets.forEach((s, idx) => (s.setNumber = idx + 1));
    const totalVol = calculateTotalVolume(updated);
    onUpdateSession({ ...session, exercises: updated, totalVolumeKg: totalVol });
  };

  const handleAddExerciseToWorkout = (ex: Exercise) => {
    // Generate overload recommendation for first set
    const overload = calculateProgressiveOverload(ex.id, ex.targetRepRange, historySessions);

    const newWorkoutEx: WorkoutExercise = {
      id: `we-${Date.now()}`,
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      restSeconds: 90,
      sets: [
        {
          id: `set-${Date.now()}-1`,
          setNumber: 1,
          type: 'working',
          weightKg: overload.targetWeight || 20,
          reps: overload.targetReps || 10,
          targetWeightKg: overload.targetWeight,
          targetReps: overload.targetReps,
          completed: false
        }
      ]
    };

    const updated = [...session.exercises, newWorkoutEx];
    onUpdateSession({ ...session, exercises: updated });
    setShowAddExerciseModal(false);
  };

  const handleApplySwap = (newExerciseName: string, equipment: string) => {
    if (!swapExercise) return;
    const updated = [...session.exercises];
    updated[swapExercise.exerciseIdx] = {
      ...updated[swapExercise.exerciseIdx],
      name: newExerciseName,
      equipment: equipment as any
    };
    onUpdateSession({ ...session, exercises: updated });
    setSwapExercise(null);
  };

  const handleFinish = () => {
    // Count PRs
    const prsCount = session.exercises.reduce((count, ex) => {
      return count + ex.sets.filter((s) => s.isPR).length;
    }, 0);

    const completed: WorkoutSession = {
      ...session,
      durationSeconds: elapsedSeconds,
      totalVolumeKg: calculateTotalVolume(session.exercises),
      prCount: prsCount
    };

    onFinishWorkout(completed);
  };

  return (
    <div className="view-content" style={{ paddingBottom: 110 }}>
      {/* PR Flash Notification */}
      {newPRNotice && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            color: '#261600',
            padding: '10px 18px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: '0.85rem',
            zIndex: 100,
            boxShadow: '0 8px 30px rgba(255, 215, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Flame size={18} fill="#261600" />
          <span>{newPRNotice}</span>
        </div>
      )}

      {/* Top Session Stats Bar */}
      <div
        className="gym-card"
        style={{
          background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800, textTransform: 'uppercase' }}>
            {session.dayTag || 'Hypertrophy'} Active
          </span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            {session.routineName}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 14, textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Duration
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
              {formatElapsed(elapsedSeconds)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Volume
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
              {displayWeight(session.totalVolumeKg)} {settings.unit}
            </div>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {session.exercises.map((ex, exIdx) => {
          const exMeta = EXERCISE_LIBRARY.find((e) => e.id === ex.exerciseId);
          const overload = calculateProgressiveOverload(
            ex.exerciseId,
            exMeta?.targetRepRange || [8, 12],
            historySessions
          );

          return (
            <div key={ex.id || exIdx} className="workout-exercise-card">
              <div className="exercise-card-header">
                <div className="exercise-title-group">
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-meta-tags">
                    <span>{ex.muscleGroup}</span>
                    <span>•</span>
                    <span>{ex.equipment}</span>
                    {ex.equipment === 'Barbell' && (
                      <button
                        className="timer-chip"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}
                        onClick={() =>
                          setPlateModalWeight({
                            weight: ex.sets[0]?.weightKg || 60,
                            exerciseIdx: exIdx,
                            setIdx: 0
                          })
                        }
                      >
                        <Calculator size={12} /> Plate Calc
                      </button>
                    )}
                  </div>
                </div>

                <button
                  className="smart-swap-btn"
                  onClick={() =>
                    setSwapExercise({
                      exerciseIdx: exIdx,
                      exercise: exMeta || {
                        id: ex.exerciseId,
                        name: ex.name,
                        muscleGroup: ex.muscleGroup,
                        secondaryMuscles: [],
                        equipment: ex.equipment,
                        category: 'Compound',
                        targetRepRange: [8, 12],
                        targetRpe: 8
                      }
                    })
                  }
                  title="Swap if equipment is occupied"
                >
                  <Sparkles size={13} />
                  Swap
                </button>
              </div>

              {/* Progressive Overload Suggestion Pill */}
              <div
                style={{
                  background: 'rgba(0, 245, 155, 0.06)',
                  border: '1px solid rgba(0, 245, 155, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`overload-badge ${overload.strategy}`}>
                    {overload.badgeText}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                    Target: {displayWeight(overload.targetWeight)} {settings.unit} × {overload.targetReps} reps
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {overload.explanation}
                </p>
              </div>

              {/* Set Table */}
              <div className="set-table">
                <div className="set-table-header">
                  <span>Set</span>
                  <span>Prev</span>
                  <span>{settings.unit}</span>
                  <span>Reps</span>
                  <span></span>
                </div>

                {ex.sets.map((set, setIdx) => {
                  return (
                    <div
                      key={set.id || setIdx}
                      className={`set-row ${set.completed ? 'completed' : ''}`}
                    >
                      <div className="set-num-badge">{set.setNumber}</div>

                      <div className="set-previous-text">
                        {overload.currentWeight > 0
                          ? `${displayWeight(overload.currentWeight)}×${overload.currentReps}`
                          : '—'}
                      </div>

                      <div>
                        <input
                          type="number"
                          step="0.5"
                          className="set-input-box"
                          value={displayWeight(set.weightKg) || ''}
                          placeholder={String(displayWeight(overload.targetWeight))}
                          onChange={(e) =>
                            handleSetChange(
                              exIdx,
                              setIdx,
                              'weightKg',
                              toStorageWeight(parseFloat(e.target.value) || 0)
                            )
                          }
                        />
                      </div>

                      <div>
                        <input
                          type="number"
                          className="set-input-box"
                          value={set.reps || ''}
                          placeholder={String(overload.targetReps)}
                          onChange={(e) =>
                            handleSetChange(
                              exIdx,
                              setIdx,
                              'reps',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          className={`set-check-btn ${set.completed ? 'checked' : ''}`}
                          onClick={() => handleToggleSetComplete(exIdx, setIdx)}
                        >
                          <Check size={18} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Exercise Card Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <button
                  className="timer-chip"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => handleAddSet(exIdx)}
                >
                  <Plus size={14} /> Add Set
                </button>

                {ex.sets.length > 1 && (
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleRemoveSet(exIdx, ex.sets.length - 1)}
                  >
                    Remove Set
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise Button */}
      <button
        className="btn-secondary"
        style={{ width: '100%' }}
        onClick={() => setShowAddExerciseModal(true)}
      >
        <Plus size={18} />
        Add Exercise to Workout
      </button>

      {/* Finish Workout Action */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
        <button
          className="btn-secondary"
          style={{ flex: 1, color: 'var(--accent-crimson)', borderColor: 'rgba(255, 51, 102, 0.3)' }}
          onClick={onCancelWorkout}
        >
          Discard
        </button>
        <button
          className="btn-primary"
          style={{ flex: 2 }}
          onClick={handleFinish}
        >
          <CheckCircle2 size={20} />
          Complete Workout
        </button>
      </div>

      {/* Floating Rest Timer */}
      {activeRestSeconds !== null && (
        <RestTimerFloating
          initialSeconds={activeRestSeconds}
          soundEnabled={settings.soundEnabled}
          onFinish={() => setActiveRestSeconds(null)}
          onCancel={() => setActiveRestSeconds(null)}
        />
      )}

      {/* Plate Calculator Modal */}
      {plateModalWeight !== null && (
        <PlateCalculatorModal
          initialWeight={displayWeight(plateModalWeight.weight)}
          unit={settings.unit}
          onClose={() => setPlateModalWeight(null)}
          onApplyWeight={(newWeight) => {
            const kg = toStorageWeight(newWeight);
            handleSetChange(
              plateModalWeight.exerciseIdx,
              plateModalWeight.setIdx,
              'weightKg',
              kg
            );
          }}
        />
      )}

      {/* Smart Swap Modal */}
      {swapExercise !== null && (
        <SmartSwapModal
          exercise={swapExercise.exercise}
          apiKey={settings.geminiApiKey}
          onClose={() => setSwapExercise(null)}
          onSelectAlternative={handleApplySwap}
        />
      )}

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div className="modal-overlay" onClick={() => setShowAddExerciseModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Add Exercise</h3>
              <button
                onClick={() => setShowAddExerciseModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Muscle Filter Tabs */}
            <div className="quick-prompts-row">
              {['All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Biceps', 'Triceps', 'Abs'].map(
                (m) => (
                  <button
                    key={m}
                    className="quick-prompt-chip"
                    style={{
                      background: selectedMuscleFilter === m ? 'var(--accent-volt)' : undefined,
                      color: selectedMuscleFilter === m ? '#050D0A' : undefined,
                      fontWeight: selectedMuscleFilter === m ? 800 : undefined
                    }}
                    onClick={() => setSelectedMuscleFilter(m)}
                  >
                    {m}
                  </button>
                )
              )}
            </div>

            {/* Exercise Search/Select List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {EXERCISE_LIBRARY.filter(
                (e) => selectedMuscleFilter === 'All' || e.muscleGroup === selectedMuscleFilter
              ).map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleAddExerciseToWorkout(ex)}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{ex.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {ex.muscleGroup} · {ex.equipment} · {ex.targetRepRange[0]}-{ex.targetRepRange[1]} reps
                    </div>
                  </div>
                  <Plus size={20} color="var(--accent-volt)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
