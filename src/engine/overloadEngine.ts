import type {
  WorkoutSession,
  WorkoutSet,
  OverloadRecommendation,
  MuscleGroup,
  MuscleRecoveryState,
  PlateCalculation,
  PRRecord
} from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

/**
 * Calculates Estimated One Rep Max (1RM) using Epley's formula.
 * 1RM = Weight * (1 + Reps / 30)
 */
export function calculate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  const epley = weightKg * (1 + reps / 30);
  return Math.round(epley * 10) / 10;
}

/**
 * Convert kg to lbs with 1 decimal precision
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

/**
 * Convert lbs to kg with 1 decimal precision
 */
export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

/**
 * Format weight according to user's unit preference
 */
export function formatWeight(weightKg: number, unit: 'kg' | 'lbs'): string {
  if (unit === 'lbs') {
    return `${kgToLbs(weightKg)} lbs`;
  }
  return `${weightKg} kg`;
}

/**
 * Determines whether a set is a Personal Record (PR).
 */
export function checkIfPR(
  exerciseId: string,
  weightKg: number,
  reps: number,
  existingPRs: PRRecord[]
): { isPR: boolean; type?: '1RM' | 'MaxWeight' | 'MaxVolume'; prevRecord?: number } {
  if (weightKg <= 0 || reps <= 0) return { isPR: false };

  const est1RM = calculate1RM(weightKg, reps);
  const existing1RMPR = existingPRs.find(
    (p) => p.exerciseId === exerciseId && p.type === '1RM'
  );

  if (!existing1RMPR || est1RM > existing1RMPR.value) {
    return {
      isPR: true,
      type: '1RM',
      prevRecord: existing1RMPR ? existing1RMPR.value : undefined
    };
  }

  const existingWeightPR = existingPRs.find(
    (p) => p.exerciseId === exerciseId && p.type === 'MaxWeight'
  );
  if (!existingWeightPR || weightKg > existingWeightPR.value) {
    return {
      isPR: true,
      type: 'MaxWeight',
      prevRecord: existingWeightPR ? existingWeightPR.value : undefined
    };
  }

  return { isPR: false };
}

/**
 * Analyzes historical performance for an exercise and calculates next target overload.
 */
