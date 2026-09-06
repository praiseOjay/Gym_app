import type {
  MesocycleBlock,
  MesocycleWeekConfig,
  SystemicFatigueReport,
  WorkoutSession
} from '../types/gym';

export interface MesocycleTemplateDefinition {
  name: string;
  focus: 'Hypertrophy' | 'Strength' | 'Peak';
  totalWeeks: number;
  weeks: MesocycleWeekConfig[];
}

export const MESOCYCLE_TEMPLATES: Record<string, MesocycleTemplateDefinition> = {
  HYPERTROPHY_5_WEEK: {
    name: 'Hypertrophy Progression Block',
    focus: 'Hypertrophy',
    totalWeeks: 5,
    weeks: [
      {
        weekNumber: 1,
        phaseName: 'Accumulation',
        targetRir: 3,
        targetRpe: 7.0,
        volumeMultiplier: 1.0,
        description: 'Baseline volume. Establish working weights with 3 reps in reserve.'
      },
      {
        weekNumber: 2,
        phaseName: 'Progression',
        targetRir: 2,
        targetRpe: 8.0,
        volumeMultiplier: 1.0,
        description: 'Progressive overload. Aim for +1-2 reps or +1.25kg to 2.5kg per lift.'
      },
      {
        weekNumber: 3,
        phaseName: 'Overload',
        targetRir: 1,
        targetRpe: 9.0,
        volumeMultiplier: 1.0,
        description: 'Peak mechanical tension. Heavy working sets leaving strictly 1 rep in reserve.'
      },
      {
        weekNumber: 4,
        phaseName: 'Overreach',
        targetRir: 0,
        targetRpe: 9.5,
        volumeMultiplier: 1.0,
        description: 'Maximum stimulus overreach. Take final working sets to technical failure.'
      },
      {
        weekNumber: 5,
        phaseName: 'Deload',
        targetRir: 3,
        targetRpe: 7.0,
        volumeMultiplier: 0.5,
        description: 'Active recovery deload. Reduce sets by 50% to dissipate CNS fatigue.'
      }
    ]
  },
  STRENGTH_4_WEEK: {
    name: 'Neural Strength & Peaking Block',
    focus: 'Strength',
    totalWeeks: 4,
    weeks: [
      {
        weekNumber: 1,
        phaseName: 'Accumulation',
        targetRir: 3,
        targetRpe: 7.0,
        volumeMultiplier: 1.0,
        description: 'Heavy submaximal sets. Dial in bar speed and motor patterns.'
      },
      {
        weekNumber: 2,
        phaseName: 'Progression',
        targetRir: 2,
        targetRpe: 8.0,
        volumeMultiplier: 1.0,
        description: 'Load progression. Add weight to main competition movements.'
      },
      {
        weekNumber: 3,
        phaseName: 'Overreach',
        targetRir: 0,
        targetRpe: 10.0,
        volumeMultiplier: 1.0,
        description: 'Peak exertion & 1RM/3RM realization. Push maximal weights.'
      },
      {
        weekNumber: 4,
        phaseName: 'Deload',
        targetRir: 3,
        targetRpe: 6.5,
        volumeMultiplier: 0.5,
        description: 'Supercompensation deload. Halve volume to realize strength gains.'
      }
    ]
  },
  HYPERTROPHY_6_WEEK: {
    name: 'Extended High-Volume Hypertrophy',
    focus: 'Hypertrophy',
    totalWeeks: 6,
    weeks: [
      {
        weekNumber: 1,
        phaseName: 'Accumulation',
        targetRir: 3,
        targetRpe: 7.0,
        volumeMultiplier: 1.0,
        description: 'Introductory accumulation block. Set baseline technique.'
      },
      {
        weekNumber: 2,
        phaseName: 'Progression',
        targetRir: 2,
        targetRpe: 7.5,
        volumeMultiplier: 1.0,
        description: 'Gradual overload. Increase volume or load moderately.'
      },
      {
        weekNumber: 3,
        phaseName: 'Progression',
        targetRir: 2,
        targetRpe: 8.0,
        volumeMultiplier: 1.0,
        description: 'Solid progression. Maintain 2 RIR with higher load.'
      },
      {
        weekNumber: 4,
        phaseName: 'Overload',
        targetRir: 1,
        targetRpe: 9.0,
        volumeMultiplier: 1.0,
        description: 'High intensity overload. Push close to limit.'
      },
      {
        weekNumber: 5,
        phaseName: 'Overreach',
        targetRir: 0,
        targetRpe: 9.5,
        volumeMultiplier: 1.0,
        description: 'Max stimulus week. Technical failure on prime compounds.'
      },
      {
        weekNumber: 6,
        phaseName: 'Deload',
        targetRir: 3,
        targetRpe: 6.5,
        volumeMultiplier: 0.5,
        description: 'Active recovery deload. 50% set reduction.'
      }
    ]
  }
};

/**
 * Creates an initial default 5-week hypertrophy mesocycle block
 */
export function createDefaultMesocycle(
  focus: 'Hypertrophy' | 'Strength' | 'Peak' = 'Hypertrophy',
  totalWeeks: number = 5
): MesocycleBlock {
  let template = MESOCYCLE_TEMPLATES.HYPERTROPHY_5_WEEK;
  if (focus === 'Strength' || totalWeeks === 4) {
    template = MESOCYCLE_TEMPLATES.STRENGTH_4_WEEK;
  } else if (totalWeeks === 6) {
    template = MESOCYCLE_TEMPLATES.HYPERTROPHY_6_WEEK;
  }

  return {
    id: `meso-${Date.now()}`,
    name: template.name,
    focus: template.focus,
    totalWeeks: template.totalWeeks,
    currentWeek: 1,
    startDate: new Date().toISOString(),
    weeks: [...template.weeks],
    status: 'active'
  };
}

