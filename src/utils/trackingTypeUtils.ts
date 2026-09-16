import type {
  ExerciseTrackingType,
  MuscleGroup,
  EquipmentType,
  WorkoutSet
} from '../types/gym';
import { kgToLbs } from '../engine/overloadEngine';

export function displayWeight(kg: number, unit: 'kg' | 'lbs' = 'kg'): number {
  if (unit === 'lbs') return kgToLbs(kg);
  return Math.round(kg * 100) / 100;
}

export interface ExerciseMetaLike {
  trackingType?: ExerciseTrackingType;
  muscleGroup?: MuscleGroup | string;
  equipment?: EquipmentType | string;
  name?: string;
  category?: string;
}

/**
 * Determines tracking modality for an exercise, falling back to intelligent heuristics
 * if trackingType is not explicitly configured on the exercise entity.
 */
export function getExerciseTrackingType(
  exercise?: ExerciseMetaLike | null,
  explicitTrackingType?: ExerciseTrackingType
): ExerciseTrackingType {
  if (explicitTrackingType) return explicitTrackingType;
  if (!exercise) return 'weight_reps';

  if (exercise.trackingType) {
    return exercise.trackingType;
  }

  const name = (exercise.name || '').toLowerCase();
  const muscle = (exercise.muscleGroup || '');
  const equip = (exercise.equipment || '');

  // Weighted cardio movements (e.g. Dumbbell Burpee, Weighted Vest Run)
  if (name.includes('dumbbell') || equip === 'Dumbbell' || equip === 'Barbell' || equip === 'Kettlebell') {
    return 'weight_reps';
  }

  // Pure Cardio Machine equipment
  if (equip === 'Cardio Machine') {
    return 'distance_time';
  }

  // Cardio Muscle Group
  if (muscle === 'Cardio') {
    // Calisthenics reps (burpees, climbers, star jumps, scissor jumps, etc.)
    if (
      name.includes('burpee') ||
      name.includes('climber') ||
      name.includes('star jump') ||
      name.includes('scissor jump') ||
      name.includes('jack jump') ||
      name.includes('astride') ||
      name.includes('squat jump') ||
      name.includes('hops') ||
      name.includes('bends') ||
      name.includes('crawl')
    ) {
      return 'reps_only';
    }

    // Isometric / interval timed holds
    if (
      name.includes('rope') ||
      name.includes('jump rope') ||
      name.includes('hold') ||
      name.includes('against wall')
    ) {
      return 'time_only';
    }

    // Distance + Time endurance cardio
    return 'distance_time';
  }

  // Bodyweight core holds (Planks, Wall sits)
  if (
    (muscle === 'Abs' || muscle === 'Core') &&
    (name.includes('plank') || name.includes('hollow hold') || name.includes('dead hang'))
  ) {
    return 'time_only';
  }

  return 'weight_reps';
}

// Distance conversion constants
const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;

export function kmToMiles(km: number): number {
  return Math.round(km * KM_TO_MILES * 100) / 100;
}

export function milesToKm(miles: number): number {
  return Math.round(miles * MILES_TO_KM * 100) / 100;
}

export function distanceUnitLabel(unit: 'kg' | 'lbs' = 'kg'): 'km' | 'mi' {
  return unit === 'lbs' ? 'mi' : 'km';
}

/**
 * Returns distance in user-selected unit (km or miles) rounded to 2 decimals
 */
export function displayDistance(
  distanceKm: number | undefined,
  unit: 'kg' | 'lbs' = 'kg'
): number {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) return 0;
  if (unit === 'lbs') {
    return kmToMiles(distanceKm);
  }
  return Math.round(distanceKm * 100) / 100;
}

/**
 * Normalizes user-input distance into canonical storage format (km)
 */
export function toStorageDistance(
  displayDist: number,
  unit: 'kg' | 'lbs' = 'kg'
): number {
  if (isNaN(displayDist) || displayDist <= 0) return 0;
  if (unit === 'lbs') {
    return milesToKm(displayDist);
  }
  return Math.round(displayDist * 100) / 100;
}

/**
 * Formats duration in seconds to "mm:ss" or "hh:mm:ss"
 */
export function formatDuration(seconds: number | undefined): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '00:00';
  const total = Math.round(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    const hh = String(hrs).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Parses user input string (e.g., "20", "20:00", "1:30", "45s") into total seconds
 */
export function parseDurationString(input: string | number): number {
  if (typeof input === 'number') return Math.max(0, input);
  if (!input) return 0;

  const clean = input.toString().trim().toLowerCase().replace(/[s]/g, '');
  if (clean.includes(':')) {
    const parts = clean.split(':').map((p) => parseFloat(p) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
  }

  const numeric = parseFloat(clean);
  if (isNaN(numeric)) return 0;
  // If user typed 20 (meaning 20 minutes) vs 45 (seconds):
  // When input is under 5, likely minutes if float, but let's treat pure numbers as minutes if >= 1 and typed into minute fields
  return numeric;
}

/**
 * Formats a completed set's performance for summary lists, calendar, and analytics
 */
export function formatSetPerformance(
  set: WorkoutSet,
  trackingType: ExerciseTrackingType = 'weight_reps',
  unit: 'kg' | 'lbs' = 'kg'
): string {
  switch (trackingType) {
    case 'distance_time': {
      const dist = displayDistance(set.distanceKm, unit);
      const distUnit = distanceUnitLabel(unit);
      const dur = formatDuration(set.durationSeconds);
      if (dist > 0 && set.durationSeconds) {
        return `${dist} ${distUnit} in ${dur}`;
      }
      if (dist > 0) return `${dist} ${distUnit}`;
      if (set.durationSeconds) return dur;
      return `${set.reps || 0} reps`;
    }

    case 'time_only': {
      if (set.durationSeconds) {
        return formatDuration(set.durationSeconds);
      }
      return `${set.reps || 0}s`;
    }

    case 'reps_only': {
      return `${set.reps || 0} reps`;
    }

    case 'weight_reps':
    default: {
      return `${displayWeight(set.weightKg)} ${unit} × ${set.reps || 0}`;
    }
  }
}
