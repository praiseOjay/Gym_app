import type { Exercise } from '../types/gym';

export const EXERCISE_LIBRARY: Exercise[] = [
  // ==========================================
  // CHEST
  // ==========================================
  {
    id: 'barbell-incline-bench-press',
    name: 'Incline Barbell Bench Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [6, 10],
    targetRpe: 8,
    instructions: 'Set bench to 30-degree incline. Grip slightly wider than shoulder width. Lower bar to upper chest, press up explosively with control.',
    tips: ['Keep scapula retracted and depressed', 'Do not bounce off chest', 'Tuck elbows at roughly 45-60 degrees']
  },
  {
    id: 'flat-barbell-bench-press',
    name: 'Flat Barbell Bench Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [6, 10],
    targetRpe: 8,
    instructions: 'Lie flat, plant feet firmly. Grip bar outside shoulder width. Lower to lower/mid sternum, press upward locking out soft.',
    tips: ['Maintain natural lower back arch', 'Drive with your feet through the floor', 'Controlled 2-3 second eccentric']
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8,
    instructions: '30-45 degree bench. Kick dumbbells up to starting position. Lower with elbows flared 45 degrees until deep stretch, press and squeeze pecs at top.',
    tips: ['Converge slightly at top without clanking dumbbells', 'Focus on deep pec stretch at bottom']
  },
  {
    id: 'flat-dumbbell-press',
    name: 'Flat Dumbbell Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8,
    instructions: 'Lie on flat bench. Press dumbbells straight up over mid chest, lower smoothly feeling chest stretch.',
    tips: ['Greater range of motion than barbell', 'Keep wrists stacked above elbows']
  },
  {
    id: 'cable-pec-fly',
    name: 'Cable Chest Fly / Crossover',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders'],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Set pulleys at chest height. Take step forward in staggered stance. Bring hands together in hugging motion, squeeze inner pecs for 1 second.',
    tips: ['Keep slight bend in elbows', 'Avoid turning it into a press; lead with elbows']
  },
  {
    id: 'machine-chest-press',
    name: 'Converging Machine Chest Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'],
    equipment: 'Machine',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Adjust seat so handles align with mid-chest. Press forward until arms are extended, lower slowly under continuous tension.',
    tips: ['Excellent for hypertrophy without balance fatigue', 'Take last set close to true failure']
  },
  {
    id: 'smith-machine-incline-press',
    name: 'Smith Machine Incline Bench Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: 'Smith Machine',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Position incline bench inside Smith track. Lower bar slowly to clavicle, press with maximum pec tension.',
    tips: ['Guided track allows 100% focus on clavicular pec fibers without stability losses']
  },
  {
    id: 'cable-low-to-high-fly',
    name: 'Cable Low-to-High Fly',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders'],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Set pulleys to lowest position. Scoop hands upward and inward toward face level, heavily contracting upper clavicular chest.',
    tips: ['Keep palms facing up and inward', 'Hold peak contraction for 1 second']
  },
  {
    id: 'dips-chest-focus',
    name: 'Parallel Bar Dips (Chest Focus)',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Shoulders'],
    equipment: 'Bodyweight',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Lean torso forward roughly 30 degrees, flare elbows slightly outward. Lower until shoulders are below elbows, press back up.',
    tips: ['Keep chin tucked', 'Avoid dipping too low if shoulder discomfort occurs']
  },
  {
    id: 'lever-seated-fly',
    name: 'Lever Seated Pec Fly (Pec Deck)',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Shoulders'],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Sit with back flat against pad. Bring arm pads together in front of sternum, squeeze inner pecs.',
    tips: ['Control the deep stretch return for 2 seconds']
  },
  {
    id: 'dumbbell-hex-press',
    name: 'Dumbbell Hex Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [10, 14],
    targetRpe: 8.5,
    instructions: 'Press dumbbells together firmly over chest. Lower dumbbells down together and press back up while maintaining inward pressure.',
    tips: ['Constant squeeze against the dumbbells lights up inner sternal fibers']
  },

  // ==========================================
  // BACK
  // ==========================================
  {
    id: 'barbell-bent-over-row',
    name: 'Barbell Bent-Over Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [6, 10],
    targetRpe: 8,
    instructions: 'Hinge at hips to 45 degrees with flat back. Pull bar into lower ribcage/umbilicus, driving elbows back and squeezing lats.',
    tips: ['Do not jerk with lower back', 'Keep neck neutral in line with spine']
  },
  {
    id: 'lat-pulldown-wide',
    name: 'Wide-Grip Lat Pulldown',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Cable',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Grip bar wider than shoulders. Lean back slightly, drive elbows straight down into hips pulling bar to upper chest.',
    tips: ['Lead with elbows, avoid leaning back excessively', 'Pause for a microsecond at bottom contraction']
  },
  {
    id: 'neutral-grip-lat-pulldown',
    name: 'Neutral-Grip Lat Pulldown (Close Grip)',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Cable',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Attach V-bar or neutral handle. Pull down to mid chest with elbows tucked close to torso.',
    tips: ['Maximum shoulder extension and lat stretch at top']
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Cable',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Sit with knees slightly bent. Pull handle toward abdomen while driving shoulders down and retracting scapulae.',
    tips: ['Maintain upright chest; avoid excessive torso rocking']
  },
  {
    id: 'cable-low-seated-row',
    name: 'Cable Low Seated Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps'],
    equipment: 'Cable',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Sit upright, pull handle towards lower abdomen while driving elbows back and puffing chest.',
    tips: ['Squeeze scapulae together at full contraction']
  },
  {
    id: 'chest-supported-t-bar-row',
    name: 'Chest-Supported T-Bar Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Machine',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Rest chest firmly against angled pad. Pull handles back until elbows pass torso, retracting shoulder blades.',
    tips: ['Completely removes lower back fatigue so you can push upper back to failure']
  },
  {
    id: 'single-arm-dumbbell-row',
    name: 'Single-Arm Dumbbell Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Support knee and hand on flat bench. Pull dumbbell up towards hip pocket, feeling lat contraction.',
    tips: ['Pull in an arcing path toward hip rather than straight up']
  },
  {
    id: 'meadows-row',
    name: 'Meadows Row (Landmine / Barbell)',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Stand perpendicular to landmine bar. Grip the sleeve with overhand grip and pull elbow up high toward ceiling.',
    tips: ['John Meadows signature movement for incredible upper lat and teres development']
  },
  {
    id: 'straight-arm-cable-pulldown',
    name: 'Straight-Arm Cable Lat Pullover',
    muscleGroup: 'Back',
    secondaryMuscles: ['Triceps'],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Hinge hips slightly. With nearly straight arms, sweep the bar or rope down toward thighs in wide arc.',
    tips: ['Pure lat isolation with zero bicep involvement']
  },
  {
    id: 'chest-supported-dumbbell-row',
    name: 'Chest-Supported Dumbbell Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [10, 14],
    targetRpe: 8.5,
    instructions: 'Lie face down on 30-degree incline bench. Row dumbbells upward driving elbows towards ceiling, squeezing mid-back.',
    tips: ['Completely eliminates momentum', 'Hold peak contraction for 1 second']
  },
  {
    id: 'cable-bar-lateral-pulldown',
    name: 'Cable Bar Lateral Pulldown',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps'],
    equipment: 'Cable',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Grip bar wide or neutral. Pull bar down towards upper chest, driving elbows down and back.',
    tips: ['Think about pulling with your elbows, not your hands']
  },

  // ==========================================
  // SHOULDERS & REAR DELTS
  // ==========================================
  {
    id: 'standing-overhead-press',
    name: 'Standing Overhead Barbell Press (OHP)',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [6, 10],
    targetRpe: 8,
    instructions: 'Stand tall with core braced and glutes locked. Press barbell vertically from collarbone to overhead lockout.',
    tips: ['Move head back slightly to clear path for bar', 'Lockout directly over midfoot']
  },
  {
    id: 'smith-machine-overhead-press',
    name: 'Smith Machine Seated Shoulder Press',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps'],
    equipment: 'Smith Machine',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Sit on upright bench under Smith bar. Press overhead with controlled eccentric down to chin height.',
    tips: ['High stability allows pushing anterior delts to true mechanical failure']
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    muscleGroup: 'Shoulders',
    secondaryMuscles: [],
    equipment: 'Dumbbell',
    category: 'Isolation',
    targetRepRange: [12, 16],
    targetRpe: 9,
    instructions: 'Stand with slight torso lean. Raise dumbbells out to sides until parallel to floor, leading with elbows.',
    tips: ['Pour water slightly at top (internal rotation)', 'Do not swing or shrug with traps']
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    muscleGroup: 'Shoulders',
    secondaryMuscles: [],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [12, 16],
    targetRpe: 9,
    instructions: 'Set pulley to ankle or hip height. Raise arm out to side across body until parallel to ground.',
    tips: ['Provides constant tension even at the bottom stretch', 'Keep wrist straight']
  },
  {
    id: 'behind-back-cable-lateral-raise',
    name: 'Behind-the-Back Cable Lateral Raise',
    muscleGroup: 'Shoulders',
    secondaryMuscles: [],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [12, 18],
    targetRpe: 9,
    instructions: 'Set cable low, stand in front of cable with cable running behind back. Raise arm out to shoulder level.',
    tips: ['Phenomenal deep stretch on the side delt']
  },
  {
    id: 'face-pull',
    name: 'Cable Face Pull with External Rotation',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Rear Delts', 'Traps'],
    equipment: 'Cable',
    category: 'Compound',
    targetRepRange: [12, 18],
    targetRpe: 8.5,
    instructions: 'High pulley with rope. Pull towards eye level, separating rope ends and rotating hands backward.',
    tips: ['Essential for rotator cuff health and rear delt fullness', 'Squeeze upper back']
  },
  {
    id: 'lever-seated-reverse-fly',
    name: 'Lever Seated Reverse Fly (Rear Delt Machine)',
    muscleGroup: 'Rear Delts',
    secondaryMuscles: ['Back'],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Sit chest against pad. Grip vertical handles and fly arms horizontally outwards in a wide arc.',
    tips: ['Isolates posterior deltoid with zero momentum']
  },
  {
    id: 'lu-raises',
    name: 'Lu Lateral Raises (Full ROM)',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Traps'],
    equipment: 'Dumbbell',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 8.5,
    instructions: 'Raise dumbbells past horizontal all the way overhead until dumbbells lightly meet at top, lower slowly.',
    tips: ['Strengthens entire deltoid and serratus anterior through full natural scapular rhythm']
  },

  // ==========================================
  // FOREARMS & GRIP (NEW DEDICATED SECTION)
  // ==========================================
  {
    id: 'barbell-behind-back-wrist-curl',
    name: 'Barbell Behind-the-Back Wrist Curl',
    muscleGroup: 'Forearms',
    secondaryMuscles: [],
    equipment: 'Barbell',
    category: 'Isolation',
    targetRepRange: [12, 20],
    targetRpe: 8.5,
    instructions: 'Stand holding barbell behind thighs with pronated grip. Allow bar to roll to fingertips, then curl wrists upward hard.',
    tips: ['Great mass builder for forearm flexors without wrist hyperextension pain', 'Keep arms stationary']
  },
  {
    id: 'seated-dumbbell-wrist-curl',
    name: 'Seated Dumbbell Wrist Curl',
    muscleGroup: 'Forearms',
    secondaryMuscles: [],
    equipment: 'Dumbbell',
    category: 'Isolation',
    targetRepRange: [12, 18],
    targetRpe: 9,
    instructions: 'Rest forearms on flat bench or thighs with wrists hanging off edge, palms up. Lower dumbbell and curl wrist upward.',
    tips: ['Open fingers slightly at bottom for maximal flexor stretch, then squeeze at peak']
  },
  {
    id: 'dumbbell-reverse-wrist-curl',
    name: 'Dumbbell Reverse Wrist Curl',
    muscleGroup: 'Forearms',
    secondaryMuscles: [],
    equipment: 'Dumbbell',
    category: 'Isolation',
    targetRepRange: [12, 18],
    targetRpe: 8.5,
    instructions: 'Forearms resting on bench, palms facing down. Curl wrists upward holding dumbbells.',
    tips: ['High repetition burn for forearm extensor development and forearm ridge thickness']
  },
  {
    id: 'standing-cable-wrist-curl',
    name: 'Standing Cable Wrist Curl',
    muscleGroup: 'Forearms',
    secondaryMuscles: [],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [12, 18],
    targetRpe: 8.5,
    instructions: 'Attach straight bar to low pulley. Face away or towards stack and curl wrists upward under constant cable tension.',
    tips: ['Constant mechanical resistance through the entire range of motion']
  },
  {
    id: 'barbell-reverse-grip-curl',
    name: 'Barbell Reverse Grip Curl',
    muscleGroup: 'Forearms',
    secondaryMuscles: ['Biceps'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8,
    instructions: 'Grip straight or EZ-bar with palms facing down (overhand). Curl upward to shoulder level with locked elbows.',
    tips: ['Heavily trains brachioradialis and upper forearm ridge', 'Keep wrists straight and rigid']
  },
  {
    id: 'standing-cable-reverse-curl',
    name: 'Standing Cable Reverse Curl',
    muscleGroup: 'Forearms',
    secondaryMuscles: ['Biceps'],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 8.5,
    instructions: 'Attach straight bar to low cable. Grip overhand and curl upward, feeling intense forearm pump.',
    tips: ['Keep elbows tucked against ribcage throughout']
  },
  {
    id: 'dumbbell-cross-body-hammer-curl',
    name: 'Dumbbell Cross-Body Hammer Curl',
    muscleGroup: 'Forearms',
    secondaryMuscles: ['Biceps'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Hold dumbbell with neutral grip. Curl across chest toward opposite clavicle, contracting brachialis and forearm.',
    tips: ['Forces extreme brachialis activation for arm thickness']
  },
  {
    id: 'farmers-walk-carry',
    name: "Farmer's Walk / Loaded Carry",
    muscleGroup: 'Forearms',
    secondaryMuscles: ['Traps', 'Core'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [30, 60],
    targetRpe: 9,
    instructions: 'Pick up heavy pair of dumbbells or kettlebells. Walk with upright posture, chest proud, gripping handles tightly.',
    tips: ['Tests isometric crush grip, forearm stamina, and traps simultaneously']
  },
  {
    id: 'dead-hang-grip',
    name: 'Dead Hang (Grip & Forearm Resilience)',
    muscleGroup: 'Forearms',
    secondaryMuscles: ['Back', 'Shoulders'],
    equipment: 'Bodyweight',
    category: 'Compound',
    targetRepRange: [30, 60],
    targetRpe: 9,
    instructions: 'Grip pullup bar with overhand grip and hang passively with relaxed shoulders and engaged grip for prescribed time.',
    tips: ['Decompresses spine while building massive grip endurance']
  },
  {
    id: 'plate-pinch-hold',
    name: 'Plate Pinch Grip Hold',
    muscleGroup: 'Forearms',
    secondaryMuscles: [],
    equipment: 'Other',
    category: 'Isolation',
    targetRepRange: [20, 45],
    targetRpe: 9,
    instructions: 'Pinch two weight plates smooth-sides out between thumb and fingers. Stand tall and hold for time.',
    tips: ['Builds unmatched thumb adductor pinch grip power']
  },

  // ==========================================
  // QUADS & LOWER BODY
  // ==========================================
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [6, 10],
    targetRpe: 8,
    instructions: 'Bar resting on upper traps. Descend until hip crease is below knee level. Drive out of the hole with chest up.',
    tips: ['Keep knees tracking over toes', 'Breathe deep into belly and brace core']
  },
  {
    id: 'sled-hack-squat',
    name: 'Sled Hack Squat',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes'],
    equipment: 'Machine',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 9,
    instructions: 'Place shoulders under pads, feet mid-platform. Lower smoothly until knees are deeply flexed, drive back up.',
    tips: ['Keep lower back flush against back pad', 'Control the eccentric for 3 seconds for maximum quad stretch']
  },
  {
    id: 'pendulum-squat',
    name: 'Pendulum Squat',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes'],
    equipment: 'Machine',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 9,
    instructions: 'Position shoulders under pads. Squat deep into the arc, feeling intense stretch on the rectus femoris and vastus lateralis.',
    tips: ['The pinnacle quad hypertrophy machine; zero spinal loading']
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat (Dumbbell)',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Rear foot elevated on bench. Lower hips until front thigh is parallel to ground, drive through front heel.',
    tips: ['Stay slightly upright for quad focus or lean forward 20 degrees for glute focus']
  },
  {
    id: 'leg-press-45',
    name: '45-Degree Incline Leg Press',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes'],
    equipment: 'Machine',
    category: 'Compound',
    targetRepRange: [10, 15],
    targetRpe: 8.5,
    instructions: 'Feet shoulder-width on carriage. Lower weight until 90-degree knee bend, press without locking knees.',
    tips: ['Do not allow tailbone to tuck or peel off seat pad', 'Smooth, continuous tension']
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    muscleGroup: 'Quads',
    secondaryMuscles: [],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [12, 18],
    targetRpe: 9,
    instructions: 'Align knee joint with machine pivot axis. Extend legs fully, squeeze quads for 1 second at top, lower slowly.',
    tips: ['Point toes slightly inward or straight', 'Avoid throwing weight up with hips']
  },
  {
    id: 'walking-dumbbell-lunge',
    name: 'Walking Dumbbell Lunge',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [10, 14],
    targetRpe: 8.5,
    instructions: 'Step forward into deep lunge, rear knee kissing floor gently. Drive up through front heel into next step.',
    tips: ['Keep torso upright for quad focus', 'Take controlled, deliberate strides']
  },

  // ==========================================
  // HAMSTRINGS & GLUTES
  // ==========================================
  {
    id: 'romanian-deadlift-barbell',
    name: 'Barbell Romanian Deadlift (RDL)',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Back'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [6, 10],
    targetRpe: 8,
    instructions: 'Slight knee bend. Push hips back as far as possible, sliding bar down shins until deep hamstring stretch. Drive hips forward.',
    tips: ['Hips move backward, not downward', 'Keep bar glued to thighs']
  },
  {
    id: 'dumbbell-romanian-deadlift',
    name: 'Dumbbell Romanian Deadlift (DB RDL)',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Glutes'],
    equipment: 'Dumbbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Hold dumbbells at sides. Push hips backward keeping back rigid until deep stretch in hamstrings.',
    tips: ['Dumbbells allow more natural wrist alignment and greater hip hinge range']
  },
  {
    id: 'barbell-hip-thrust',
    name: 'Barbell Hip Thrust',
    muscleGroup: 'Glutes',
    secondaryMuscles: ['Hamstrings'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Upper back on bench, barbell over hips. Drive through heels until hips are fully extended and locked at top.',
    tips: ['Squeeze glutes hard at top for 1 full second', 'Keep chin tucked to prevent lower back hyperextension']
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Calves'],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [10, 14],
    targetRpe: 9,
    instructions: 'Lie prone with knees just off pad. Curl heels towards glutes smoothly, squeeze at peak, control the descent.',
    tips: ['Keep hips pinned to pad; do not let lower back arch', 'Flex toes toward shins']
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: [],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Thigh pad snug against thighs. Curl roller down and back beneath seat, feeling deep hamstring contraction.',
    tips: ['Seated position places hamstrings at longer muscle length for superior hypertrophy']
  },

  // ==========================================
  // BICEPS
  // ==========================================
  {
    id: 'barbell-bicep-curl',
    name: 'Standing Barbell Bicep Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Barbell',
    category: 'Isolation',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Shoulder-width underhand grip. Pin elbows to sides, curl barbell up to upper chest height.',
    tips: ['Do not swing torso back', 'Lower the bar slowly for 2-3 seconds']
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Bicep Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbell',
    category: 'Isolation',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Sit on 45-60 degree incline. Arms hanging straight down behind torso. Curl dumbbells up with supination.',
    tips: ['Places biceps long head under heavy passive stretch at bottom']
  },
  {
    id: 'bayesian-cable-curl',
    name: 'Bayesian Cable Curl (Behind-the-Back)',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Set cable low. Face away from cable machine, arm extended behind body. Curl forward and upward.',
    tips: ['Maximum long head stretch and tension throughout full range']
  },
  {
    id: 'dumbbell-hammer-curl',
    name: 'Standing Dumbbell Hammer Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbell',
    category: 'Isolation',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Neutral grip (palms facing each other). Curl dumbbells upward keeping thumbs pointed up.',
    tips: ['Heavy focus on brachialis and brachioradialis for arm thickness']
  },
  {
    id: 'cable-rope-hammer-curl',
    name: 'Cable Rope Hammer Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 14],
    targetRpe: 9,
    instructions: 'Low pulley with rope attachment. Curl up with neutral grip, spreading rope handles slightly at top.',
    tips: ['Keep continuous mechanical tension without rest at bottom']
  },
  {
    id: 'lever-preacher-curl',
    name: 'Lever Machine Preacher Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Sit with upper arms flushed on angled pad. Curl lever handle up smoothly, squeeze at peak.',
    tips: ['Great continuous mechanical resistance profile with zero shoulder involvement']
  },
  {
    id: 'cable-overhead-curl',
    name: 'Cable Overhead / High Pulley Bicep Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: [],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Stand between two high cable pulleys. Curl handles towards ears, flexing biceps hard.',
    tips: ['Peak contraction at highest bicep shortened position']
  },

  // ==========================================
  // TRICEPS
  // ==========================================
  {
    id: 'triceps-rope-pushdown',
    name: 'Cable Triceps Rope Pushdown',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 14],
    targetRpe: 9,
    instructions: 'High pulley with rope. Pin elbows to ribs, push rope down and flare ends outward at lockout.',
    tips: ['Keep elbows tucked in stationary position', 'Squeeze outer tricep lateral head']
  },
  {
    id: 'cable-triceps-pushdown-vbar',
    name: 'Cable Triceps Pushdown (V-bar)',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [8, 12],
    targetRpe: 9,
    instructions: 'High pulley with V-bar. Pin elbows tight to sides, push bar downward to complete lockout.',
    tips: ['Allows slightly heavier loads for tricep mechanical tension']
  },
  {
    id: 'overhead-cable-triceps-extension',
    name: 'Overhead Cable Rope Triceps Extension',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 9,
    instructions: 'Set cable to chest height. Lean forward, extend rope overhead and forward until arms are locked out.',
    tips: ['Crucial for the tricep long head which only gets stretched with shoulder in flexion']
  },
  {
    id: 'skull-crushers-ez-bar',
    name: 'EZ-Bar Skull Crushers (Lying Triceps Extension)',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Barbell',
    category: 'Isolation',
    targetRepRange: [8, 12],
    targetRpe: 8.5,
    instructions: 'Lie on flat bench, hold EZ-bar above chest. Lower bar towards forehead or crown of head by bending elbows.',
    tips: ['Keep upper arms angled slightly back toward head to keep constant tension on triceps']
  },
  {
    id: 'overhead-dumbbell-extension',
    name: 'Seated Overhead Dumbbell Triceps Extension',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Dumbbell',
    category: 'Isolation',
    targetRepRange: [10, 14],
    targetRpe: 8.5,
    instructions: 'Sit upright, cup heavy dumbbell overhead with both hands. Lower behind head until elbows bend 90 degrees, press upward.',
    tips: ['Keep elbows pointed up and in, avoid flaring excessively']
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Barbell Bench Press',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Chest', 'Shoulders'],
    equipment: 'Barbell',
    category: 'Compound',
    targetRepRange: [6, 10],
    targetRpe: 8,
    instructions: 'Grip bar shoulder-width apart. Keep elbows tucked tight to sides, lower bar to sternum and press.',
    tips: ['Do not grip too close (wrist strain); shoulder-width is optimal for tricep torque']
  },

  // ==========================================
  // CALVES
  // ==========================================
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Machine Raise',
    muscleGroup: 'Calves',
    secondaryMuscles: [],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [12, 18],
    targetRpe: 9,
    instructions: 'Shoulders under pads, balls of feet on edge. Drop heels for full 2-second stretch, press onto big toes and hold peak.',
    tips: ['Straight knee position targets gastrocnemius head', 'Pause 1 second at bottom to eliminate Achilles elastic rebound']
  },
  {
    id: 'seated-machine-calf-raise',
    name: 'Seated Machine Calf Raise',
    muscleGroup: 'Calves',
    secondaryMuscles: [],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [12, 20],
    targetRpe: 9,
    instructions: 'Sit with knee pads secured. Lower heels deep into stretch, press up onto balls of feet.',
    tips: ['Bent knee removes gastrocnemius and isolates the deep soleus muscle']
  },
  {
    id: 'leg-press-calf-press',
    name: 'Leg Press Machine Calf Press',
    muscleGroup: 'Calves',
    secondaryMuscles: [],
    equipment: 'Machine',
    category: 'Isolation',
    targetRepRange: [12, 18],
    targetRpe: 9,
    instructions: 'Balls of feet on lower lip of footplate. Push sled back with ankle extension, control descent into deep ankle dorsiflexion.',
    tips: ['Do not lock knees; keep slight soft microbend for joint safety']
  },

  // ==========================================
  // ABS & CORE
  // ==========================================
  {
    id: 'hanging-knee-raise',
    name: 'Hanging Knee / Leg Raise',
    muscleGroup: 'Abs',
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    category: 'Isolation',
    targetRepRange: [10, 16],
    targetRpe: 9,
    instructions: 'Hang from pullup bar. Curl pelvis up towards chest, bringing knees into ribcage. Lower under control without swinging.',
    tips: ['Focus on posterior pelvic tilt (curling pelvis), not just lifting thighs with hip flexors']
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Straight Leg Raise',
    muscleGroup: 'Abs',
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    category: 'Isolation',
    targetRepRange: [8, 14],
    targetRpe: 9,
    instructions: 'Hang from bar with straight legs. Raise toes towards bar level, flexing rectus abdominis.',
    tips: ['Do not use swinging momentum; initiate movement strictly from core']
  },
  {
    id: 'cable-kneeling-crunch',
    name: 'Cable Kneeling Rope Crunch',
    muscleGroup: 'Abs',
    secondaryMuscles: [],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [12, 18],
    targetRpe: 9,
    instructions: 'Kneel holding rope at temples. Curl ribcage toward pelvis like rolling up a carpet. Do not sit back on heels.',
    tips: ['Keep hips locked in space; round upper spine to fully contract abs']
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    muscleGroup: 'Abs',
    secondaryMuscles: ['Back', 'Shoulders'],
    equipment: 'Bodyweight',
    category: 'Compound',
    targetRepRange: [8, 14],
    targetRpe: 9,
    instructions: 'Kneel with wheel in front. Roll forward extending arms until body is near floor with braced core. Pull back with abs.',
    tips: ['Keep hips tucked; do not let lower back sag or hyperextend']
  },
  {
    id: 'cable-woodchoppers',
    name: 'High-to-Low Cable Woodchoppers',
    muscleGroup: 'Abs',
    secondaryMuscles: ['Shoulders'],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 8.5,
    instructions: 'High cable position. Pull handle diagonally downward across body toward opposite hip, rotating with core and hips.',
    tips: ['Pivot on rear foot and engage obliques throughout rotational arc']
  },
  {
    id: 'pallof-press',
    name: 'Cable Pallof Press (Anti-Rotation Core)',
    muscleGroup: 'Abs',
    secondaryMuscles: ['Shoulders'],
    equipment: 'Cable',
    category: 'Isolation',
    targetRepRange: [10, 15],
    targetRpe: 8,
    instructions: 'Stand sideways to cable stack at chest height. Press handle directly forward and hold against rotational pull.',
    tips: ['Resist rotation completely; holds for 2 seconds at full arm extension']
  }
];
