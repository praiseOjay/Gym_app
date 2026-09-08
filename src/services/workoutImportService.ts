import type {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  PRRecord,
  MuscleGroup,
  EquipmentType,
  SetType,
  ExerciseTrackingType
} from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { getExerciseTrackingType } from '../utils/trackingTypeUtils';

export interface WorkoutImportResult {
  success: boolean;
  message: string;
  detectedFormat: string;
  sessionsImported: number;
  setsImported: number;
  prsUpdated: number;
  sessions: WorkoutSession[];
}

/**
 * Standard RFC 4180 CSV parser supporting multiline cells, escaped quotes, and commas inside quotes.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  // Normalize line breaks
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote ("")
          currentCell += '"';
          i++; // Skip the second quote
        } else {
          // End of quoted cell
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Find library metadata for an exercise name via fuzzy/case-insensitive matching
 */
function matchExercise(rawName: string) {
  const clean = (rawName || '').trim().toLowerCase();
  if (!clean) {
    return {
      id: `custom-ex-${Date.now()}`,
      name: 'Exercise',
      muscleGroup: 'Other' as MuscleGroup,
      equipment: 'Other' as EquipmentType,
      trackingType: 'weight_reps' as ExerciseTrackingType
    };
  }

  // Exact match
  const exact = EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === clean);
  if (exact) {
    return {
      id: exact.id,
      name: exact.name,
      muscleGroup: exact.muscleGroup,
      equipment: exact.equipment,
      trackingType: getExerciseTrackingType(exact)
    };
  }

  // Contains match
  const partial = EXERCISE_LIBRARY.find(
    (e) => clean.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(clean)
  );
  if (partial) {
    return {
      id: partial.id,
      name: partial.name,
      muscleGroup: partial.muscleGroup,
      equipment: partial.equipment,
      trackingType: getExerciseTrackingType(partial)
    };
  }

  // Infer muscle group from common exercise keywords
  let inferredMuscle: MuscleGroup = 'Chest';
  if (clean.includes('squat') || clean.includes('lunge') || clean.includes('quad') || clean.includes('leg press')) {
    inferredMuscle = 'Quads';
  } else if (clean.includes('deadlift') || clean.includes('hamstring') || (clean.includes('curl') && clean.includes('leg'))) {
    inferredMuscle = 'Hamstrings';
  } else if (clean.includes('row') || clean.includes('pull') || clean.includes('lat') || clean.includes('chin')) {
    inferredMuscle = 'Back';
  } else if (clean.includes('shoulder') || clean.includes('overhead') || (clean.includes('press') && clean.includes('military')) || clean.includes('lateral')) {
    inferredMuscle = 'Shoulders';
  } else if (clean.includes('bicep') || clean.includes('curl')) {
    inferredMuscle = 'Biceps';
  } else if (clean.includes('tricep') || clean.includes('dip') || clean.includes('pushdown')) {
    inferredMuscle = 'Triceps';
  } else if (clean.includes('run') || clean.includes('treadmill') || clean.includes('bike') || clean.includes('rower') || clean.includes('cardio') || clean.includes('elliptical')) {
    inferredMuscle = 'Cardio';
  } else if (clean.includes('abs') || clean.includes('crunch') || clean.includes('plank')) {
    inferredMuscle = 'Abs';
  }

  // Infer equipment
  let inferredEquip: EquipmentType = 'Barbell';
  if (clean.includes('dumbbell') || clean.includes('db')) inferredEquip = 'Dumbbell';
  else if (clean.includes('cable')) inferredEquip = 'Cable';
  else if (clean.includes('machine') || clean.includes('smith')) inferredEquip = 'Machine';
  else if (clean.includes('bodyweight') || clean.includes('pushup') || clean.includes('pullup')) inferredEquip = 'Bodyweight';
  else if (clean.includes('kettlebell')) inferredEquip = 'Kettlebell';
  else if (inferredMuscle === 'Cardio') inferredEquip = 'Cardio Machine';

  const mockMeta = {
    name: rawName.trim(),
    muscleGroup: inferredMuscle,
    equipment: inferredEquip
  };

  return {
    id: `import-${clean.replace(/[^a-z0-9]/g, '-')}`,
    name: rawName.trim(),
    muscleGroup: inferredMuscle,
    equipment: inferredEquip,
    trackingType: getExerciseTrackingType(mockMeta)
  };
}

