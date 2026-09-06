import type { WorkoutSession, Routine, PRRecord, UserSettings, BodyWeightEntry, MesocycleBlock } from '../types/gym';
import { PRESET_ROUTINES } from '../data/presetRoutines';
import { IndexedDBService, STORES } from './indexedDb';
import { createDefaultMesocycle } from '../engine/mesocycleEngine';

const STORAGE_KEYS = {
  WORKOUTS: 'overload_workouts_v3',
  ROUTINES: 'overload_routines_v3',
  PRS: 'overload_prs_v3',
  SETTINGS: 'overload_settings_v3',
  ACTIVE_WORKOUT: 'overload_active_session_v3',
  BODYWEIGHT: 'overload_bodyweight_v3',
  MESOCYCLE: 'overload_mesocycle_v3'
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
  return [];
}

function getInitialSamplePRs(): PRRecord[] {
  return [];
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
    IndexedDBService.clearStore(STORES.WORKOUTS).then(() => {
      IndexedDBService.putMany(STORES.WORKOUTS, workouts);
    }).catch(() => {});
  },

  addWorkout(session: WorkoutSession): void {
    const all = this.getWorkouts();
    all.unshift(session);
    this.saveWorkouts(all);
  },

  deleteWorkout(id: string): WorkoutSession[] {
    const all = this.getWorkouts().filter((w) => w.id !== id);
    this.saveWorkouts(all);
    return all;
  },

  getRoutines(): Routine[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      if (!data) {
        const initial = PRESET_ROUTINES;
        this.saveRoutines(initial);
        return initial;
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
    IndexedDBService.clearStore(STORES.ROUTINES).then(() => {
      IndexedDBService.putMany(STORES.ROUTINES, routines);
    }).catch(() => {});
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
    IndexedDBService.clearStore(STORES.PRS).then(() => {
      IndexedDBService.putMany(STORES.PRS, prs);
    }).catch(() => {});
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
    IndexedDBService.setKV('settings', settings).catch(() => {});
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
    IndexedDBService.setKV('activeSession', session).catch(() => {});
  },

  getBodyWeightLogs(): BodyWeightEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BODYWEIGHT);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveBodyWeightLogs(logs: BodyWeightEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BODYWEIGHT, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed saving bodyweight logs:', e);
    }
    IndexedDBService.clearStore(STORES.BODYWEIGHT).then(() => {
      IndexedDBService.putMany(STORES.BODYWEIGHT, logs);
    }).catch(() => {});
  },

  addBodyWeightLog(weightKg: number, date?: string, note?: string): BodyWeightEntry {
    const logs = this.getBodyWeightLogs();
    const entry: BodyWeightEntry = {
      id: `bw-${Date.now()}`,
      date: date || new Date().toISOString(),
      weightKg,
      note
    };
    logs.unshift(entry);
    this.saveBodyWeightLogs(logs);

    // Also sync latest bodyweight to user settings
    const settings = this.getSettings();
    settings.bodyWeightKg = weightKg;
    this.saveSettings(settings);

    return entry;
  },

  exportFullBackupJSON(): string {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      workouts: this.getWorkouts(),
      routines: this.getRoutines(),
      prs: this.getPRs(),
      settings: this.getSettings(),
      bodyWeightLogs: this.getBodyWeightLogs()
    };
    return JSON.stringify(data, null, 2);
  },

  importFullBackupJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON format' };
      }

      if (Array.isArray(parsed.workouts)) {
        this.saveWorkouts(parsed.workouts);
      }
      if (Array.isArray(parsed.routines)) {
        this.saveRoutines(parsed.routines);
      }
      if (Array.isArray(parsed.prs)) {
        this.savePRs(parsed.prs);
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
      }
      if (Array.isArray(parsed.bodyWeightLogs)) {
        this.saveBodyWeightLogs(parsed.bodyWeightLogs);
      }

      return { success: true, message: 'Data restored successfully!' };
    } catch (err: any) {
      return { success: false, message: `Import failed: ${err.message}` };
    }
  },

  exportWorkoutsCSV(): string {
    const workouts = this.getWorkouts();
    const rows: string[] = [
      'Date,Routine,Exercise,Muscle Group,Equipment,Set Number,Set Type,Weight (kg),Reps,Estimated 1RM (kg),Completed,Is PR,Notes'
    ];

    for (const s of workouts) {
      const dateStr = s.date.split('T')[0];
      const routineEscaped = `"${s.routineName.replace(/"/g, '""')}"`;

      for (const ex of s.exercises) {
        const exName = `"${ex.name.replace(/"/g, '""')}"`;
        const exNotes = `"${(ex.notes || '').replace(/"/g, '""')}"`;

        for (const st of ex.sets) {
          const est1RM = st.weightKg > 0 ? Math.round((st.weightKg * (1 + st.reps / 30)) * 10) / 10 : 0;
          rows.push(
            [
              dateStr,
              routineEscaped,
              exName,
              ex.muscleGroup,
              ex.equipment,
              st.setNumber,
              st.type,
              st.weightKg,
              st.reps,
              est1RM,
              st.completed ? 'YES' : 'NO',
              st.isPR ? 'YES' : 'NO',
              exNotes
            ].join(',')
          );
        }
      }
    }

    return rows.join('\n');
  },

  getMesocycleBlock(): MesocycleBlock {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESOCYCLE);
      if (!data) {
        const initial = createDefaultMesocycle();
        this.saveMesocycleBlock(initial);
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed reading mesocycle:', e);
      return createDefaultMesocycle();
    }
  },

  saveMesocycleBlock(block: MesocycleBlock): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MESOCYCLE, JSON.stringify(block));
    } catch (e) {
      console.error('Failed saving mesocycle:', e);
    }
  },

  async initAsyncStorage(): Promise<void> {
    await IndexedDBService.migrateFromLocalStorage(
      this.getWorkouts(),
      this.getRoutines(),
      this.getPRs(),
      this.getSettings(),
      this.getBodyWeightLogs(),
      this.getActiveWorkout()
    );
  }
};

// Auto-run background migration safely on startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    StorageService.initAsyncStorage().catch(() => {});
  }, 1000);
}
