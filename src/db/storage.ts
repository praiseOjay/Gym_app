import type {
  WorkoutSession,
  WorkoutExercise,
  Routine,
  PRRecord,
  UserSettings,
  BodyWeightEntry,
  MesocycleBlock,
  WorkoutReadiness,
  MuscleRecoveryFeedback,
  PlateauDiagnosis
} from '../types/gym';
import { PRESET_ROUTINES } from '../data/presetRoutines';
import { IndexedDBService, STORES } from './indexedDb';
import { createDefaultMesocycle } from '../engine/mesocycleEngine';
import { getExerciseMuscles } from '../engine/overloadEngine';
import { findExercise } from '../data/exerciseLibrary';
import { getExerciseTrackingType } from '../utils/trackingTypeUtils';
import {
  parseWorkoutLogs,
  computePRsFromSessions,
  type WorkoutImportResult
} from '../services/workoutImportService';

const STORAGE_KEYS = {
  WORKOUTS: 'overload_workouts_v3',
  ROUTINES: 'overload_routines_v3',
  PRS: 'overload_prs_v3',
  SETTINGS: 'overload_settings_v3',
  ACTIVE_WORKOUT: 'overload_active_session_v3',
  BODYWEIGHT: 'overload_bodyweight_v3',
  MESOCYCLE: 'overload_mesocycle_v3',
  READINESS: 'overload_readiness_history_v1',
  RECOVERY_FEEDBACK: 'overload_recovery_feedback_v1',
  PLATEAU_RECORDS: 'overload_plateau_records_v1'
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
  targetWeightKg: 85,
  preferredCurrency: 'auto'
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
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      let needsResave = false;
      const workouts: WorkoutSession[] = parsed.map((s, idx) => {
        if (!s || typeof s !== 'object') return s;
        let current = s;
        if (!s.id || typeof s.id !== 'string' || s.id.trim() === '') {
          needsResave = true;
          const timestamp = s.date ? new Date(s.date).getTime() : Date.now();
          current = {
            ...current,
            id: `session-${isNaN(timestamp) ? Date.now() : timestamp}-${idx}-${Math.random().toString(36).substring(2, 7)}`
          };
        }

        // Heal any corrupted exercise muscle groups (e.g. Legs or Cardio tagged as Chest)
        let exerciseSanitized = false;
        const sanitizedExercises = (current.exercises || []).map((ex: WorkoutExercise) => {
          const { primary, isCardio } = getExerciseMuscles(ex);
          const targetGroup = isCardio ? 'Cardio' : primary;
          if (targetGroup && targetGroup !== ex.muscleGroup) {
            exerciseSanitized = true;
            return { ...ex, muscleGroup: targetGroup };
          }
          return ex;
        });

        if (exerciseSanitized) {
          needsResave = true;
          current = { ...current, exercises: sanitizedExercises };
        }

        return current;
      });
      if (needsResave) {
        try {
          localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
        } catch {}
      }
      return workouts;
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
    if (!session.id) {
      session.id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    const all = this.getWorkouts();
    all.unshift(session);
    this.saveWorkouts(all);
  },

  deleteWorkout(id: string, fallbackIndex?: number): WorkoutSession[] {
    const all = this.getWorkouts();
    let targetIndex = -1;
    if (id && typeof id === 'string') {
      targetIndex = all.findIndex((w) => w.id === id);
    }
    if (targetIndex === -1 && fallbackIndex !== undefined && fallbackIndex >= 0 && fallbackIndex < all.length) {
      targetIndex = fallbackIndex;
    }
    if (targetIndex === -1) {
      console.warn(`deleteWorkout: No workout found matching id "${id}" or index ${fallbackIndex}. No workouts deleted.`);
      return all;
    }
    const updated = all.filter((_, idx) => idx !== targetIndex);
    this.saveWorkouts(updated);
    return updated;
  },

  importWorkoutLogs(
    rawContent: string,
    mode: 'merge' | 'replace' = 'merge'
  ): WorkoutImportResult {
    const parsed = parseWorkoutLogs(rawContent);
    if (!parsed.success || parsed.sessions.length === 0) {
      return parsed;
    }

    let finalWorkouts: WorkoutSession[];
    let importedCount = 0;

    if (mode === 'replace') {
      finalWorkouts = parsed.sessions;
      importedCount = finalWorkouts.length;
    } else {
      const existing = this.getWorkouts();
      const existingSignatures = new Set(
        existing.map((s) => {
          const datePart = (s.date || '').split('T')[0];
          const totalSets = s.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
          return `${datePart}_${(s.routineName || '').toLowerCase().trim()}_${totalSets}`;
        })
      );

      const newSessions: WorkoutSession[] = [];
      for (const s of parsed.sessions) {
        const datePart = (s.date || '').split('T')[0];
        const totalSets = s.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        const sig = `${datePart}_${(s.routineName || '').toLowerCase().trim()}_${totalSets}`;
        if (!existingSignatures.has(sig)) {
          newSessions.push(s);
          existingSignatures.add(sig);
        }
      }

      finalWorkouts = [...newSessions, ...existing];
      importedCount = newSessions.length;
    }

    // Sort descending by date
    finalWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.saveWorkouts(finalWorkouts);

    // Automatically recalculate PRs across all workout sessions
    const recomputedPRs = computePRsFromSessions(finalWorkouts);
    this.savePRs(recomputedPRs);

    return {
      ...parsed,
      sessionsImported: importedCount,
      prsUpdated: recomputedPRs.length,
      sessions: finalWorkouts,
      message: `Successfully imported ${importedCount} session${importedCount === 1 ? '' : 's'} (${parsed.setsImported} sets). ${recomputedPRs.length} Personal Records recalibrated.`
    };
  },

  recalculatePRsFromWorkouts(workouts?: WorkoutSession[]): PRRecord[] {
    const target = workouts || this.getWorkouts();
    const prs = computePRsFromSessions(target);
    this.savePRs(prs);
    return prs;
  },

  getRoutines(): Routine[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      if (!data) {
        const initial = PRESET_ROUTINES;
        this.saveRoutines(initial);
        return initial;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return PRESET_ROUTINES;

      let needsResave = false;
      const routines: Routine[] = parsed.map((r: Routine) => {
        if (!r || !Array.isArray(r.exercises)) return r;
        let routineChanged = false;
        const sanitizedExercises = r.exercises.map((template) => {
          const meta = findExercise(template.exerciseId);
          const trueTrackingType = getExerciseTrackingType(meta, template.trackingType);
          const isBodyweight = meta?.equipment === 'Bodyweight';

          let updatedTemplate = { ...template };
          if (meta && trueTrackingType !== template.trackingType) {
            updatedTemplate.trackingType = trueTrackingType;
            routineChanged = true;
          }
          if (trueTrackingType === 'reps_only' && updatedTemplate.defaultWeightKg !== 0) {
            updatedTemplate.defaultWeightKg = 0;
            routineChanged = true;
          } else if (isBodyweight && updatedTemplate.defaultWeightKg === 20) {
            updatedTemplate.defaultWeightKg = 0;
            routineChanged = true;
          }
          return updatedTemplate;
        });

        if (routineChanged) {
          needsResave = true;
          return { ...r, exercises: sanitizedExercises };
        }
        return r;
      });

      if (needsResave) {
        try {
          localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
        } catch {}
      }
      return routines;
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
      version: 3,
      exportedAt: new Date().toISOString(),
      workouts: this.getWorkouts(),
      routines: this.getRoutines(),
      prs: this.getPRs(),
      settings: this.getSettings(),
      bodyWeightLogs: this.getBodyWeightLogs(),
      mesocycleBlock: this.getMesocycleBlock(),
      readinessHistory: this.getReadinessHistory(),
      recoveryFeedback: this.getRecoveryFeedback(),
      plateauRecords: this.getPlateauRecords()
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
      if (parsed.mesocycleBlock && typeof parsed.mesocycleBlock === 'object') {
        this.saveMesocycleBlock(parsed.mesocycleBlock);
      }
      if (Array.isArray(parsed.readinessHistory)) {
        this.saveReadinessHistory(parsed.readinessHistory);
      }
      if (Array.isArray(parsed.recoveryFeedback)) {
        this.saveRecoveryFeedback(parsed.recoveryFeedback);
      }
      if (Array.isArray(parsed.plateauRecords)) {
        this.savePlateauRecords(parsed.plateauRecords);
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

  getReadinessHistory(): WorkoutReadiness[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.READINESS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveReadinessHistory(history: WorkoutReadiness[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.READINESS, JSON.stringify(history));
    } catch (e) {
      console.error('Failed saving readiness history:', e);
    }
  },

  addReadinessRecord(record: WorkoutReadiness): void {
    const history = this.getReadinessHistory();
    history.unshift(record);
    this.saveReadinessHistory(history.slice(0, 60)); // keep last 60 days
  },

  getLatestReadiness(): WorkoutReadiness | null {
    const history = this.getReadinessHistory();
    if (history.length === 0) return null;
    const latest = history[0];
    const today = new Date().toISOString().split('T')[0];
    return latest.date.startsWith(today) ? latest : null;
  },

  getRecoveryFeedback(): MuscleRecoveryFeedback[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECOVERY_FEEDBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRecoveryFeedback(feedback: MuscleRecoveryFeedback[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RECOVERY_FEEDBACK, JSON.stringify(feedback));
    } catch (e) {
      console.error('Failed saving recovery feedback:', e);
    }
  },

  addRecoveryFeedback(records: MuscleRecoveryFeedback[]): void {
    const existing = this.getRecoveryFeedback();
    const updated = [...records, ...existing].slice(0, 150);
    this.saveRecoveryFeedback(updated);
  },

  getPlateauRecords(): PlateauDiagnosis[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLATEAU_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePlateauRecords(records: PlateauDiagnosis[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PLATEAU_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Failed saving plateau records:', e);
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
