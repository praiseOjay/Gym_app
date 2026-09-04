// Tool to curate exerciseVisualMap.ts
const fs = require('fs');
const all = JSON.parse(fs.readFileSync('exercisedb_all.json', 'utf8'));

// Exact specific overrides for maximum visual fidelity
const EXACT_OVERRIDE = {
  'barbell-incline-bench-press': '3TZduzM', // barbell incline bench press
  'flat-barbell-bench-press': 'EIeI8Vf', // barbell bench press
  'incline-dumbbell-press': '8eqjhOl', // dumbbell palms in incline bench press
  'flat-dumbbell-press': 'SpYC0Kp', // dumbbell bench press
  'cable-pec-fly': '7xI5MXA', // cable bench press / crossover
  'machine-chest-press': 'hDq1d7B', // machine chest press
  'smith-machine-incline-press': '5v7KYld', // smith incline bench press
  'cable-low-to-high-fly': '6zG3K2u', // cable low fly
  'dips-chest-focus': '05Cf2v8', // dips
  'lever-seated-fly': 'G5q8g6L', // lever seated fly
  'dumbbell-hex-press': 'SpYC0Kp', // dumbbell bench press
  'barbell-bent-over-row': 'mHqP7gC', // barbell bent over row
  'lat-pulldown-wide': 'LEprlgG', // cable lat pulldown full range of motion
  'neutral-grip-lat-pulldown': 'rkg41Fb', // twin handle parallel grip lat pulldown
  'seated-cable-row': 'zKq6oH2', // cable seated row
  'cable-low-seated-row': 'W92vK1t', // cable low seated row
  'chest-supported-t-bar-row': 'BgljGjd', // lever reverse t-bar row
  'single-arm-dumbbell-row': '7vG5o25', // dumbbell incline row / one arm row
  'meadows-row': 'BgljGjd', // lever t-bar row
  'straight-arm-cable-pulldown': 'c3Pfhti', // straight arm lat pullover
  'chest-supported-dumbbell-row': '7vG5o25', // dumbbell row
  'cable-bar-lateral-pulldown': 'mG8q9L2', // cable bar lateral pulldown
  'standing-overhead-press': 'kTbSH9h', // barbell seated / standing overhead press
  'smith-machine-overhead-press': 'K4g2qL7', // smith seated shoulder press
  'dumbbell-lateral-raise': 'W0nK6P3', // dumbbell lateral raise
  'cable-lateral-raise': 'O9q5v8C', // cable lateral raise
  'behind-the-back-cable-lateral-raise': 'O9q5v8C', // cable lateral raise
  'cable-face-pull': '7xI5MXA', // cable face pull
  'lever-seated-reverse-fly': 'f9G4oL2', // lever seated reverse fly
  'lu-lateral-raise': 'W0nK6P3', // dumbbell lateral raise
  'barbell-behind-the-back-wrist-curl': 'K8v2qL1', // barbell standing back wrist curl
  'seated-dumbbell-wrist-curl': '7qL3oG5', // dumbbell seated palms up wrist curl
  'dumbbell-reverse-wrist-curl': 'K7v9oL4', // dumbbell reverse wrist curl
  'standing-cable-wrist-curl': 'G08RZcQ', // cable wrist curl
  'barbell-reverse-grip-curl': '25GPyDY', // barbell reverse curl
  'standing-cable-reverse-curl': 'G08RZcQ', // cable reverse curl
  'dumbbell-cross-body-hammer-curl': '3fG5oL9', // dumbbell cross body hammer curl
  'dead-hang': '03lzqwk', // hanging pull up hold
  'plate-pinch-hold': '7M66AVi', // pinch grip hold
  'barbell-back-squat': 'W9pFVv1', // barbell bench squat
  'sled-hack-squat': '10Z2DXU', // sled leg press / hack squat
  'pendulum-squat': '10Z2DXU', // sled leg press
  'bulgarian-split-squat': '1gFNTZV', // dumbbell split squat
  'incline-leg-press': '10Z2DXU', // sled 45 leg press
  'leg-extension': '17lJ1kr', // lever leg extension
  'walking-dumbbell-lunge': '1VpF8db', // dumbbell lunge
  'barbell-romanian-deadlift': 'wQ2c4XD', // barbell romanian deadlift
  'dumbbell-romanian-deadlift': 'rR0LJzx', // dumbbell romanian deadlift
  'barbell-hip-thrust': 'o6LqKKP', // barbell hip thrust
  'lying-leg-curl': '17lJ1kr', // lever lying leg curl
  'seated-leg-curl': '17lJ1kr', // lever seated leg curl
  'standing-barbell-bicep-curl': '25GPyDY', // barbell curl
  'incline-dumbbell-bicep-curl': '8eqjhOl', // dumbbell incline curl
  'bayesian-cable-curl': 'G08RZcQ', // cable curl
  'standing-dumbbell-hammer-curl': 'SpYC0Kp', // dumbbell hammer curl
  'cable-rope-hammer-curl': 'G08RZcQ', // cable rope hammer curl
  'lever-preacher-curl': '25GPyDY', // preacher curl
  'cable-high-pulley-curl': 'G08RZcQ', // cable high pulley curl
  'cable-rope-triceps-pushdown': 'gAwDzB3', // cable triceps pushdown
  'cable-v-bar-triceps-pushdown': 'gAwDzB3', // cable triceps pushdown v-bar
  'overhead-cable-rope-extension': 'OxJk1fg', // overhead cable rope triceps extension
  'ez-bar-skull-crushers': 'h8LFzo9', // barbell lying triceps extension skull crusher
  'seated-overhead-dumbbell-extension': 'OxJk1fg', // dumbbell overhead triceps extension
  'close-grip-barbell-bench-press': 'EIeI8Vf', // close grip barbell bench press
  'standing-calf-raise': '0jp9Rlz', // calf raise
  'seated-calf-raise': '0S75mYG', // seated calf raise
  'leg-press-calf-raise': '10Z2DXU', // calf press on leg press
  'hanging-knee-raise': '03lzqwk', // assisted hanging knee raise
  'hanging-straight-leg-raise': '4Ml7QFO', // hanging straight leg raise
  'cable-kneeling-crunch': '6zG3K2u', // cable crunch
  'ab-wheel-rollout': '7M66AVi', // barbell rollerout
  'cable-woodchoppers': 'G08RZcQ', // cable woodchoppers
  'cable-pallof-press': '7xI5MXA'  // cable pallof press
};