/**
 * Normalizes any date string (ISO, YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY) into ISO string
 */
function normalizeDate(rawDate: string): string {
  if (!rawDate) return new Date().toISOString();
  const trimmed = rawDate.trim();

  // Try direct Date parsing
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }

  // Try parsing MM/DD/YYYY or DD/MM/YYYY
  const parts = trimmed.split(/[-/.]/);
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    // YYYY-MM-DD
    if (parts[0].length === 4) {
      const parsed = new Date(p0, p1 - 1, p2);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
    // MM/DD/YYYY
    if (parts[2].length === 4) {
      const parsed = new Date(p2, p0 - 1, p1);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

/**
 * Standardizes Set Type
 */
function normalizeSetType(raw: string): SetType {
  const clean = (raw || '').toLowerCase().trim();
  if (clean.includes('warm') || clean === 'w') return 'warmup';
  if (clean.includes('drop') || clean === 'd') return 'drop';
  if (clean.includes('fail') || clean === 'f') return 'failure';
  return 'working';
}

/**
 * Detect format and parse workout logs from string content (CSV or JSON)
 */
export function parseWorkoutLogs(content: string): WorkoutImportResult {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    return {
      success: false,
      message: 'Provided workout log content is empty.',
      detectedFormat: 'Empty',
      sessionsImported: 0,
      setsImported: 0,
      prsUpdated: 0,
      sessions: []
    };
  }

  // 1. JSON Detection
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      let rawSessions: any[] = [];
      if (Array.isArray(parsed)) {
        rawSessions = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.workouts)) rawSessions = parsed.workouts;
        else if (Array.isArray(parsed.sessions)) rawSessions = parsed.sessions;
        else if (Array.isArray(parsed.history)) rawSessions = parsed.history;
        else if (parsed.exercises && parsed.date) rawSessions = [parsed];
      }

      if (rawSessions.length > 0) {
        const validated: WorkoutSession[] = rawSessions.map((s, sIdx) => {
          const exercises: WorkoutExercise[] = (s.exercises || []).map((ex: any, exIdx: number) => {
            const matched = matchExercise(ex.name || 'Exercise');
            const sets: WorkoutSet[] = (ex.sets || []).map((st: any, stIdx: number) => ({
              id: st.id || `st-${Date.now()}-${sIdx}-${exIdx}-${stIdx}`,
              setNumber: st.setNumber || stIdx + 1,
              type: normalizeSetType(st.type),
              weightKg: typeof st.weightKg === 'number' ? st.weightKg : parseFloat(st.weight) || 0,
              reps: typeof st.reps === 'number' ? st.reps : parseInt(st.reps, 10) || 0,
              rpe: st.rpe || 8,
              completed: st.completed !== undefined ? Boolean(st.completed) : true,
              isPR: Boolean(st.isPR),
              durationSeconds: st.durationSeconds || st.duration,
              distanceKm: st.distanceKm || st.distance
            }));

            return {
              id: ex.id || `we-${Date.now()}-${sIdx}-${exIdx}`,
              exerciseId: ex.exerciseId || matched.id,
              name: ex.name || matched.name,
              muscleGroup: ex.muscleGroup || matched.muscleGroup,
              equipment: ex.equipment || matched.equipment,
              trackingType: ex.trackingType || matched.trackingType,
              sets,
              notes: ex.notes || ''
            };
          });

          const totalVolumeKg = exercises.reduce((sum, e) => {
            if (e.trackingType === 'distance_time' || e.trackingType === 'time_only') return sum;
            return sum + e.sets.filter((st) => st.completed && st.type !== 'warmup').reduce((sSum, st) => sSum + st.weightKg * st.reps, 0);
          }, 0);

          return {
            id: s.id || `session-${Date.now()}-${sIdx}-${Math.random().toString(36).substring(2, 6)}`,
            routineId: s.routineId,
            routineName: s.routineName || 'Workout Session',
            dayTag: s.dayTag || 'General',
            date: normalizeDate(s.date),
            durationSeconds: s.durationSeconds || exercises.length * 600 || 3600,
            exercises,
            totalVolumeKg: Math.round(totalVolumeKg),
            prCount: s.prCount || 0,
            notes: s.notes || '',
            caloriesBurned: s.caloriesBurned || Math.round(((s.durationSeconds || 3600) / 60) * 7.5)
          };
        });

        const totalSets = validated.reduce(
          (sum, s) => sum + s.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0),
          0
        );

        return {
          success: true,
          message: `Successfully loaded ${validated.length} workout sessions (${totalSets} sets).`,
          detectedFormat: 'JSON Workout Array',
          sessionsImported: validated.length,
          setsImported: totalSets,
          prsUpdated: 0,
          sessions: validated
        };
      }
    } catch {
      // If JSON parse fails, fall through to CSV parser
    }
  }

  // 2. CSV Parser
  try {
    const rows = parseCSV(trimmed);
    if (rows.length < 2) {
      return {
        success: false,
        message: 'CSV file must have a header row and at least one data row.',
        detectedFormat: 'Invalid CSV',
        sessionsImported: 0,
        setsImported: 0,
        prsUpdated: 0,
        sessions: []
      };
    }

    const rawHeaders = rows[0].map((h) => h.toLowerCase().trim());

    // Helper to find column index by multiple keyword candidates
    const findCol = (...candidates: string[]): number => {
      return rawHeaders.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));
    };

    const colDate = findCol('date', 'start time', 'timestamp', 'created');
    const colRoutine = findCol('routine', 'workout name', 'title', 'workout', 'session');
    const colExercise = findCol('exercise name', 'exercise title', 'exercise', 'movement', 'activity');
    const colWeight = findCol('weight (kg)', 'weight (kgs)', 'weight (lbs)', 'weight', 'load', 'kg', 'lbs');
    const colReps = findCol('reps', 'rep', 'repetitions', 'count');
    const colSetNum = findCol('set number', 'set order', 'set index', 'set');
    const colSetType = findCol('set type', 'type');
    const colDistance = findCol('distance (km)', 'distance', 'km', 'miles');
    const colDuration = findCol('duration (seconds)', 'duration', 'seconds', 'time');
    const colNotes = findCol('notes', 'exercise notes', 'comment');
    const colWorkoutNotes = findCol('workout notes', 'description');

    if (colExercise === -1) {
      return {
        success: false,
        message: `Could not identify an Exercise column. Available columns: [${rows[0].join(', ')}].`,
        detectedFormat: 'Unrecognized CSV',
        sessionsImported: 0,
        setsImported: 0,
        prsUpdated: 0,
        sessions: []
      };
    }

    // Detect source format brand
    let detectedFormat = 'Generic CSV Spreadsheet';
    if (rawHeaders.includes('routine') && rawHeaders.includes('estimated 1rm (kg)')) {
      detectedFormat = 'Overload AI CSV Export';
    } else if (rawHeaders.includes('workout name') && rawHeaders.includes('set order')) {
      detectedFormat = 'Strong App CSV';
    } else if (rawHeaders.includes('title') && rawHeaders.includes('set index')) {
      detectedFormat = 'Hevy App CSV';
    } else if (rawHeaders.includes('category') && rawHeaders.includes('weight (kgs)')) {
      detectedFormat = 'FitNotes CSV';
    }

    const isLbsHeader = rawHeaders.some((h) => h.includes('(lbs)') || h.includes('lbs'));

    // Intermediate structure: Map<dateKey_routineName, Map<exerciseName, WorkoutSet[]>>
    interface TempSession {
      date: string;
      routineName: string;
      workoutNotes?: string;
      durationSeconds?: number;
      exercisesMap: Map<string, { exerciseMeta: any; sets: WorkoutSet[]; notes?: string }>;
    }

    const sessionMap = new Map<string, TempSession>();

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || row.every((c) => !c)) continue;

      const rawDate = colDate !== -1 ? row[colDate] : '';
      const dateISO = normalizeDate(rawDate);
      const dateKey = dateISO.split('T')[0];

      const rawRoutine = colRoutine !== -1 ? row[colRoutine] : '';
      const routineName = (rawRoutine || 'Workout Session').trim();
      const sessionKey = `${dateKey}___${routineName.toLowerCase()}`;

      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          date: dateISO,
          routineName,
          workoutNotes: colWorkoutNotes !== -1 ? row[colWorkoutNotes] : undefined,
          durationSeconds: colDuration !== -1 ? parseInt(row[colDuration], 10) || undefined : undefined,
          exercisesMap: new Map()
        });
      }

      const currentSession = sessionMap.get(sessionKey)!;
      const rawExercise = row[colExercise];
      if (!rawExercise) continue;

      const exerciseMeta = matchExercise(rawExercise);
      const exKey = exerciseMeta.id;

      if (!currentSession.exercisesMap.has(exKey)) {
        currentSession.exercisesMap.set(exKey, {
          exerciseMeta,
          sets: [],
          notes: colNotes !== -1 ? row[colNotes] : undefined
        });
      }

      const exEntry = currentSession.exercisesMap.get(exKey)!;

      // Parse Set values
      const rawWeight = colWeight !== -1 ? parseFloat(row[colWeight]) || 0 : 0;
      // Convert lbs to kg if detected
      const weight = isLbsHeader ? Math.round(rawWeight * 0.45359237 * 10) / 10 : rawWeight;

      const reps = colReps !== -1 ? parseInt(row[colReps], 10) || 0 : 0;
      const setNum = colSetNum !== -1 ? parseInt(row[colSetNum], 10) || exEntry.sets.length + 1 : exEntry.sets.length + 1;
      const setType = colSetType !== -1 ? normalizeSetType(row[colSetType]) : 'working';

      const distanceKm = colDistance !== -1 ? parseFloat(row[colDistance]) || undefined : undefined;
      const durationSeconds = colDuration !== -1 ? parseInt(row[colDuration], 10) || undefined : undefined;

      const newSet: WorkoutSet = {
        id: `st-${Date.now()}-${r}`,
        setNumber: setNum,
        type: setType,
        weightKg: weight,
        reps,
        completed: true,
        rpe: 8,
        distanceKm,
        durationSeconds
      };

      exEntry.sets.push(newSet);
    }

    // Assemble finished WorkoutSession array
    const sessions: WorkoutSession[] = [];
    let sCounter = 0;

    for (const [, sessionData] of sessionMap.entries()) {
      sCounter++;
      const exercises: WorkoutExercise[] = [];
      let totalVol = 0;

      let exCounter = 0;
      for (const [, exData] of sessionData.exercisesMap.entries()) {
        exCounter++;
        // Sort sets by setNumber
        const sortedSets = exData.sets.sort((a, b) => a.setNumber - b.setNumber);

        const exercise: WorkoutExercise = {
          id: `we-import-${Date.now()}-${sCounter}-${exCounter}`,
          exerciseId: exData.exerciseMeta.id,
          name: exData.exerciseMeta.name,
          muscleGroup: exData.exerciseMeta.muscleGroup,
          equipment: exData.exerciseMeta.equipment,
          trackingType: exData.exerciseMeta.trackingType,
          sets: sortedSets,
          notes: exData.notes
        };

        exercises.push(exercise);

        if (exercise.trackingType !== 'distance_time' && exercise.trackingType !== 'time_only') {
          const exVol = sortedSets
            .filter((st) => st.completed && st.type !== 'warmup')
            .reduce((sum, st) => sum + st.weightKg * st.reps, 0);
          totalVol += exVol;
        }
      }

      const duration = sessionData.durationSeconds || Math.max(1800, exercises.length * 600);

      sessions.push({
        id: `session-import-${Date.now()}-${sCounter}-${Math.random().toString(36).substring(2, 6)}`,
        routineName: sessionData.routineName,
        date: sessionData.date,
        durationSeconds: duration,
        exercises,
        totalVolumeKg: Math.round(totalVol),
        prCount: 0,
        caloriesBurned: Math.round((duration / 60) * 7.5),
        notes: sessionData.workoutNotes
      });
    }

    // Sort sessions chronologically descending (newest first)
    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalSets = sessions.reduce(
      (sum, s) => sum + s.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0),
      0
    );

    return {
      success: true,
      message: `Successfully parsed ${sessions.length} sessions (${totalSets} sets) from ${detectedFormat}.`,
      detectedFormat,
      sessionsImported: sessions.length,
      setsImported: totalSets,
      prsUpdated: 0,
      sessions: sessions
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to parse CSV file.',
      detectedFormat: 'Error',
      sessionsImported: 0,
      setsImported: 0,
      prsUpdated: 0,
      sessions: []
    };
  }
}

