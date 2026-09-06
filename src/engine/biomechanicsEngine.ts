// Biomechanics & Kinematic Audit Engine
// Classifies resistance profiles (stretched vs mid vs shortened) and identifies angle redundancies

import type {
  Exercise,
  ResistanceProfile,
  ExerciseBiomechanicProfile,
  KinematicAuditResult,
  RedundancyWarning,
  MuscleGroup
} from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

/**
 * Known exercise profile mapping based on joint angle biomechanics and moment arms
 */
const KNOWN_PROFILES: Record<string, { profile: ResistanceProfile; head?: string; note: string; stretch: boolean }> = {
  // Chest
  'barbell bench press': { profile: 'mid', head: 'Sternal', note: 'Peak torque occurs mid-range (~90° elbow flexion)', stretch: false },
  'dumbbell bench press': { profile: 'mid', head: 'Sternal', note: 'Horizontal mid-range with slight bottom stretch', stretch: false },
  'incline barbell bench press': { profile: 'mid', head: 'Clavicular (Upper)', note: 'Upper chest angle with peak torque at mid-descent', stretch: false },
  'incline dumbbell bench press': { profile: 'stretched', head: 'Clavicular (Upper)', note: 'Deep clavicular stretch in bottom pocket', stretch: true },
  'cable crossover': { profile: 'shortened', head: 'Sternal', note: 'Peak tension in fully adducted/shortened state across midline', stretch: false },
  'cable fly': { profile: 'shortened', head: 'Sternal', note: 'Constant cable tension at full peak contraction', stretch: false },
  'dumbbell fly': { profile: 'stretched', head: 'Sternal', note: 'Extreme tension at elongated bottom stretch', stretch: true },
  'chest dip': { profile: 'stretched', head: 'Costal (Lower)', note: 'High mechanical tension in the deep stretched pocket', stretch: true },

  // Back
  'barbell row': { profile: 'mid', head: 'Upper Back / Lats', note: 'Peak torque occurs at 90° torso pull', stretch: false },
  'lat pulldown': { profile: 'mid', head: 'Latissimus Dorsi', note: 'Vertical pulling plane with mid-range peak force', stretch: false },
  'pull-up': { profile: 'stretched', head: 'Lats & Teres', note: 'Heavy stretch at dead-hang initiation', stretch: true },
  'seated cable row': { profile: 'shortened', head: 'Rhomboids & Mid-Traps', note: 'Max resistance when scapulae fully retracted', stretch: false },
  'single-arm dumbbell row': { profile: 'mid', head: 'Iliac Lat', note: 'Natural humeral path with steady mid-range resistance', stretch: false },
  'straight-arm cable pulldown': { profile: 'shortened', head: 'Lats', note: 'Peak tension when humerus is extended past midline', stretch: false },

  // Shoulders
  'overhead press': { profile: 'mid', head: 'Anterior Delt', note: 'Peak resistance at eye level', stretch: false },
  'dumbbell lateral raise': { profile: 'shortened', head: 'Lateral Delt', note: 'Gravity maximizes moment arm when arms are parallel to floor', stretch: false },
  'cable lateral raise': { profile: 'stretched', head: 'Lateral Delt', note: 'Cross-body cable setup applies heavy tension in the stretch', stretch: true },
  'face pull': { profile: 'shortened', head: 'Posterior Delt & External Rotators', note: 'Peak tension in full external rotation', stretch: false },
  'rear delt fly': { profile: 'shortened', head: 'Posterior Delt', note: 'Contraction emphasized when arms parallel to back', stretch: false },

  // Arms - Biceps
  'barbell curl': { profile: 'mid', head: 'Short & Long Head', note: 'Torque peaks at 90° forearm flexion', stretch: false },
  'incline dumbbell curl': { profile: 'stretched', head: 'Long Head', note: 'Humerus extended behind torso creates intense passive stretch', stretch: true },
  'preacher curl': { profile: 'stretched', head: 'Short Head', note: 'Pad creates immediate peak tension in bottom third', stretch: true },
  'spider curl': { profile: 'shortened', head: 'Short Head', note: 'Torso angled forward loads full peak contraction at top', stretch: false },
  'hammer curl': { profile: 'mid', head: 'Brachialis & Brachioradialis', note: 'Neutral grip loads mid-range elbow flexion', stretch: false },

  // Arms - Triceps
  'triceps rope pushdown': { profile: 'shortened', head: 'Lateral & Medial Head', note: 'Spreading rope at lockout creates maximal peak contraction', stretch: false },
  'overhead cable triceps extension': { profile: 'stretched', head: 'Long Head', note: 'Elevated humerus pulls long head into active stretch', stretch: true },
  'skull crusher': { profile: 'stretched', head: 'Long & Medial Head', note: 'Tension peaks as elbows bend behind head', stretch: true },
  'close-grip bench press': { profile: 'mid', head: 'Lateral & Medial Head', note: 'Compound mid-range triceps extension', stretch: false },

  // Legs - Quads
  'barbell squat': { profile: 'mid', head: 'Vasti', note: 'Moment arm peaks at parallel thigh position', stretch: false },
  'front squat': { profile: 'mid', head: 'Vasti & Core', note: 'Upright torso emphasizes mid-range knee extension', stretch: false },
  'leg extension': { profile: 'shortened', head: 'Rectus Femoris', note: 'Peak torque at full knee lockout/shortening', stretch: false },
  'sissy squat': { profile: 'stretched', head: 'Rectus Femoris', note: 'Extreme hip extension & knee flexion stretches rectus femoris', stretch: true },
  'bulgarian split squat': { profile: 'stretched', head: 'Quads & Glutes', note: 'Deep pelvic drop loads front quad and glute in stretch', stretch: true },

  // Legs - Hamstrings & Glutes
  'romanian deadlift': { profile: 'stretched', head: 'Hamstrings', note: 'Deep hip hinge stretches hamstrings near maximal muscle length', stretch: true },
  'seated leg curl': { profile: 'stretched', head: 'Hamstrings', note: 'Flexed hip position puts hamstrings on stretch while curling', stretch: true },
  'lying leg curl': { profile: 'shortened', head: 'Hamstrings', note: 'Hip extension reduces initial stretch, favoring mid-to-short contraction', stretch: false },
  'hip thrust': { profile: 'shortened', head: 'Gluteus Maximus', note: 'Horizontal barbell line peaks tension at full hip lockout', stretch: false },
  'cable pull-through': { profile: 'stretched', head: 'Glutes & Hamstrings', note: 'Cable pulls lifter deep into hip flexion stretch', stretch: true }
};

