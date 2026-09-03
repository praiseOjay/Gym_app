import React, { useState, useEffect } from 'react';
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  UserSettings,
  Exercise,
  PRRecord,
  SetType
} from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import {
  generateWarmupSets,
  calculateProgressiveOverload,
  checkIfPR,
  kgToLbs,
  lbsToKg
} from '../engine/overloadEngine';
import { sounds } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
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
  X,
  ArrowUp,
  ArrowDown,
  Trash2
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
          return s.completed && s.type !== 'warmup' ? sSum + s.weightKg * s.reps : sSum;
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
      if (currentSet.type !== 'warmup') {
        // Check PR (exclude warmup sets)
        const prCheck = checkIfPR(
          updatedExercises[exIdx].exerciseId,
          currentSet.weightKg,
          currentSet.reps,
          existingPRs,
          currentSet.type
        );

        if (prCheck.isPR) {
          isPRFound = true;
          prTitle = `🔥 NEW PR: ${updatedExercises[exIdx].name} (${displayWeight(currentSet.weightKg)} ${settings.unit} × ${currentSet.reps} reps)`;
          setNewPRNotice(prTitle);
          if (settings.soundEnabled) sounds.playPRCelebration();
          triggerHaptic('pr', settings.vibrationEnabled);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 }
          });
          setTimeout(() => setNewPRNotice(null), 4000);
        } else {
          if (settings.soundEnabled) sounds.playSetComplete();
          triggerHaptic('success', settings.vibrationEnabled);
        }
      } else {
        if (settings.soundEnabled) sounds.playSetComplete();
        triggerHaptic('light', settings.vibrationEnabled);
      }

      // Trigger Rest Timer
      const restSec = currentSet.type === 'warmup' ? 45 : (updatedExercises[exIdx].restSeconds || settings.defaultRestSeconds || 90);
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

  // Cycle set type: working -> warmup -> drop -> failure
  const cycleSetType = (exIdx: number, setIdx: number) => {
    const updated = [...session.exercises];
    const currentType = updated[exIdx].sets[setIdx].type || 'working';
    const order: SetType[] = ['working', 'warmup', 'drop', 'failure'];
    const nextType = order[(order.indexOf(currentType) + 1) % order.length];
    updated[exIdx].sets[setIdx] = { ...updated[exIdx].sets[setIdx], type: nextType };
    const totalVol = calculateTotalVolume(updated);
    onUpdateSession({ ...session, exercises: updated, totalVolumeKg: totalVol });
    triggerHaptic('light', settings.vibrationEnabled);
  };

  // Auto-generate 4-stage warmup ramp based on working load
  const handleGenerateWarmups = (exIdx: number) => {
    const ex = session.exercises[exIdx];
    const firstWorkingSet = ex.sets.find((s) => s.type !== 'warmup') || ex.sets[0];
    const workingWeight = firstWorkingSet ? firstWorkingSet.weightKg : 60;
    const barWeight = ex.equipment === 'Barbell' || ex.equipment === 'Smith Machine' ? 20 : 10;
    const ramp = generateWarmupSets(workingWeight, barWeight);

    const warmupSets: WorkoutSet[] = ramp.map((w, idx) => ({
      id: `warmup-${Date.now()}-${idx}`,
      setNumber: idx + 1,
      type: 'warmup',
      weightKg: w.weightKg,
      reps: w.reps,
      completed: false,
      targetWeightKg: w.weightKg,
      targetReps: w.reps
    }));

    // Retain existing working sets
    const existingWorkingSets = ex.sets.filter((s) => s.type !== 'warmup');
    const combinedSets = [...warmupSets, ...existingWorkingSets];

    // Renumber working sets
    let workNum = 1;
    combinedSets.forEach((s) => {
      if (s.type !== 'warmup') {
        s.setNumber = workNum++;
      }
    });

    const updated = [...session.exercises];
    updated[exIdx] = { ...ex, sets: combinedSets };
    onUpdateSession({ ...session, exercises: updated });
    triggerHaptic('medium', settings.vibrationEnabled);
  };

  // Reorder exercises up/down
  const handleMoveExercise = (exIdx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? exIdx - 1 : exIdx + 1;
    if (newIdx < 0 || newIdx >= session.exercises.length) return;
    const updated = [...session.exercises];
    const [moved] = updated.splice(exIdx, 1);
    updated.splice(newIdx, 0, moved);
    onUpdateSession({ ...session, exercises: updated });
    triggerHaptic('light', settings.vibrationEnabled);
  };

  // Remove exercise from active workout
  const handleRemoveExercise = (exIdx: number) => {
    if (session.exercises.length <= 1) {
      alert('A workout must contain at least one exercise.');
      return;
    }
    if (window.confirm(`Remove "${session.exercises[exIdx].name}" from this workout?`)) {
      const updated = [...session.exercises];
      updated.splice(exIdx, 1);
      const totalVol = calculateTotalVolume(updated);
      onUpdateSession({ ...session, exercises: updated, totalVolumeKg: totalVol });
      triggerHaptic('medium', settings.vibrationEnabled);
    }
  };

  const handleAddSet = (exIdx: number) => {
    const updated = [...session.exercises];
    const sets = updated[exIdx].sets;
    const lastSet = sets[sets.length - 1];
    const newSetNumber = sets.filter((s) => s.type !== 'warmup').length + 1;

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
    // Renumber working sets
    let workNum = 1;
    updated[exIdx].sets.forEach((s) => {
      if (s.type !== 'warmup') {
        s.setNumber = workNum++;
      }
    });
    const totalVol = calculateTotalVolume(updated);
    onUpdateSession({ ...session, exercises: updated, totalVolumeKg: totalVol });
  };

  const handleAddExerciseToWorkout = (ex: Exercise) => {
    // Generate overload recommendation for first set
    const overload = calculateProgressiveOverload(ex.id, ex.targetRepRange, historySessions);

    const newWorkoutEx: WorkoutExercise = {
      id: `we-${ex.id}-${session.exercises.length + 1}`,
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      restSeconds: 90,
      sets: [
        {
          id: `set-${ex.id}-1`,
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
                <div className="exercise-title-group" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="exercise-card-controls">
                      <button
                        className="icon-ctrl-btn"
                        disabled={exIdx === 0}
                        onClick={() => handleMoveExercise(exIdx, 'up')}
                        title="Move Exercise Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        className="icon-ctrl-btn"
                        disabled={exIdx === session.exercises.length - 1}
                        onClick={() => handleMoveExercise(exIdx, 'down')}
                        title="Move Exercise Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                    <div className="exercise-name">{ex.name}</div>
                  </div>

                  <div className="exercise-meta-tags" style={{ marginTop: 4 }}>
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
                    <button
                      className="timer-chip"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', color: '#FFA500' }}
                      onClick={() => handleGenerateWarmups(exIdx)}
                      title="Auto-generate 4-stage progressive warmup ramp"
                    >
                      <Flame size={12} color="#FFA500" /> Warmup Ramp
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                  <button
                    className="icon-ctrl-btn"
                    style={{ color: 'var(--accent-crimson)' }}
                    onClick={() => handleRemoveExercise(exIdx)}
                    title="Remove exercise from workout"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
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

              {/* In-workout Exercise Equipment & Cue Notes */}
              <div style={{ marginTop: 2 }}>
                <input
                  type="text"
                  placeholder="📝 Notes (e.g. seat height 4, pin 5, 2s pause)..."
                  value={ex.notes || ''}
                  onChange={(e) => {
                    const updated = [...session.exercises];
                    updated[exIdx] = { ...updated[exIdx], notes: e.target.value };
                    onUpdateSession({ ...session, exercises: updated });
                  }}
                  className="exercise-notes-input"
                />
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
                      <div
                        className={`set-num-badge set-badge-${set.type || 'working'}`}
                        onClick={() => cycleSetType(exIdx, setIdx)}
                        title="Tap to toggle set type (Working, Warmup, Drop, Failure)"
                        style={{ cursor: 'pointer' }}
                      >
                        {set.type === 'warmup' ? 'W' : set.type === 'drop' ? 'D' : set.type === 'failure' ? 'F' : set.setNumber}
                      </div>

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

              {/* Set Type Legend */}
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                <span>Badge:</span>
                <span style={{ color: 'var(--accent-cyan)' }}>1..N Work</span>
                <span>•</span>
                <span style={{ color: '#FFA500' }}>W Warmup</span>
                <span>•</span>
                <span style={{ color: '#B388FF' }}>D Drop</span>
                <span>•</span>
                <span style={{ color: '#FF3366' }}>F Failure</span>
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
              {['All', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Biceps', 'Triceps', 'Forearms', 'Calves', 'Abs'].map(
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
