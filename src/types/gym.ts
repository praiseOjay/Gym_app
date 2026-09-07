export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Biceps'
  | 'Triceps'
  | 'Abs'
  | 'Forearms'
  | 'Traps'
  | 'Rear Delts'
  | 'Upper Chest'
  | 'Core'
  | 'Cardio';

export type EquipmentType =
  | 'Barbell'
  | 'Dumbbell'
  | 'Cable'
  | 'Machine'
  | 'Bodyweight'
  | 'Smith Machine'
  | 'Kettlebell'
  | 'Cardio Machine'
  | 'Other';

export type SetType = 'warmup' | 'working' | 'drop' | 'failure';

export type ExerciseTrackingType =
  | 'weight_reps'     // Standard lifting: Weight + Reps
  | 'distance_time'   // Cardio machine / endurance: Distance (km/mi) + Duration (min:sec)
  | 'time_only'       // Timed holds / intervals: Duration (sec/min)
  | 'reps_only';      // Calisthenics: Reps without weight (e.g. Burpees, Star Jumps)

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  category: 'Compound' | 'Isolation';
  targetRepRange: [number, number];
  targetRpe: number;
  instructions?: string;
  tips?: string[];
  isCustom?: boolean;
  met?: number;
  caloriesPerMinute?: number;
  trackingType?: ExerciseTrackingType;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number;
  reps: number;
  rpe?: number;
  completed: boolean;
  targetWeightKg?: number;
  targetReps?: number;
  previousWeightKg?: number;
  previousReps?: number;
  isPR?: boolean;
  // Cardio and endurance tracking extensions
  durationSeconds?: number;
  targetDurationSeconds?: number;
  previousDurationSeconds?: number;
  distanceKm?: number;
  targetDistanceKm?: number;
  previousDistanceKm?: number;
  incline?: number;
  resistanceLevel?: number;
  speedKmh?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  sets: WorkoutSet[];
  notes?: string;
  restSeconds?: number;
  supersetGroupId?: string;
  supersetOrder?: number;
  trackingType?: ExerciseTrackingType;
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineName: string;
  dayTag?: string;
  date: string; // ISO date string
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolumeKg: number;
  prCount: number;
  caloriesBurned?: number;
  mesocycleWeek?: number;
  isDeload?: boolean;
  notes?: string;
  aiDebrief?: {
    summary: string;
    highlights: string[];
    overloadSuccess: boolean;
    recommendations: string[];
    recoveryAdvice: string;
  };
}

export interface RoutineExerciseTemplate {
  exerciseId: string;
  defaultSets: number;
  targetRepRange: [number, number];
  defaultWeightKg?: number;
  targetRpe: number;
  restSeconds: number;
  trackingType?: ExerciseTrackingType;
  defaultDurationSeconds?: number;
  defaultDistanceKm?: number;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  weekday: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  splitType: 'Upper/Lower' | 'Push/Pull/Legs' | 'Full Body' | 'Custom';
  dayTag: string;
  exercises: RoutineExerciseTemplate[];
}

export interface PRRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  type: '1RM' | 'MaxWeight' | 'MaxVolume' | 'MaxDistance' | 'MaxDuration' | 'FastestPace';
  value: number; // weight in kg, or distance in km, or duration in seconds, or pace in s/km
  reps?: number;
  date: string;
}

export interface MuscleRecoveryState {
  muscle: MuscleGroup;
  fatigueScore: number; // 0 to 100 (100 = completely fatigued/sore, 0 = 100% recovered)
  recoveryPercentage: number; // 0 to 100 (100 = 100% fresh)
  lastTrainedHoursAgo: number;
  status: 'Fresh' | 'Recovering' | 'Fatigued';
}

export interface OverloadRecommendation {
  exerciseId: string;
  currentWeight: number;
  currentReps: number;
  targetWeight: number;
  targetReps: number;
  targetRpe: number;
  strategy: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
  badgeText: string;
  explanation: string;
}

export interface UserSettings {
  unit: 'kg' | 'lbs';
  geminiApiKey: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultRestSeconds: number;
  userName: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryGoal: 'Hypertrophy' | 'Strength' | 'Recomp';
  bodyWeightKg?: number;
  heightCm?: number;
  age?: number;
  targetWeightKg?: number;
  bodyWeightLogs?: BodyWeightEntry[];
  voiceCoachEnabled?: boolean;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weightKg: number;
  note?: string;
}