/**
 * Resolves resistance profile and anatomical cues for any exercise
 */
export function getExerciseBiomechanicProfile(exercise: Exercise): ExerciseBiomechanicProfile {
  const key = exercise.name.toLowerCase().trim();
  const known = KNOWN_PROFILES[key];

  if (known) {
    return {
      exerciseId: exercise.id,
      resistanceProfile: known.profile,
      primaryHead: known.head,
      lengthTensionNote: known.note,
      stretchEmphasized: known.stretch
    };
  }

  // Heuristic based on equipment and movement keywords
  const name = exercise.name.toLowerCase();
  let profile: ResistanceProfile = 'mid';
  let stretch = false;
  let note = 'Standard hypertrophy compound mid-range curve';

  if (name.includes('incline') || name.includes('overhead') || name.includes('romanian') || name.includes('stretch') || name.includes('preacher') || name.includes('dip') || name.includes('lunge')) {
    profile = 'stretched';
    stretch = true;
    note = 'Emphasizes mechanical tension in elongated muscle position (stretch-mediated hypertrophy)';
  } else if (name.includes('cable') || name.includes('thrust') || name.includes('spider') || name.includes('curl machine') || name.includes('raise') || name.includes('fly') || name.includes('kickback')) {
    profile = 'shortened';
    note = 'Emphasizes peak contraction and continuous cable/machine resistance';
  }

  return {
    exerciseId: exercise.id,
    resistanceProfile: profile,
    lengthTensionNote: note,
    stretchEmphasized: stretch
  };
}

/**
 * Audits a routine to evaluate length-tension curve balance and flag joint-angle redundancies
 */
