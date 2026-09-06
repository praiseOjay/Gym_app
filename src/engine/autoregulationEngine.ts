// Intra-Workout Real-Time Autoregulation Engine
// Evaluates performance drop-offs, RPE overshoots, and generates precision warmups

import type { WorkoutSet, AutoregulationCue } from '../types/gym';

/**
 * Rounds weight to nearest usable plate increment (2.5kg or 5lbs)
 */
function roundToIncrement(val: number, unit: 'kg' | 'lbs' = 'kg'): number {
  const step = unit === 'lbs' ? 5 : 2.5;
  return Math.round(val / step) * step;
}

/**
 * Evaluates a just-completed set against prior sets and meso target RIR to provide live tactical adjustments
 */
export function evaluateAutoregulation(
  completedSetIdx: number,
  sets: WorkoutSet[],
  targetRir: number = 2,
  exerciseName: string = 'Exercise',
  unit: 'kg' | 'lbs' = 'kg'
): AutoregulationCue | null {
  const currentSet = sets[completedSetIdx];
  if (!currentSet || currentSet.type === 'warmup') return null;
  if (!currentSet.completed || currentSet.weightKg <= 0 || currentSet.reps <= 0) return null;

  // Filter completed working sets up to and including current
  const completedWorkingSets = sets
    .slice(0, completedSetIdx + 1)
    .filter((s) => s.completed && s.type !== 'warmup');

  if (completedWorkingSets.length === 0) return null;

  const currentRpe = currentSet.rpe || (10 - targetRir);
  const targetRpe = 10 - targetRir;
  const remainingWorkingSets = sets
    .slice(completedSetIdx + 1)
    .filter((s) => !s.completed && s.type !== 'warmup');

  // 1. Check for Acute Rep Drop-off (>30% drop from first or previous working set)
  if (completedWorkingSets.length >= 2) {
    const prevSet = completedWorkingSets[completedWorkingSets.length - 2];
    if (prevSet.weightKg >= currentSet.weightKg * 0.95) {
      const repDrop = prevSet.reps - currentSet.reps;
      const dropPct = repDrop / prevSet.reps;

      if (dropPct >= 0.3 && currentSet.reps < 8) {
        // Drop-off is significant and reps fell below ideal hypertrophy floor
        const dropAmount = unit === 'lbs' ? 10 : 5;
        const suggestedWeight = Math.max(
          roundToIncrement(currentSet.weightKg * 0.9, unit),
          unit === 'lbs' ? 10 : 5
        );

        return {
          id: `cue-dropoff-${Date.now()}`,
          exerciseIdx: 0,
          setIdx: completedSetIdx,
          type: 'drop_off',
          title: 'Acute Muscle Drop-off Detected',
          message: `Reps dropped from ${prevSet.reps} to ${currentSet.reps} (${Math.round(dropPct * 100)}% drop). High localized fatigue in prime movers. Reduce load by ${dropAmount} ${unit} on remaining sets to maintain mechanical tension.`,
          action: 'reduce_weight',
          suggestedWeightKg: suggestedWeight,
          confidence: 0.92
        };
      }
    }
  }

  // 2. Check for RPE Severe Overshoot (Hit failure when target was conservative accumulation)
  if (currentRpe >= 9.5 && targetRir >= 2) {
    const suggestedReduction = roundToIncrement(currentSet.weightKg * 0.925, unit);
    return {
      id: `cue-overshoot-${Date.now()}`,
      exerciseIdx: 0,
      setIdx: completedSetIdx,
      type: 'overshoot',
      title: 'Target RIR Overshoot (Hit Failure)',
      message: `Meso target was ${targetRir} RIR (RPE ${targetRpe}), but this set reached RPE ${currentRpe}. To prevent premature systemic fatigue, drop load for the next set or cap volume.`,
      action: remainingWorkingSets.length > 2 ? 'truncate_set' : 'reduce_weight',
      suggestedWeightKg: suggestedReduction,
      confidence: 0.88
    };
  }

  // 3. Check for Consecutive Failure Sets (Failure Density Alert)
  const failureSetsCount = completedWorkingSets.filter((s) => (s.rpe && s.rpe >= 10)).length;
  if (failureSetsCount >= 2 && remainingWorkingSets.length > 0) {
    return {
      id: `cue-failure-${Date.now()}`,
      exerciseIdx: 0,
      setIdx: completedSetIdx,
      type: 'failure_limit',
      title: 'Max Stimulus Reached',
      message: `${failureSetsCount} sets taken to absolute failure on ${exerciseName}. Hypertrophy stimulus is saturated and additional failure sets will exponentially increase recovery debt. Consider skipping remaining sets.`,
      action: 'truncate_set',
      confidence: 0.85
    };
  }

  // 4. Check for RPE Undershoot (Too light, missing effective progressive overload)
  if (currentRpe <= 6.5 && targetRir <= 1 && currentSet.reps >= 10) {
    const bumpAmount = unit === 'lbs' ? 5 : 2.5;
    const suggestedWeight = roundToIncrement(currentSet.weightKg + (unit === 'lbs' ? 2.27 : 2.5), unit);

    return {
      id: `cue-undershoot-${Date.now()}`,
      exerciseIdx: 0,
      setIdx: completedSetIdx,
      type: 'undershoot',
      title: 'Sub-Threshold Stimulus Detected',
      message: `Set was completed with ~${10 - currentRpe} RIR (RPE ${currentRpe}). Target is high-effort ${targetRir} RIR. Increase load by +${bumpAmount} ${unit} for your next set to maximize motor unit recruitment.`,
      action: 'increase_weight',
      suggestedWeightKg: suggestedWeight,
      confidence: 0.82
    };
  }

  return null;
}

/**
 * Generates an evidence-based 3-step progressive warmup pyramid
 * Step 1: 50% working weight x 8 reps (warm synovial fluid, groove pattern)
 * Step 2: 70% working weight x 4 reps (rate of force development)
 * Step 3: 85% working weight x 1 rep (neuromuscular potentiation without metabolic burn)
 */
export function generateWarmupPyramid(
  workingWeightKg: number,
  unit: 'kg' | 'lbs' = 'kg'
): WorkoutSet[] {
  if (workingWeightKg <= 10) return [];

  const step1Weight = Math.max(roundToIncrement(workingWeightKg * 0.5, unit), unit === 'lbs' ? 45 : 20);
  const step2Weight = Math.max(roundToIncrement(workingWeightKg * 0.7, unit), step1Weight);
  const step3Weight = Math.max(roundToIncrement(workingWeightKg * 0.85, unit), step2Weight);

  const now = Date.now();
  const warmupSets: WorkoutSet[] = [
    {
      id: `s-warmup-${now}-1`,
      setNumber: 1,
      type: 'warmup',
      weightKg: step1Weight,
      reps: 8,
      completed: false,
      rpe: 5
    },
    {
      id: `s-warmup-${now}-2`,
      setNumber: 2,
      type: 'warmup',
      weightKg: step2Weight,
      reps: 4,
      completed: false,
      rpe: 6.5
    },
    {
      id: `s-warmup-${now}-3`,
      setNumber: 3,
      type: 'warmup',
      weightKg: step3Weight,
      reps: 1,
      completed: false,
      rpe: 7.5
    }
  ];

  return warmupSets;
}