export interface MuscleVolumeLandmark {
  muscle: MuscleGroup;
  sets: number;
  status: 'Maintenance' | 'Minimum Effective' | 'Optimal Growth' | 'Max Recoverable';
  recommendedRange: [number, number];
  color: string;
}

export interface PlateCalculation {
  targetWeight: number;
  unit: 'kg' | 'lbs';
  barWeight: number;
  weightPerSide: number;
  platesPerSide: {
    weight: number;
    count: number;
    color: string;
  }[];
  isExact: boolean;
  remainder: number;
}

export type MesocyclePhaseName =
  | 'Accumulation'
  | 'Progression'
  | 'Overload'
  | 'Overreach'
  | 'Deload';

export interface MesocycleWeekConfig {
  weekNumber: number;
  phaseName: MesocyclePhaseName;
  targetRir: number; // e.g., 3, 2, 1, 0, or 3 (for deload)
  targetRpe: number; // e.g., 7, 8, 9, 10, or 7
  volumeMultiplier: number; // 1.0 = normal, 0.5 = deload
  description: string;
}

export interface MesocycleBlock {
  id: string;
  name: string;
  focus: 'Hypertrophy' | 'Strength' | 'Peak';
  totalWeeks: number;
  currentWeek: number; // 1-indexed
  startDate: string;
  weeks: MesocycleWeekConfig[];
  status: 'active' | 'completed' | 'deload_pending';
  lastDeloadDate?: string;
}

export interface SystemicFatigueReport {
  isDeloadRecommended: boolean;
  fatigueScore: number; // 0 to 100
  consecutiveDropCount: number;
  stalledExercises: string[];
  reason: string;
  recommendedAction: string;
}

// Tactical Intelligence & Coaching Types

export type ResistanceProfile = 'stretched' | 'mid' | 'shortened';

export interface ExerciseBiomechanicProfile {
  exerciseId: string;
  resistanceProfile: ResistanceProfile;
  primaryHead?: string;
  lengthTensionNote: string;
  stretchEmphasized: boolean;
}

export interface RedundancyWarning {
  muscle: MuscleGroup;
  profile: ResistanceProfile;
  exerciseNames: string[];
  severity: 'warning' | 'info';
  message: string;
  suggestedAlternatives: {
    exerciseId: string;
    name: string;
    profile: ResistanceProfile;
    reason: string;
  }[];
}

export interface KinematicAuditResult {
  totalExercises: number;
  profileDistribution: Record<ResistanceProfile, number>;
  balanceScore: number; // 0 to 100
  redundancies: RedundancyWarning[];
  recommendations: string[];
}

export interface WorkoutReadiness {
  id: string;
  date: string;
  sleepHours: number;
  energyRating: number; // 1 to 5
  sorenessLevel: 'recovered' | 'mild' | 'sore';
  readinessScore: number; // 0 to 100
  status: 'optimal' | 'moderate' | 'fatigued';
  calibratedRirDelta: number; // 0, +1 (easier if fatigued)
  calibratedVolumeDelta: number; // 0 or -1 set if fatigued
  calibratedNote: string;
}

export interface MuscleRecoveryFeedback {
  id: string;
  sessionId: string;
  date: string;
  muscle: MuscleGroup;
  pumpRating: 0 | 1 | 2; // 0 = Poor/None, 1 = Good/Pumped, 2 = Skin-Splitting
  workloadRating: 0 | 1 | 2; // 0 = Easy/Low, 1 = Ideal Overload, 2 = Excessive/Near Failure
  sorenessRating: 0 | 1 | 2; // 0 = None, 1 = Mild/Recovered, 2 = Severe/Impairs Performance
}

export interface AutoregulationCue {
  id: string;
  exerciseIdx: number;
  setIdx: number;
  type: 'drop_off' | 'overshoot' | 'undershoot' | 'failure_limit' | 'warmup';
  title: string;
  message: string;
  action: 'reduce_weight' | 'truncate_set' | 'increase_weight' | 'proceed';
  suggestedWeightKg?: number;
  suggestedReps?: number;
  confidence: number;
}

export interface PlateauDiagnosis {
  exerciseId: string;
  exerciseName: string;
  stalledSessions: number;
  lastTopSet: {
    weightKg: number;
    reps: number;
    date: string;
  };
  stickingPoint: string;
  prescriptions: {
    title: string;
    detail: string;
    strategy: 'microload' | 'rep_shift' | 'swap_variation';
    recommendedValue?: string;
  }[];
}


