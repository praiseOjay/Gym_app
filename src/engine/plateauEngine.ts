// Automated Plateau Buster & Stagnation Diagnostics Engine
// Scans multi-session history to detect stalled compound lifts and prescribes tactical remedies

import type { WorkoutSession, PlateauDiagnosis } from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

/**
 * Calculates Brzycki / Epley estimated 1RM for performance tracking
 */
function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/**
 * Detects exercises that have failed to progress across 3 or more consecutive workouts
 */
export function detectStalledExercises(workouts: WorkoutSession[]): PlateauDiagnosis[] {
  if (!workouts || workouts.length < 3) return [];

  // Sort chronological
  const chronological = [...workouts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group top sets by exerciseId
  const exerciseExposures: Record<
    string,
    { date: string; weightKg: number; reps: number; est1RM: number; exerciseName: string }[]
  > = {};

  chronological.forEach((session) => {
    session.exercises.forEach((ex) => {
      // Look at completed working sets
      const workingSets = ex.sets.filter(
        (s) => s.completed && s.type !== 'warmup' && s.weightKg > 0 && s.reps > 0
      );
      if (workingSets.length === 0) return;

      // Find top set by estimated 1RM
      let topSet = workingSets[0];
      let best1RM = estimate1RM(topSet.weightKg, topSet.reps);

      workingSets.forEach((s) => {
        const est = estimate1RM(s.weightKg, s.reps);
        if (est > best1RM) {
          best1RM = est;
          topSet = s;
        }
      });

      if (!exerciseExposures[ex.exerciseId]) {
        exerciseExposures[ex.exerciseId] = [];
      }

      exerciseExposures[ex.exerciseId].push({
        date: session.date,
        weightKg: topSet.weightKg,
        reps: topSet.reps,
        est1RM: best1RM,
        exerciseName: ex.name
      });
    });
  });

  const plateauReports: PlateauDiagnosis[] = [];

  Object.entries(exerciseExposures).forEach(([exerciseId, exposures]) => {
    // Only analyze if performed in at least 3 distinct sessions
    if (exposures.length < 3) return;

    // Get last 3 exposures
    const last3 = exposures.slice(-3);
    const [w1, , w3] = last3;

    // Check progression delta between session 1 and session 3 of this window
    const delta1RM = (w3.est1RM - w1.est1RM) / (w1.est1RM || 1);

    // Stalled if net change is <= 1.5% across 3 successive workouts
    if (delta1RM <= 0.015) {
      const exerciseMeta = EXERCISE_LIBRARY.find((e) => e.id.toLowerCase() === exerciseId.toLowerCase());
      const name = exerciseMeta?.name || w3.exerciseName;

      // Generate sticking point diagnosis based on exercise characteristics
      let stickingPoint = 'Neuromuscular sticking point at mid-range transition';
      const nameLower = name.toLowerCase();

      if (nameLower.includes('bench') || nameLower.includes('press')) {
        stickingPoint = 'Sticking point 2-4 inches off the chest / mid-concentric transition';
      } else if (nameLower.includes('squat')) {
        stickingPoint = 'Torque bottleneck out of the hole (approx 90° knee angle)';
      } else if (nameLower.includes('deadlift')) {
        stickingPoint = 'Knee-height transition bottleneck and posterior chain fatigue';
      } else if (nameLower.includes('curl') || nameLower.includes('tricep')) {
        stickingPoint = 'Localized motor unit exhaustion and stabilizing tendon fatigue';
      }

      // Prescriptions
      const prescriptions: PlateauDiagnosis['prescriptions'] = [
        {
          title: 'Fractional Micro-Loading',
          detail: `Standard plate jumps (+2.5kg or +5kg) exceed your current strength gradient. Use fractional plates (+0.5kg or +1.25kg / +1 to 2.5lbs) to maintain consistent progressive overload.`,
          strategy: 'microload',
          recommendedValue: '+1.0kg'
        },
        {
          title: 'Rep-Range Periodization Shift',
          detail: `Your nervous system has adapted to your current rep bracket (${w3.reps} reps). Temporarily shift to a higher rep bracket (${Math.min(14, w3.reps + 4)} reps) for 2-3 weeks to stimulate sarcoplasmic hypertrophy and resensitize motor unit recruitment.`,
          strategy: 'rep_shift',
          recommendedValue: `${w3.reps + 3}–${w3.reps + 5} reps`
        },
        {
          title: 'Biomechanical Variation Swap',
          detail: `Swap to a high-transfer variation (e.g. 2-Second Paused rep tempo or Dumbbell equivalent) to overload the sticking point without accumulating repetitive strain.`,
          strategy: 'swap_variation',
          recommendedValue: 'Pause Rep Variation'
        }
      ];

      plateauReports.push({
        exerciseId,
        exerciseName: name,
        stalledSessions: exposures.length >= 4 ? 4 : 3,
        lastTopSet: {
          weightKg: w3.weightKg,
          reps: w3.reps,
          date: w3.date
        },
        stickingPoint,
        prescriptions
      });
    }
  });

  return plateauReports;
}