export function calculateProgressiveOverload(
  exerciseId: string,
  targetRepRange: [number, number],
  historySessions: WorkoutSession[]
): OverloadRecommendation {
  const [minRep, maxRep] = targetRepRange;

  // Find all past logs for this exercise across sessions (sorted most recent first)
  const pastExerciseLogs: { date: string; sets: WorkoutSet[] }[] = [];
  for (const session of historySessions) {
    const found = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (found && found.sets.some((s) => s.completed)) {
      pastExerciseLogs.push({
        date: session.date,
        sets: found.sets.filter((s) => s.completed)
      });
    }
  }

  // If no history exists, provide standard baseline suggestion
  if (pastExerciseLogs.length === 0) {
    return {
      exerciseId,
      currentWeight: 0,
      currentReps: 0,
      targetWeight: 20, // default bar or light baseline
      targetReps: minRep,
      targetRpe: 8,
      strategy: 'maintain',
      badgeText: 'BASELINE SESSION',
      explanation: 'First time tracking this exercise. Establish a solid working weight aiming for clean form and target RPE 8.'
    };
  }

  const lastSession = pastExerciseLogs[0];
  const lastWorkingSets = lastSession.sets.filter(
    (s) => s.type === 'working' || s.type === 'failure'
  );
  const bestSet = (lastWorkingSets.length > 0 ? lastWorkingSets : lastSession.sets).reduce(
    (max, set) => {
      const currentScore = calculate1RM(set.weightKg, set.reps);
      const maxScore = calculate1RM(max.weightKg, max.reps);
      return currentScore > maxScore ? set : max;
    },
    lastSession.sets[0]
  );

  const currWeight = bestSet.weightKg;
  const currReps = bestSet.reps;
  const currRpe = bestSet.rpe || 8;

  // Detect exercise equipment to know weight increments (dumbbells vs barbells vs cables)
  const exerciseMeta = EXERCISE_LIBRARY.find((e) => e.id === exerciseId);
  const isDumbbell = exerciseMeta?.equipment === 'Dumbbell';
  const isCableOrMachine = exerciseMeta?.equipment === 'Cable' || exerciseMeta?.equipment === 'Machine';
  const weightIncrement = isDumbbell ? 2 : isCableOrMachine ? 2.5 : 2.5;

  // Case 1: Reached or exceeded the top of the rep range with manageable RPE
  if (currReps >= maxRep && currRpe <= 8.5) {
    const nextWeight = currWeight + weightIncrement;
    return {
      exerciseId,
      currentWeight: currWeight,
      currentReps: currReps,
      targetWeight: nextWeight,
      targetReps: minRep,
      targetRpe: 8,
      strategy: 'increase_weight',
      badgeText: `OVERLOAD: +${weightIncrement}kg`,
      explanation: `You conquered ${currReps} reps at ${currWeight}kg! Time to level up: increase weight to ${nextWeight}kg and aim for ${minRep} strict reps.`
    };
  }

  // Case 2: In the target rep range, but not at max yet
  if (currReps >= minRep && currReps < maxRep) {
    const nextReps = currReps + 1;
    return {
      exerciseId,
      currentWeight: currWeight,
      currentReps: currReps,
      targetWeight: currWeight,
      targetReps: nextReps,
      targetRpe: 8.5,
      strategy: 'increase_reps',
      badgeText: `REP PROGRESSION: +1 REP`,
      explanation: `Great control with ${currWeight}kg x ${currReps}. Keep the same weight today and push for ${nextReps} reps before adding load.`
    };
  }

  // Case 3: Failed below target rep range
  // Check if failed in previous session too (plateau / deload check)
  const failedPreviousToo =
    pastExerciseLogs.length > 1 &&
    pastExerciseLogs[1].sets.some((s) => s.reps < minRep && s.weightKg >= currWeight);

  if (currReps < minRep && failedPreviousToo) {
    const deloadWeight = Math.max(5, Math.round((currWeight * 0.9) / 2.5) * 2.5);
    return {
      exerciseId,
      currentWeight: currWeight,
      currentReps: currReps,
      targetWeight: deloadWeight,
      targetReps: maxRep,
      targetRpe: 7,
      strategy: 'deload',
      badgeText: 'DELOAD / RESET (-10%)',
      explanation: `Consecutive sessions below target rep range (${currReps} reps). Recommended deload to ${deloadWeight}kg to allow tendon recovery and explosive rep quality.`
    };
  }

  // Case 4: Maintain weight and solidify form
  return {
    exerciseId,
    currentWeight: currWeight,
    currentReps: currReps,
    targetWeight: currWeight,
    targetReps: Math.min(currReps + 1, maxRep),
    targetRpe: 8,
    strategy: 'maintain',
    badgeText: 'SOLIDIFY LOAD',
    explanation: `Aim to match or beat ${currReps} reps at ${currWeight}kg with stricter tempo and full stretch.`
  };
}

/**
 * Calculates visual plate loading per side for a standard barbell.
 */
