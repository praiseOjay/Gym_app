import React, { useState, useEffect, useMemo } from 'react';
import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  UserSettings,
  Exercise,
  PRRecord,
  SetType,
  MuscleGroup,
  EquipmentType,
  MesocycleBlock
} from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import {
  generateWarmupSets,
  calculateProgressiveOverload,
  checkIfPR,
  kgToLbs,
  lbsToKg
} from '../engine/overloadEngine';
import { estimateLiveSessionCalories } from '../engine/calorieEngine';
import { sounds } from '../utils/audio';
import { triggerHaptic } from '../utils/haptics';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { SmartSwapModal } from './SmartSwapModal';
import { RestTimerFloating } from './RestTimerFloating';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { VoiceLoggerModal } from './VoiceLoggerModal';
import type { ParsedVoiceCommand } from '../services/voiceLogger';
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
  Trash2,
  Info,
  Mic,
  Layers,
  Search,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActiveWorkoutViewProps {
  session: WorkoutSession;
  historySessions: WorkoutSession[];
  existingPRs: PRRecord[];
  settings: UserSettings;
  mesocycleBlock?: MesocycleBlock;
  onUpdateSession: (updated: WorkoutSession) => void;
  onFinishWorkout: (completedSession: WorkoutSession) => void;
  onCancelWorkout: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  session,
  historySessions,
  existingPRs,
  settings,
  mesocycleBlock,
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
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState<string>('');
  const [newPRNotice, setNewPRNotice] = useState<string | null>(null);
  const [supersetNotice, setSupersetNotice] = useState<string | null>(null);
  const [inspectExerciseDetails, setInspectExerciseDetails] = useState<Exercise | null>(null);
  const [voiceLoggerTarget, setVoiceLoggerTarget] = useState<{
    exerciseIdx: number;
    setIdx: number;
  } | null>(null);

  // Live metabolic calorie burn calculation based on WorkoutX MET ratings
  const liveCalories = useMemo(() => {
    return estimateLiveSessionCalories(session.exercises, elapsedSeconds, settings.bodyWeightKg);
  }, [session.exercises, elapsedSeconds, settings.bodyWeightKg]);

  const currentWeekConfig = mesocycleBlock?.weeks.find(
    (w) => w.weekNumber === mesocycleBlock.currentWeek
  );

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Periodic sync to session
        if (next % 5 === 0) {
          onUpdateSession({
            ...session,
            durationSeconds: next,
            caloriesBurned: estimateLiveSessionCalories(session.exercises, next, settings.bodyWeightKg)
          });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session, onUpdateSession, settings.bodyWeightKg]);

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

  // Calculate session volume (excluding warmups)
  const calculateTotalVolume = (exercises: WorkoutExercise[]) => {
    return exercises.reduce((acc, ex) => {
      return (
        acc +
        ex.sets.reduce((sSum, s) => {
          return s.completed && s.type !== 'warmup' ? sSum + s.weightKg * s.reps : sSum;
        }, 0)
      );
    }, 0);
  };

  // Determine superset label (e.g. A1, A2, B1, B2)
  const getSupersetLabel = (groupId?: string, order?: number) => {
    if (!groupId) return null;
    const groupIds: string[] = [];
    session.exercises.forEach((e) => {
      if (e.supersetGroupId && !groupIds.includes(e.supersetGroupId)) {
        groupIds.push(e.supersetGroupId);
      }
    });
    const groupIdx = groupIds.indexOf(groupId);
    const letter = String.fromCharCode(65 + (groupIdx >= 0 ? groupIdx : 0));
    return `${letter}${order || 1}`;
  };

  // Link or unlink superset pairing with the following exercise
  const handleToggleSupersetWithNext = (exIdx: number) => {
    const updated = session.exercises.map((e) => ({ ...e }));
    const current = updated[exIdx];
    const next = updated[exIdx + 1];
    if (!next) return;

    if (current.supersetGroupId && current.supersetGroupId === next.supersetGroupId) {
      // Unlink both
      delete current.supersetGroupId;
      delete current.supersetOrder;
      delete next.supersetGroupId;
      delete next.supersetOrder;
    } else {
      // Link as superset pair
      const groupId = `ss-${Date.now()}`;
      current.supersetGroupId = groupId;
      current.supersetOrder = 1;
      next.supersetGroupId = groupId;
      next.supersetOrder = 2;
    }

    onUpdateSession({ ...session, exercises: updated });
    triggerHaptic('medium', settings.vibrationEnabled);
  };

  // Open voice logger for next incomplete set
  const handleOpenVoiceLogger = (preferredExIdx?: number) => {
    const targetExIdx = preferredExIdx !== undefined ? preferredExIdx : session.exercises.findIndex((e) => e.sets.some((s) => !s.completed));
    const activeExIdx = targetExIdx >= 0 ? targetExIdx : 0;
    const targetSetIdx = session.exercises[activeExIdx].sets.findIndex((s) => !s.completed);
    const activeSetIdx = targetSetIdx >= 0 ? targetSetIdx : Math.max(0, session.exercises[activeExIdx].sets.length - 1);
    setVoiceLoggerTarget({ exerciseIdx: activeExIdx, setIdx: activeSetIdx });
    triggerHaptic('light', settings.vibrationEnabled);
  };

  // Apply parsed speech commands to target set
  const handleApplyVoiceCommand = (cmd: ParsedVoiceCommand) => {
    if (!voiceLoggerTarget) return;
    const { exerciseIdx, setIdx } = voiceLoggerTarget;
    const updated = session.exercises.map((e) => ({
      ...e,
      sets: e.sets.map((s) => ({ ...s }))
    }));
    const targetSet = updated[exerciseIdx].sets[setIdx];
    if (!targetSet) return;

    if (cmd.setType) {
      targetSet.type = cmd.setType;
    }
    if (cmd.weightKg !== undefined) {
      targetSet.weightKg = cmd.weightKg;
    }
    if (cmd.reps !== undefined) {
      targetSet.reps = cmd.reps;
    }
    if (cmd.rpe !== undefined) {
      targetSet.rpe = cmd.rpe;
    }

    if (cmd.action === 'complete') {
      targetSet.completed = true;
      const totalVol = calculateTotalVolume(updated);
      onUpdateSession({ ...session, exercises: updated, totalVolumeKg: totalVol });
      handleToggleSetComplete(exerciseIdx, setIdx);
      return;
    }

    if (cmd.action === 'rest' && cmd.restSeconds) {
      setActiveRestSeconds(cmd.restSeconds);
    }

    const totalVol = calculateTotalVolume(updated);
    onUpdateSession({ ...session, exercises: updated, totalVolumeKg: totalVol });
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

  // Toggle set completion
  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    const updatedExercises = session.exercises.map((e) => ({
      ...e,
      sets: e.sets.map((s) => ({ ...s }))
    }));
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

      // Check if this exercise is in a superset pair
      const currentEx = updatedExercises[exIdx];
      let deferRestTimer = false;

      if (currentEx.supersetGroupId && currentEx.supersetOrder === 1) {
        // Find partner in superset (order === 2)
        const partnerEx = updatedExercises.find(
          (e, i) => i !== exIdx && e.supersetGroupId === currentEx.supersetGroupId && e.supersetOrder === 2
        );
        if (partnerEx) {
          const partnerMatchingSet = partnerEx.sets[setIdx] || partnerEx.sets.find((s) => !s.completed);
          if (partnerMatchingSet && !partnerMatchingSet.completed) {
            deferRestTimer = true;
            setSupersetNotice(`⚡ SUPERSET: Move immediately to ${partnerEx.name} (Set #${partnerMatchingSet.setNumber})!`);
            triggerHaptic('medium', settings.vibrationEnabled);
            setTimeout(() => setSupersetNotice(null), 4500);
          }
        }
      }

      // Trigger Rest Timer if not deferred by active superset round
      if (!deferRestTimer) {
        const restSec = currentSet.type === 'warmup' ? 45 : (updatedExercises[exIdx].restSeconds || settings.defaultRestSeconds || 90);
        setActiveRestSeconds(restSec);
      }
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

  const formatExerciseTitle = (rawName: string): string => {
    if (!rawName) return 'Exercise';
    if (rawName.includes(' ') && /[A-Z]/.test(rawName)) return rawName;
    return rawName
      .replace(/^db-/, 'dumbbell-')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleApplySwap = (newExerciseName: string, equipment: string) => {
    if (!swapExercise) return;
    const found = EXERCISE_LIBRARY.find(
      (e) =>
        e.name.toLowerCase() === newExerciseName.toLowerCase() ||
        e.id.toLowerCase() === newExerciseName.toLowerCase() ||
        e.name.toLowerCase().includes(newExerciseName.toLowerCase()) ||
        newExerciseName.toLowerCase().includes(e.name.toLowerCase())
    );

    const updated = [...session.exercises];
    const targetIdx = swapExercise.exerciseIdx;
    const oldEx = updated[targetIdx];

    updated[targetIdx] = {
      ...oldEx,
      exerciseId: found?.id || oldEx.exerciseId,
      name: found?.name || formatExerciseTitle(newExerciseName),
      muscleGroup: (found?.muscleGroup || oldEx.muscleGroup) as MuscleGroup,
      equipment: (found?.equipment || equipment) as EquipmentType
    };

    onUpdateSession({ ...session, exercises: updated });
    setSwapExercise(null);
    if (settings.soundEnabled) sounds.playSetComplete();
    triggerHaptic('medium', settings.vibrationEnabled);
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
      prCount: prsCount,
      caloriesBurned: liveCalories,
      mesocycleWeek: mesocycleBlock?.currentWeek,
      isDeload: currentWeekConfig?.phaseName === 'Deload'
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

      {/* Superset Immediate Cue Notification */}
      {supersetNotice && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #00F59B, #00E5FF)',
            color: '#050D0A',
            padding: '10px 18px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: '0.85rem',
            zIndex: 100,
            boxShadow: '0 8px 30px rgba(0, 245, 155, 0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <Layers size={18} color="#050D0A" />
          <span>{supersetNotice}</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-volt)', fontWeight: 800, textTransform: 'uppercase' }}>
              {session.dayTag || 'Hypertrophy'} Active
            </span>
            {currentWeekConfig && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  background: currentWeekConfig.phaseName === 'Deload' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 229, 255, 0.15)',
                  color: currentWeekConfig.phaseName === 'Deload' ? '#C084FC' : 'var(--accent-cyan)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: currentWeekConfig.phaseName === 'Deload' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(0, 229, 255, 0.3)'
                }}
              >
                W{currentWeekConfig.weekNumber}: {currentWeekConfig.targetRir} RIR ({currentWeekConfig.phaseName})
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: 3 }}>
            {session.routineName}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => handleOpenVoiceLogger()}
            title="Hands-free voice logging for sets"
          >
            <Mic size={14} color="#050D0A" />
            <span>Voice Log</span>
          </button>

          <div style={{ display: 'flex', gap: 12, textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Duration
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                {formatElapsed(elapsedSeconds)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Volume
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>
                {displayWeight(session.totalVolumeKg)} {settings.unit}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Burn
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem', color: '#FF7A00', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                <Flame size={13} color="#FF7A00" fill="#FF7A00" />
                <span>{liveCalories}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>kcal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deload Coaching Banner if Active Deload */}
      {currentWeekConfig?.phaseName === 'Deload' && (
        <div
          style={{
            background: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.78rem',
            color: '#D8B4FE'
          }}
        >
          <Zap size={15} color="#C084FC" />
          <span><strong>Deload Protocol Active:</strong> Perform ~50% normal working sets at 3 RIR. Clear neuromuscular fatigue and repair connective tissue.</span>
        </div>
      )}

      {/* Exercises List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {session.exercises.map((ex, exIdx) => {
          const exMeta = EXERCISE_LIBRARY.find(
            (e) => e.id.toLowerCase() === ex.exerciseId.toLowerCase() || e.name.toLowerCase() === ex.name.toLowerCase()
          );
          const displayName = exMeta?.name || formatExerciseTitle(ex.name);
          const displayMuscle = exMeta?.muscleGroup || ex.muscleGroup;
          const displayEquipment = exMeta?.equipment || ex.equipment;
          const overload = calculateProgressiveOverload(
            ex.exerciseId,
            exMeta?.targetRepRange || [8, 12],
            historySessions
          );
          const supersetLabel = getSupersetLabel(ex.supersetGroupId, ex.supersetOrder);

          return (
            <div
              key={ex.id || exIdx}
              className={`workout-exercise-card ${ex.supersetGroupId ? 'in-superset' : ''}`}
            >
              <div className="exercise-card-header">
                <div className="exercise-title-group">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div className="exercise-card-controls" style={{ flexShrink: 0, marginTop: 2 }}>
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="exercise-name">{displayName}</span>
                        {supersetLabel && (
                          <span className="superset-pill">
                            ⚡ SUPERSET {supersetLabel}
                          </span>
                        )}
                        <button
                          type="button"
                          className="icon-ctrl-btn"
                          style={{ width: 22, height: 22, borderRadius: '50%', color: 'var(--accent-cyan)', flexShrink: 0 }}
                          onClick={() => {
                            const fullMeta = EXERCISE_LIBRARY.find((e) => e.id === ex.exerciseId || e.name === ex.name);
                            setInspectExerciseDetails(fullMeta || {
                              id: ex.exerciseId,
                              name: displayName,
                              muscleGroup: displayMuscle,
                              secondaryMuscles: [],
                              equipment: displayEquipment,
                              category: 'Compound',
                              targetRepRange: [8, 12],
                              targetRpe: 8
                            });
                            triggerHaptic('light', settings.vibrationEnabled);
                          }}
                          title="View visual demo, execution cues & video"
                        >
                          <Info size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="exercise-meta-tags">
                    <span>{displayMuscle}</span>
                    <span>•</span>
                    <span>{displayEquipment}</span>
                    {(displayEquipment === 'Barbell' || displayEquipment === 'Smith Machine') && (
                      <button
                        className="plate-badge-btn"
                        onClick={() =>
                          setPlateModalWeight({
                            weight: ex.sets.find((s) => s.weightKg > 0)?.weightKg || 60,
                            exerciseIdx: exIdx,
                            setIdx: 0
                          })
                        }
                        title="Visual barbell plate calculator"
                      >
                        <Calculator size={11} /> Plates
                      </button>
                    )}
                    <button
                      className="timer-chip"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', color: '#FFA500' }}
                      onClick={() => handleGenerateWarmups(exIdx)}
                      title="Auto-generate 4-stage progressive warmup ramp"
                    >
                      <Flame size={12} color="#FFA500" /> Warmup Ramp
                    </button>
                    {/* Superset Link/Unlink Action */}
                    {(exIdx < session.exercises.length - 1 || ex.supersetGroupId) && (
                      <button
                        className="timer-chip"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          color: ex.supersetGroupId ? '#00E5FF' : 'var(--text-muted)'
                        }}
                        onClick={() => handleToggleSupersetWithNext(exIdx)}
                        title={ex.supersetGroupId ? 'Unlink superset pairing' : 'Link with next exercise as superset pair'}
                      >
                        <Layers size={11} /> {ex.supersetGroupId ? 'Unlink Superset' : 'Link Superset'}
                      </button>
                    )}
                    {/* Mic Quick Voice Log Action */}
                    <button
                      className="timer-chip"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', color: 'var(--accent-volt)' }}
                      onClick={() => handleOpenVoiceLogger(exIdx)}
                      title="Voice log sets for this exercise"
                    >
                      <Mic size={11} /> Voice Log
                    </button>
                  </div>
                </div>

                <div className="exercise-header-actions">
                  <button
                    id={`smart-swap-btn-${exIdx}`}
                    className="smart-swap-btn"
                    onClick={() =>
                      setSwapExercise({
                        exerciseIdx: exIdx,
                        exercise: exMeta || {
                          id: ex.exerciseId,
                          name: displayName,
                          muscleGroup: displayMuscle,
                          secondaryMuscles: [],
                          equipment: displayEquipment,
                          category: 'Compound',
                          targetRepRange: [8, 12],
                          targetRpe: 8
                        }
                      })
                    }
                    title="Swap if equipment is occupied"
                  >
                    <Sparkles size={13} />
                    <span>Swap</span>
                  </button>
                  <button
                    className="icon-ctrl-btn"
                    style={{ color: 'var(--accent-crimson)', flexShrink: 0 }}
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
                    <React.Fragment key={set.id || setIdx}>
                      <div
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => {
                            const cur = displayWeight(set.weightKg);
                            const step = settings.unit === 'lbs' ? 5 : 2.5;
                            const next = Math.max(0, Math.round((cur - step) * 10) / 10);
                            handleSetChange(exIdx, setIdx, 'weightKg', toStorageWeight(next));
                            triggerHaptic('light', settings.vibrationEnabled);
                          }}
                          title={`- ${settings.unit === 'lbs' ? 5 : 2.5}${settings.unit}`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          className="set-input-box"
                          style={{ minWidth: 42, padding: '8px 2px', fontSize: '0.85rem' }}
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
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() => {
                            const cur = displayWeight(set.weightKg);
                            const step = settings.unit === 'lbs' ? 5 : 2.5;
                            const next = Math.round((cur + step) * 10) / 10;
                            handleSetChange(exIdx, setIdx, 'weightKg', toStorageWeight(next));
                            triggerHaptic('light', settings.vibrationEnabled);
                          }}
                          title={`+ ${settings.unit === 'lbs' ? 5 : 2.5}${settings.unit}`}
                        >
                          +
                        </button>
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

                    {/* Smart Drop Set Auto-Calculate Chips */}
                    {set.type === 'drop' && !set.completed && (
                      <div className="drop-quick-calc-row">
                        <span className="drop-quick-label">⚡ Quick Drop:</span>
                        <button
                          type="button"
                          className="drop-calc-chip"
                          onClick={() => {
                            const prevLoad = setIdx > 0 ? ex.sets[setIdx - 1].weightKg : (overload.currentWeight || overload.targetWeight || 50);
                            const drop20 = Math.max(2.5, Math.round((prevLoad * 0.8) / 2.5) * 2.5);
                            handleSetChange(exIdx, setIdx, 'weightKg', drop20);
                            triggerHaptic('light', settings.vibrationEnabled);
                          }}
                          title="Drop load by 20%"
                        >
                          -20% ({displayWeight(Math.max(2.5, Math.round(((setIdx > 0 ? ex.sets[setIdx - 1].weightKg : (overload.currentWeight || overload.targetWeight || 50)) * 0.8) / 2.5) * 2.5))} {settings.unit})
                        </button>
                        <button
                          type="button"
                          className="drop-calc-chip"
                          onClick={() => {
                            const prevLoad = setIdx > 0 ? ex.sets[setIdx - 1].weightKg : (overload.currentWeight || overload.targetWeight || 50);
                            const drop25 = Math.max(2.5, Math.round((prevLoad * 0.75) / 2.5) * 2.5);
                            handleSetChange(exIdx, setIdx, 'weightKg', drop25);
                            triggerHaptic('light', settings.vibrationEnabled);
                          }}
                          title="Drop load by 25%"
                        >
                          -25% ({displayWeight(Math.max(2.5, Math.round(((setIdx > 0 ? ex.sets[setIdx - 1].weightKg : (overload.currentWeight || overload.targetWeight || 50)) * 0.75) / 2.5) * 2.5))} {settings.unit})
                        </button>
                      </div>
                    )}
                  </React.Fragment>
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
                value={exerciseSearchQuery}
                onChange={(e) => setExerciseSearchQuery(e.target.value)}
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
              {exerciseSearchQuery && (
                <button
                  onClick={() => setExerciseSearchQuery('')}
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

            {/* Filtered Exercise List with Slicing */}
            {(() => {
              const q = exerciseSearchQuery.toLowerCase().trim();
              const filtered = EXERCISE_LIBRARY.filter((e) => {
                const matchMuscle = selectedMuscleFilter === 'All' || e.muscleGroup === selectedMuscleFilter;
                if (!matchMuscle) return false;
                if (!q) return true;
                return (
                  e.name.toLowerCase().includes(q) ||
                  e.equipment.toLowerCase().includes(q) ||
                  e.id.toLowerCase().includes(q)
                );
              });

              return (
                <>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Showing {Math.min(filtered.length, 60)} of {filtered.length} exercises
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                    {filtered.slice(0, 60).map((ex) => (
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
                    {filtered.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No exercises found matching "{exerciseSearchQuery}". Try another search term or filter.
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Exercise Detail & Visual Demo Modal */}
      {inspectExerciseDetails && (
        <ExerciseDetailModal
          exercise={inspectExerciseDetails}
          onClose={() => setInspectExerciseDetails(null)}
        />
      )}

      {/* Hands-Free Voice Logger Modal */}
      {voiceLoggerTarget !== null && (
        <VoiceLoggerModal
          isOpen={true}
          onClose={() => setVoiceLoggerTarget(null)}
          activeExerciseName={session.exercises[voiceLoggerTarget.exerciseIdx]?.name || 'Exercise'}
          activeSetNumber={voiceLoggerTarget.setIdx + 1}
          unit={settings.unit}
          onApplyCommand={handleApplyVoiceCommand}
        />
      )}
    </div>
  );
};