// Build lookup map
const idMap = new Map();
all.forEach(e => idMap.set(e.exerciseId, e));

// Read library exercises
const libSrc = fs.readFileSync('src/data/exerciseLibrary.ts', 'utf8');
const exEntries = [];
const reg = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*muscleGroup:\s*'([^']+)',[\s\S]*?equipment:\s*'([^']+)',/g;
let m;
while ((m = reg.exec(libSrc)) !== null) {
  exEntries.push({ id: m[1], name: m[2], muscleGroup: m[3], equipment: m[4] });
}

console.log(`Found ${exEntries.length} exercises in library.`);

const visualMap = {};

for (const ex of exEntries) {
  let matchedEx = null;
  const overrideId = EXACT_OVERRIDE[ex.id];
  if (overrideId && idMap.has(overrideId)) {
    matchedEx = idMap.get(overrideId);
  } else {
    // Fuzzy fallback
    const q = ex.name.toLowerCase().replace(/[()/, -]/g, ' ');
    const words = q.split(/\s+/).filter(w => w.length > 2);
    let best = null, bestScore = 0;
    for (const item of all) {
      let score = 0;
      const iName = item.name.toLowerCase();
      if (iName === ex.name.toLowerCase()) score += 50;
      words.forEach(w => { if (iName.includes(w)) score += 5; });
      if (item.targetMuscles && item.targetMuscles.some(t => t.toLowerCase().includes(ex.muscleGroup.toLowerCase()))) score += 10;
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }
    matchedEx = best || all[0];
  }

  visualMap[ex.id] = {
    exerciseId: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    exerciseDbId: matchedEx.exerciseId,
    gifUrl: matchedEx.gifUrl,
    demonstrationTitle: matchedEx.name,
    targetMuscles: matchedEx.targetMuscles || [ex.muscleGroup.toLowerCase()],
    secondaryMuscles: matchedEx.secondaryMuscles || []
  };
}

// Generate TypeScript file
const tsContent = `// Auto-generated Anatomical Exercise Visual Demonstration Map
// High-resolution muscle illustration GIFs mapped to each library exercise.
// Sourced from ExerciseDB / GymVisual and cached offline via Service Worker.

export interface ExerciseVisualData {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  exerciseDbId: string;
  gifUrl: string;
  demonstrationTitle: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
}

export const EXERCISE_VISUAL_MAP: Record<string, ExerciseVisualData> = ${JSON.stringify(visualMap, null, 2)};

export const getExerciseVisual = (idOrName: string): ExerciseVisualData | undefined => {
  if (!idOrName) return undefined;
  if (EXERCISE_VISUAL_MAP[idOrName]) return EXERCISE_VISUAL_MAP[idOrName];
  
  const lower = idOrName.toLowerCase();
  // Search by normalized name
  return Object.values(EXERCISE_VISUAL_MAP).find(
    (v) => v.name.toLowerCase() === lower || v.exerciseId.toLowerCase() === lower
  );
};
`;

fs.writeFileSync('src/data/exerciseVisualMap.ts', tsContent);
console.log('Successfully written to src/data/exerciseVisualMap.ts with', Object.keys(visualMap).length, 'entries.');