/**
 * Advances to the next week in the mesocycle.
 * If finishing deload, starts a fresh cycle.
 */
export function advanceMesocycleWeek(block: MesocycleBlock): MesocycleBlock {
  if (block.currentWeek < block.totalWeeks) {
    const nextWeek = block.currentWeek + 1;
    const isDeload = block.weeks.find((w) => w.weekNumber === nextWeek)?.phaseName === 'Deload';
    return {
      ...block,
      currentWeek: nextWeek,
      lastDeloadDate: isDeload ? new Date().toISOString() : block.lastDeloadDate,
      status: isDeload ? 'deload_pending' : 'active'
    };
  }

  // Completed the block, restart as Week 1 of a new block
  return {
    ...block,
    id: `meso-${Date.now()}`,
    currentWeek: 1,
    startDate: new Date().toISOString(),
    status: 'active'
  };
}

/**
 * Manually jumps to the deload week
 */
export function triggerManualDeload(block: MesocycleBlock): MesocycleBlock {
  const deloadWeek = block.weeks.find((w) => w.phaseName === 'Deload') || block.weeks[block.weeks.length - 1];
  return {
    ...block,
    currentWeek: deloadWeek.weekNumber,
    lastDeloadDate: new Date().toISOString(),
    status: 'active'
  };
}

/**
 * Systemic Fatigue Detection Engine
 * Analyzes the last 3-5 workouts for performance regression, high failure density,
 * and prolonged training without a deload week.
 */
export function detectSystemicFatigue(workouts: WorkoutSession[]): SystemicFatigueReport {
  if (!workouts || workouts.length < 3) {
    return {
      isDeloadRecommended: false,
      fatigueScore: 15,
      consecutiveDropCount: 0,
      stalledExercises: [],
      reason: 'Optimal neuromuscular readiness. Sufficient data is accumulating.',
      recommendedAction: 'Continue current training progression.'
    };
  }

  // Sort chronological descending (most recent first)
  const recent = [...workouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stalledExercises: string[] = [];
  let totalFailureSets = 0;
  let highRpeSetCount = 0;
  let totalWorkingSets = 0;

  // 1. Check for exercise performance drops (e.g. weight or reps dropping at same weight)
  const exerciseHistory: Record<string, { date: string; bestWeight: number; bestReps: number; vol: number }[]> = {};

  recent.forEach((session) => {
    session.exercises.forEach((ex) => {
      const workingSets = ex.sets.filter((s) => s.completed && s.type !== 'warmup');
      if (workingSets.length === 0) return;

      const maxWeight = Math.max(...workingSets.map((s) => s.weightKg));
      const bestSet = workingSets.find((s) => s.weightKg === maxWeight) || workingSets[0];
      const vol = workingSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);

      totalWorkingSets += workingSets.length;
      workingSets.forEach((s) => {
        if (s.type === 'failure' || (s.rpe && s.rpe >= 10)) totalFailureSets++;
        if (s.rpe && s.rpe >= 9) highRpeSetCount++;
      });

      if (!exerciseHistory[ex.name]) {
        exerciseHistory[ex.name] = [];
      }
      exerciseHistory[ex.name].push({
        date: session.date,
        bestWeight: bestSet.weightKg,
        bestReps: bestSet.reps,
        vol
      });
    });
  });

  // Compare successive sessions for each exercise
  for (const [name, logs] of Object.entries(exerciseHistory)) {
    if (logs.length >= 2) {
      const latest = logs[0];
      const prev = logs[1];
      // If reps decreased at equal/lower weight or volume declined by > 8%
      if (
        (latest.bestWeight <= prev.bestWeight && latest.bestReps < prev.bestReps) ||
        latest.vol < prev.vol * 0.92
      ) {
        if (!stalledExercises.includes(name)) {
          stalledExercises.push(name);
        }
      }
    }
  }

  // 2. Compute systemic fatigue metrics
  const failureRatio = totalWorkingSets > 0 ? totalFailureSets / totalWorkingSets : 0;
  const highRpeRatio = totalWorkingSets > 0 ? highRpeSetCount / totalWorkingSets : 0;

  let fatigueScore = 20;
  if (stalledExercises.length >= 1) fatigueScore += 25 * stalledExercises.length;
  if (failureRatio > 0.35) fatigueScore += 25;
  if (highRpeRatio > 0.5) fatigueScore += 20;
  if (recent.length >= 5) fatigueScore += 10;

  fatigueScore = Math.min(100, Math.max(0, fatigueScore));

  const isDeloadRecommended = fatigueScore >= 65 || stalledExercises.length >= 2;

  let reason = 'Readiness is high. Central nervous system and muscular recovery are in balance.';
  let recommendedAction = 'Maintain current progressive overload trajectory.';

  if (isDeloadRecommended) {
    reason = `Systemic fatigue accumulation detected. Performance regressions observed across ${
      stalledExercises.length > 0 ? stalledExercises.slice(0, 3).join(', ') : 'multiple compound lifts'
    } with high exertion density (${Math.round(failureRatio * 100)}% sets taken near failure).`;
    recommendedAction =
      'Schedule a 1-Week Active Recovery Deload. Reduce working sets by 50% and keep effort at 3 RIR to clear accumulated neuromuscular fatigue.';
  } else if (fatigueScore >= 45) {
    reason = 'Mild residual fatigue present. Progression is sustainable, but monitor sleep and recovery nutrition.';
    recommendedAction = 'Aim for strictly 1-2 RIR on compound lifts without grinding reps.';
  }

  return {
    isDeloadRecommended,
    fatigueScore,
    consecutiveDropCount: stalledExercises.length,
    stalledExercises,
    reason,
    recommendedAction
  };
}