export function auditRoutineKinematics(exerciseIds: string[]): KinematicAuditResult {
  const exercises: Exercise[] = exerciseIds
    .map((id) => EXERCISE_LIBRARY.find((e) => e.id.toLowerCase() === id.toLowerCase()))
    .filter((e): e is Exercise => !!e);

  const distribution: Record<ResistanceProfile, number> = {
    stretched: 0,
    mid: 0,
    shortened: 0
  };

  const muscleProfiles: Record<string, { exercise: Exercise; profile: ResistanceProfile }[]> = {};

  exercises.forEach((ex) => {
    const bio = getExerciseBiomechanicProfile(ex);
    distribution[bio.resistanceProfile] += 1;

    const muscle = ex.muscleGroup;
    if (!muscleProfiles[muscle]) {
      muscleProfiles[muscle] = [];
    }
    muscleProfiles[muscle].push({ exercise: ex, profile: bio.resistanceProfile });
  });

  const redundancies: RedundancyWarning[] = [];
  const recommendations: string[] = [];

  // Inspect each muscle group for redundant identical profiles (e.g. 3 mid-range chest movements)
  Object.entries(muscleProfiles).forEach(([muscleStr, list]) => {
    const muscle = muscleStr as MuscleGroup;
    const profileCounts: Record<ResistanceProfile, Exercise[]> = {
      stretched: [],
      mid: [],
      shortened: []
    };

    list.forEach((item) => {
      profileCounts[item.profile].push(item.exercise);
    });

    // Check for redundancy: 2 or more exercises sharing same profile in same muscle
    if (profileCounts.mid.length >= 2 && list.length >= 3) {
      // Find candidate alternatives in other profiles
      const altStretched = EXERCISE_LIBRARY.find(
        (e) => e.muscleGroup === muscle && getExerciseBiomechanicProfile(e).resistanceProfile === 'stretched' && !exerciseIds.includes(e.id)
      );
      const altShortened = EXERCISE_LIBRARY.find(
        (e) => e.muscleGroup === muscle && getExerciseBiomechanicProfile(e).resistanceProfile === 'shortened' && !exerciseIds.includes(e.id)
      );

      const alts = [];
      if (altStretched) {
        alts.push({
          exerciseId: altStretched.id,
          name: altStretched.name,
          profile: 'stretched' as ResistanceProfile,
          reason: 'Adds stretch-mediated tension in deep pocket'
        });
      }
      if (altShortened) {
        alts.push({
          exerciseId: altShortened.id,
          name: altShortened.name,
          profile: 'shortened' as ResistanceProfile,
          reason: 'Maximizes peak contraction at shortened range'
        });
      }

      redundancies.push({
        muscle,
        profile: 'mid',
        exerciseNames: profileCounts.mid.map((e) => e.name),
        severity: 'warning',
        message: `${muscle} has ${profileCounts.mid.length} exercises all loading the horizontal mid-range. This creates duplicate fatigue with diminishing muscle fiber stimulus.`,
        suggestedAlternatives: alts
      });
    }

    // Check if muscle is missing stretched bias entirely
    if (list.length >= 2 && profileCounts.stretched.length === 0) {
      recommendations.push(
        `Consider adding a stretched-bias movement for ${muscle} (e.g. Incline DB or Cable setup) to trigger stretch-mediated hypertrophy.`
      );
    }
  });

  // Calculate Length-Tension Balance Score (0-100)
  const total = exercises.length || 1;

  // Ideal hypertrophy split: ~30-40% stretched, ~30-40% mid, ~20-30% shortened
  let balanceScore = 100;
  if (distribution.stretched === 0 && total >= 3) balanceScore -= 20;
  if (distribution.shortened === 0 && total >= 3) balanceScore -= 15;
  if (redundancies.length > 0) balanceScore -= redundancies.length * 15;
  balanceScore = Math.max(40, Math.min(100, balanceScore));

  if (distribution.stretched > 0 && distribution.mid > 0 && distribution.shortened > 0) {
    recommendations.unshift('Excellent length-tension variety: training through stretched, mid, and shortened muscle lengths.');
  }

  return {
    totalExercises: exercises.length,
    profileDistribution: distribution,
    balanceScore,
    redundancies,
    recommendations
  };
}