/**
 * Computes updated Personal Records (PRRecord[]) across all workouts.
 */
export function computePRsFromSessions(sessions: WorkoutSession[], existingPRs: PRRecord[] = []): PRRecord[] {
  const prMap = new Map<string, PRRecord>();

  // Seed with existing PRs
  for (const pr of existingPRs) {
    const key = `${pr.exerciseId || pr.exerciseName.toLowerCase()}___${pr.type}`;
    prMap.set(key, { ...pr });
  }

  for (const session of sessions) {
    for (const ex of session.exercises) {
      const exId = ex.exerciseId || ex.name.toLowerCase();

      for (const st of ex.sets) {
        if (!st.completed) continue;

        // 1RM PR
        if (st.weightKg > 0 && st.reps > 0) {
          const est1RM = Math.round(st.weightKg * (1 + st.reps / 30) * 10) / 10;
          const key1RM = `${exId}___1RM`;
          const current1RM = prMap.get(key1RM);
          if (!current1RM || est1RM > current1RM.value) {
            prMap.set(key1RM, {
              id: `pr-1rm-${exId}`,
              exerciseId: exId,
              exerciseName: ex.name,
              type: '1RM',
              value: est1RM,
              reps: st.reps,
              date: session.date
            });
          }

          // Max Weight PR
          const keyMaxW = `${exId}___MaxWeight`;
          const currentMaxW = prMap.get(keyMaxW);
          if (!currentMaxW || st.weightKg > currentMaxW.value) {
            prMap.set(keyMaxW, {
              id: `pr-mw-${exId}`,
              exerciseId: exId,
              exerciseName: ex.name,
              type: 'MaxWeight',
              value: st.weightKg,
              reps: st.reps,
              date: session.date
            });
          }
        }

        // Distance PR
        if (st.distanceKm && st.distanceKm > 0) {
          const keyDist = `${exId}___MaxDistance`;
          const currentDist = prMap.get(keyDist);
          if (!currentDist || st.distanceKm > currentDist.value) {
            prMap.set(keyDist, {
              id: `pr-dist-${exId}`,
              exerciseId: exId,
              exerciseName: ex.name,
              type: 'MaxDistance',
              value: st.distanceKm,
              date: session.date
            });
          }
        }

        // Duration PR
        if (st.durationSeconds && st.durationSeconds > 0) {
          const keyDur = `${exId}___MaxDuration`;
          const currentDur = prMap.get(keyDur);
          if (!currentDur || st.durationSeconds > currentDur.value) {
            prMap.set(keyDur, {
              id: `pr-dur-${exId}`,
              exerciseId: exId,
              exerciseName: ex.name,
              type: 'MaxDuration',
              value: st.durationSeconds,
              date: session.date
            });
          }
        }

        // Fastest Pace PR (distance_time)
        if (st.distanceKm && st.distanceKm > 0 && st.durationSeconds && st.durationSeconds > 0) {
          const pace = Math.round(st.durationSeconds / st.distanceKm);
          const keyPace = `${exId}___FastestPace`;
          const currentPace = prMap.get(keyPace);
          if (!currentPace || pace < currentPace.value) {
            prMap.set(keyPace, {
              id: `pr-pace-${exId}`,
              exerciseId: exId,
              exerciseName: ex.name,
              type: 'FastestPace',
              value: pace,
              date: session.date
            });
          }
        }
      }
    }
  }

  return Array.from(prMap.values());
}
