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
  | 'Core';

export type EquipmentType =
  | 'Barbell'
  | 'Dumbbell'
  | 'Cable'
  | 'Machine'
  | 'Bodyweight'
  | 'Smith Machine'
  | 'Kettlebell'
  | 'Other';

export type SetType = 'warmup' | 'working' | 'drop' | 'failure';

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
  type: '1RM' | 'MaxWeight' | 'MaxVolume';
  value: number; // in kg
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
