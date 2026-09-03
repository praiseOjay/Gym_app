import type { WorkoutSession, Routine, PRRecord, UserSettings } from '../types/gym';
import { PRESET_ROUTINES } from '../data/presetRoutines';

const STORAGE_KEYS = {
  WORKOUTS: 'overload_workouts_v2',
  ROUTINES: 'overload_routines_v2',
  PRS: 'overload_prs_v2',
  SETTINGS: 'overload_settings_v2',
  ACTIVE_WORKOUT: 'overload_active_session_v2'
};

const DEFAULT_SETTINGS: UserSettings = {
  unit: 'kg',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAfyy7j_3Vc9eJ4ds7RxOOmvHzUnjskosQ',
  soundEnabled: true,
  vibrationEnabled: true,
  defaultRestSeconds: 60,
  userName: 'Athlete',
  experienceLevel: 'Intermediate',
  primaryGoal: 'Hypertrophy',
  bodyWeightKg: 80,
  heightCm: 180,
  age: 24,
  targetWeightKg: 85
};

function getInitialSampleWorkouts(): WorkoutSession[] {
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const fourDaysAgo = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'session-sample-1',
      routineId: 'routine-tuesday',
      routineName: 'Tuesday: Lower Body A',
      dayTag: 'Tuesday',
      date: fourDaysAgo,
      durationSeconds: 2700,
      totalVolumeKg: 8520,
      prCount: 1,
      notes: 'Sled Hack Squat felt smooth. 140kg x 10 reps.',
      exercises: [
        {
          id: 'we-cr-1',
          exerciseId: 'lever-seated-crunch',
          name: 'Lever Seated Crunch (chest pad)',
          muscleGroup: 'Abs',
          equipment: 'Machine',
          sets: [
            { id: 's1', setNumber: 1, type: 'working', weightKg: 45, reps: 10, completed: true },
            { id: 's2', setNumber: 2, type: 'working', weightKg: 45, reps: 10, completed: true },
            { id: 's3', setNumber: 3, type: 'working', weightKg: 45, reps: 10, completed: true }
          ]
        },
        {
          id: 'we-cf-1',
          exerciseId: 'smith-calf-raise',
          name: 'Smith Calf Raise (version 2)',
          muscleGroup: 'Calves',
          equipment: 'Smith Machine',
          sets: [
            { id: 's4', setNumber: 1, type: 'working', weightKg: 140, reps: 12, completed: true },
            { id: 's5', setNumber: 2, type: 'working', weightKg: 140, reps: 12, completed: true },
            { id: 's6', setNumber: 3, type: 'working', weightKg: 140, reps: 12, completed: true }
          ]
        },
        {
          id: 'we-hs-1',
          exerciseId: 'sled-hack-squat',
          name: 'Sled Hack Squat',
          muscleGroup: 'Quads',
          equipment: 'Machine',
          sets: [
            { id: 's7', setNumber: 1, type: 'working', weightKg: 140, reps: 10, completed: true },
            { id: 's8', setNumber: 2, type: 'working', weightKg: 140, reps: 10, completed: true },
            { id: 's9', setNumber: 3, type: 'working', weightKg: 140, reps: 10, completed: true, isPR: true }
          ]
        },
        {
          id: 'we-rdl-1',
          exerciseId: 'dumbbell-romanian-deadlift',
          name: 'Dumbbell Romanian Deadlift',
          muscleGroup: 'Hamstrings',
          equipment: 'Dumbbell',
          sets: [
            { id: 's10', setNumber: 1, type: 'working', weightKg: 32, reps: 10, completed: true },
            { id: 's11', setNumber: 2, type: 'working', weightKg: 32, reps: 10, completed: true },
            { id: 's12', setNumber: 3, type: 'working', weightKg: 32, reps: 10, completed: true }
          ]
        }
      ]
    },
    {
      id: 'session-sample-2',
      routineId: 'routine-wednesday',
      routineName: 'Wednesday: Upper Body B',
      dayTag: 'Wednesday',
      date: twoDaysAgo,
      durationSeconds: 2880,
      totalVolumeKg: 7940,
      prCount: 2,
      notes: 'Lever Seated Fly at 93kg felt fantastic on the pecs.',
      exercises: [
        {
          id: 'we-pr-1',
          exerciseId: 'db-one-arm-hammer-preacher-curl',
          name: 'Dumbbell One Arm Hammer Preacher Curl',
          muscleGroup: 'Biceps',
          equipment: 'Dumbbell',
          sets: [
            { id: 's13', setNumber: 1, type: 'working', weightKg: 18, reps: 10, completed: true },
            { id: 's14', setNumber: 2, type: 'working', weightKg: 18, reps: 10, completed: true },
            { id: 's15', setNumber: 3, type: 'working', weightKg: 18, reps: 10, completed: true, isPR: true }
          ]
        },
        {
          id: 'we-fl-1',
          exerciseId: 'lever-seated-fly',
          name: 'Lever Seated Fly',
          muscleGroup: 'Chest',
          equipment: 'Machine',
          sets: [
            { id: 's16', setNumber: 1, type: 'working', weightKg: 93, reps: 12, completed: true },
            { id: 's17', setNumber: 2, type: 'working', weightKg: 93, reps: 12, completed: true },
            { id: 's18', setNumber: 3, type: 'working', weightKg: 93, reps: 12, completed: true, isPR: true }
          ]
        },
        {
          id: 'we-tr-1',
          exerciseId: 'cable-triceps-pushdown-vbar',
          name: 'Cable Triceps Pushdown (V-bar)',
          muscleGroup: 'Triceps',
          equipment: 'Cable',
          sets: [
            { id: 's19', setNumber: 1, type: 'working', weightKg: 54, reps: 9, completed: true },
            { id: 's20', setNumber: 2, type: 'working', weightKg: 54, reps: 9, completed: true },
            { id: 's21', setNumber: 3, type: 'working', weightKg: 54, reps: 9, completed: true }
          ]
        },
        {
          id: 'we-rw-1',
          exerciseId: 'cable-low-seated-row',
          name: 'Cable Low Seated Row',
          muscleGroup: 'Back',
          equipment: 'Cable',
          sets: [
            { id: 's22', setNumber: 1, type: 'working', weightKg: 80, reps: 10, completed: true },
            { id: 's23', setNumber: 2, type: 'working', weightKg: 80, reps: 10, completed: true },
            { id: 's24', setNumber: 3, type: 'working', weightKg: 80, reps: 10, completed: true }
          ]
        }
      ]
    }
  ];
}