export function calculateBarbellPlates(
  targetWeight: number,
  unit: 'kg' | 'lbs' = 'kg',
  barWeight = unit === 'kg' ? 20 : 45
): PlateCalculation {
  const plateDenominationsKg = [
    { weight: 25, color: '#FF334B' }, // Red
    { weight: 20, color: '#0088FF' }, // Blue
    { weight: 15, color: '#FFCC00' }, // Yellow
    { weight: 10, color: '#00CC66' }, // Green
    { weight: 5, color: '#FFFFFF' }, // White
    { weight: 2.5, color: '#1A1A1A' }, // Black
    { weight: 1.25, color: '#9E9E9E' } // Silver/Grey
  ];

  const plateDenominationsLbs = [
    { weight: 45, color: '#0088FF' },
    { weight: 35, color: '#FFCC00' },
    { weight: 25, color: '#00CC66' },
    { weight: 10, color: '#FFFFFF' },
    { weight: 5, color: '#1A1A1A' },
    { weight: 2.5, color: '#9E9E9E' }
  ];

  const denominations = unit === 'kg' ? plateDenominationsKg : plateDenominationsLbs;

  if (targetWeight <= barWeight) {
    return {
      targetWeight,
      unit,
      barWeight,
      weightPerSide: 0,
      platesPerSide: [],
      isExact: true,
      remainder: 0
    };
  }

  const weightNeededTotal = targetWeight - barWeight;
  let weightNeededPerSide = weightNeededTotal / 2;
  const platesPerSide: { weight: number; count: number; color: string }[] = [];

  for (const plate of denominations) {
    if (weightNeededPerSide >= plate.weight) {
      const count = Math.floor(weightNeededPerSide / plate.weight);
      platesPerSide.push({
        weight: plate.weight,
        count,
        color: plate.color
      });
      weightNeededPerSide -= count * plate.weight;
      weightNeededPerSide = Math.round(weightNeededPerSide * 100) / 100;
    }
  }

  return {
    targetWeight,
    unit,
    barWeight,
    weightPerSide: (targetWeight - barWeight) / 2,
    platesPerSide,
    isExact: weightNeededPerSide === 0,
    remainder: Math.round(weightNeededPerSide * 2 * 10) / 10
  };
}

/**
 * Calculates recovery status for all major muscle groups based on workout log history.
 */
export function calculateMuscleRecovery(
  sessions: WorkoutSession[],
  currentDate = new Date()
): MuscleRecoveryState[] {
  const muscleGroups: MuscleGroup[] = [
    'Chest',
    'Back',
    'Shoulders',
    'Quads',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Biceps',
    'Triceps',
    'Abs'
  ];

  // Recovery full recovery window: roughly 48 to 72 hours for hypertrophy training
  const FULL_RECOVERY_HOURS = 48;

  const result: MuscleRecoveryState[] = muscleGroups.map((muscle) => {
    let mostRecentTrainedTime: number | null = null;
    let totalRecentVolume = 0;

    for (const session of sessions) {
      const sessionTime = new Date(session.date).getTime();
      const hoursAgo = (currentDate.getTime() - sessionTime) / (1000 * 60 * 60);

      // We only consider workouts within the last 5 days
      if (hoursAgo > 120) continue;

      let trainedMuscle = false;
      for (const ex of session.exercises) {
        const exMeta = EXERCISE_LIBRARY.find((e) => e.id === ex.exerciseId);
        const isPrimary = exMeta?.muscleGroup === muscle;
        const isSecondary = exMeta?.secondaryMuscles.includes(muscle);

        if (isPrimary || isSecondary) {
          trainedMuscle = true;
          const exVol = ex.sets.reduce((sum, s) => (s.completed ? sum + s.weightKg * s.reps : sum), 0);
          totalRecentVolume += isPrimary ? exVol : exVol * 0.4;
        }
      }

      if (trainedMuscle) {
        if (mostRecentTrainedTime === null || sessionTime > mostRecentTrainedTime) {
          mostRecentTrainedTime = sessionTime;
        }
      }
    }

    if (mostRecentTrainedTime === null) {
      return {
        muscle,
        fatigueScore: 0,
        recoveryPercentage: 100,
        lastTrainedHoursAgo: 999,
        status: 'Fresh'
      };
    }

    const hoursAgo = Math.max(0, (currentDate.getTime() - mostRecentTrainedTime) / (1000 * 60 * 60));
    // Recovery curve: 0h = 10% recovered, 24h = 60%, 48h = 100%
    let recoveryPct = Math.min(100, Math.round((hoursAgo / FULL_RECOVERY_HOURS) * 100));
    recoveryPct = Math.max(15, recoveryPct);

    let status: 'Fresh' | 'Recovering' | 'Fatigued' = 'Fresh';
    if (recoveryPct < 55) {
      status = 'Fatigued';
    } else if (recoveryPct < 90) {
      status = 'Recovering';
    }

    return {
      muscle,
      fatigueScore: 100 - recoveryPct,
      recoveryPercentage: recoveryPct,
      lastTrainedHoursAgo: Math.round(hoursAgo),
      status
    };
  });

  return result;
}
