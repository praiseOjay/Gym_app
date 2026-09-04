import type { Routine, WorkoutSession } from '../types/gym';

export interface TodayWorkoutState {
  dayName: string;                 // e.g. 'Friday'
  formattedDate: string;           // e.g. 'Friday, Sep 4'
  routine: Routine;                // the workout routine scheduled for today (or fallback)
  isScheduledToday: boolean;       // true if today has a routine scheduled in the split
  isAlreadyCompletedToday: boolean;// true if user already completed a workout today
  todayCompletedCount: number;     // number of workouts logged today
}

/**
 * Returns a consistent local YYYY-MM-DD date key
 */
export function toLocalDateKey(dateInput: string | Date = new Date()): string {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Matches the current day of the week with the user's routines split
 */
export function getTodayWorkoutState(
  routines: Routine[],
  historySessions: WorkoutSession[] = []
): TodayWorkoutState {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. 'Friday'
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const todayKey = toLocalDateKey(now);
  const todaysSessions = historySessions.filter(
    (s) => toLocalDateKey(s.date) === todayKey
  );
  const isAlreadyCompletedToday = todaysSessions.length > 0;

  if (!routines || routines.length === 0) {
    throw new Error('No routines available');
  }

  // Find routine matching today's weekday (e.g. 'Friday' matching 'Friday' in weekday/dayTag/name)
  const dayLower = dayName.toLowerCase();
  const matchingRoutine = routines.find(
    (r) =>
      r.weekday?.toLowerCase() === dayLower ||
      r.dayTag?.toLowerCase() === dayLower ||
      r.name?.toLowerCase().includes(dayLower)
  );

  if (matchingRoutine) {
    return {
      dayName,
      formattedDate,
      routine: matchingRoutine,
      isScheduledToday: true,
      isAlreadyCompletedToday,
      todayCompletedCount: todaysSessions.length
    };
  }

  // Today has no scheduled routine in split (e.g. Saturday or Sunday = Scheduled Rest Day)
  // Fallback to next routine in the split cycle, or the first routine
  const lastSession = historySessions[0];
  let fallbackIndex = 0;
  if (lastSession?.routineId) {
    const lastIdx = routines.findIndex((r) => r.id === lastSession.routineId);
    if (lastIdx >= 0) {
      fallbackIndex = (lastIdx + 1) % routines.length;
    }
  }

  return {
    dayName,
    formattedDate,
    routine: routines[fallbackIndex] || routines[0],
    isScheduledToday: false,
    isAlreadyCompletedToday,
    todayCompletedCount: todaysSessions.length
  };
}