function getInitialSamplePRs(): PRRecord[] {
  return [
    {
      id: 'pr-1',
      exerciseId: 'sled-hack-squat',
      exerciseName: 'Sled Hack Squat',
      type: '1RM',
      value: 186.7,
      reps: 10,
      date: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pr-2',
      exerciseId: 'lever-seated-fly',
      exerciseName: 'Lever Seated Fly',
      type: '1RM',
      value: 130.2,
      reps: 12,
      date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'pr-3',
      exerciseId: 'cable-bar-lateral-pulldown',
      exerciseName: 'Cable Bar Lateral Pulldown',
      type: '1RM',
      value: 160.0,
      reps: 10,
      date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    }
  ];
}

export const StorageService = {
  getWorkouts(): WorkoutSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      if (!data) {
        const initial = getInitialSampleWorkouts();
        this.saveWorkouts(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed reading workouts:', e);
      return [];
    }
  },

  saveWorkouts(workouts: WorkoutSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    } catch (e) {
      console.error('Failed saving workouts:', e);
    }
  },

  addWorkout(session: WorkoutSession): void {
    const all = this.getWorkouts();
    all.unshift(session);
    this.saveWorkouts(all);
  },

  getRoutines(): Routine[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      if (!data) {
        this.saveRoutines(PRESET_ROUTINES);
        return PRESET_ROUTINES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed reading routines:', e);
      return PRESET_ROUTINES;
    }
  },

  saveRoutines(routines: Routine[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
    } catch (e) {
      console.error('Failed saving routines:', e);
    }
  },

  getPRs(): PRRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRS);
      if (!data) {
        const initial = getInitialSamplePRs();
        this.savePRs(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed reading PRs:', e);
      return [];
    }
  },

  savePRs(prs: PRRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(prs));
    } catch (e) {
      console.error('Failed saving PRs:', e);
    }
  },

  addPR(newPR: PRRecord): void {
    const prs = this.getPRs();
    const index = prs.findIndex(
      (p) => p.exerciseId === newPR.exerciseId && p.type === newPR.type
    );
    if (index >= 0) {
      prs[index] = newPR;
    } else {
      prs.unshift(newPR);
    }
    this.savePRs(prs);
  },

  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed reading settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed saving settings:', e);
    }
  },

  getActiveWorkout(): WorkoutSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveActiveWorkout(session: WorkoutSession | null): void {
    try {
      if (!session) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      } else {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(session));
      }
    } catch (e) {
      console.error('Failed saving active workout:', e);
    }
  }
};
