import React, { useState, useMemo, useEffect } from 'react';
import type {
  WorkoutSession,
  Routine,
  PRRecord,
  UserSettings,
  WorkoutExercise,
  MesocycleBlock
} from './types/gym';
import { StorageService } from './db/storage';
import { calculateMuscleRecovery, calculateProgressiveOverload } from './engine/overloadEngine';
import { calculateSessionTotalCalories } from './engine/calorieEngine';
import { getExerciseTrackingType } from './utils/trackingTypeUtils';
import { EXERCISE_LIBRARY } from './data/exerciseLibrary';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import type { NavTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { ActiveWorkoutView } from './components/ActiveWorkoutView';
import { RoutinesView } from './components/RoutinesView';
import { AnalyticsView } from './components/AnalyticsView';
import { AICoachView } from './components/AICoachView';
import { WorkoutSummaryModal } from './components/WorkoutSummaryModal';
import { SettingsModal } from './components/SettingsModal';
import { RestTimerFloating } from './components/RestTimerFloating';
import { getTodayWorkoutState } from './utils/dateUtils';
import { Dumbbell, Play, CheckCircle2 } from 'lucide-react';
const ActiveWorkoutBanner: React.FC<{
  session: WorkoutSession;
  onResume: () => void;
}> = ({ session, onResume }) => {
  const [elapsed, setElapsed] = useState(() => {
    const startMs = session.startTime || (session.date ? new Date(session.date).getTime() : 0);
    return startMs ? Math.max(0, Math.floor((Date.now() - startMs) / 1000)) : session.durationSeconds || 0;
  });

  useEffect(() => {
    const updateElapsed = () => {
      const startMs = session.startTime || (session.date ? new Date(session.date).getTime() : 0);
      if (startMs) {
        setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
      }
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [session.startTime, session.date]);

  const setsLogged = session.exercises.reduce(
    (c, e) => c + e.sets.filter((s) => s.completed).length,
    0
  );

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="active-session-banner" onClick={onResume}>
      <div className="banner-left">
        <div className="banner-pulse-dot" />
        <div>
          <div className="banner-title">{session.routineName}</div>
          <div className="banner-meta">
            {setsLogged} sets logged · ⏱️ {formatTimer(elapsed)} · Tap to resume
          </div>
        </div>
      </div>
      <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
        Resume
      </button>
    </div>
  );
};

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => StorageService.getWorkouts());
  const [routines, setRoutines] = useState<Routine[]>(() => StorageService.getRoutines());
  const [prs, setPrs] = useState<PRRecord[]>(() => StorageService.getPRs());
  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getSettings());
  const [mesocycleBlock, setMesocycleBlock] = useState<MesocycleBlock>(() => StorageService.getMesocycleBlock());
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() => {
    const raw = StorageService.getActiveWorkout();
    if (!raw) return null;
    const startTime = raw.startTime || (raw.date ? new Date(raw.date).getTime() : Date.now());
    const sanitizedExercises = raw.exercises.map((ex) => {
      const meta = EXERCISE_LIBRARY.find(
        (e) => e.id.toLowerCase() === ex.exerciseId.toLowerCase() || e.name.toLowerCase() === ex.name.toLowerCase()
      );
      if (meta) {
        return {
          ...ex,
          name: meta.name,
          muscleGroup: meta.muscleGroup,
          equipment: meta.equipment
        };
      }
      return ex;
    });
    return { ...raw, startTime, exercises: sanitizedExercises };
  });
  const [justCompletedSession, setJustCompletedSession] = useState<WorkoutSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Compute today's scheduled workout from current day of week
  const todayWorkout = useMemo(
    () => getTodayWorkoutState(routines, workouts),
    [routines, workouts]
  );

  // Save active workout whenever it updates
  const handleUpdateActiveSession = (updated: WorkoutSession) => {
    setActiveSession(updated);
    StorageService.saveActiveWorkout(updated);
  };

  const handleUpdateMesocycle = (updated: MesocycleBlock) => {
    setMesocycleBlock(updated);
    StorageService.saveMesocycleBlock(updated);
  };

  // Start a new workout session from a routine template
  const handleStartRoutine = (routine: Routine) => {
    // Generate exercises with progressive overload targets
    const workoutExercises: WorkoutExercise[] = routine.exercises.map((template, idx) => {
      const exMeta = EXERCISE_LIBRARY.find(
        (e) => e.id.toLowerCase() === template.exerciseId.toLowerCase() || e.name.toLowerCase() === template.exerciseId.toLowerCase()
      );
      const overload = calculateProgressiveOverload(
        template.exerciseId,
        template.targetRepRange,
        workouts
      );

      const trackingType = template.trackingType || getExerciseTrackingType(exMeta);
      const isWeight = trackingType === 'weight_reps';
      const isCardioDist = trackingType === 'distance_time';
      const isTimed = trackingType === 'time_only';

      return {
        id: `we-${Date.now()}-${idx}`,
        exerciseId: exMeta?.id || template.exerciseId,
        name: exMeta?.name || template.exerciseId.replace(/^db-/, 'Dumbbell ').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        muscleGroup: exMeta?.muscleGroup || 'Chest',
        equipment: exMeta?.equipment || 'Barbell',
        trackingType,
        restSeconds: template.restSeconds,
        sets: Array.from({ length: template.defaultSets }).map((_, sIdx) => ({
          id: `set-${Date.now()}-${idx}-${sIdx + 1}`,
          setNumber: sIdx + 1,
          type: 'working',
          weightKg: isWeight ? (overload.currentWeight > 0 ? overload.targetWeight : (template.defaultWeightKg || overload.targetWeight || 20)) : 0,
          reps: isCardioDist || isTimed ? 0 : (overload.targetReps || template.targetRepRange[0] || 10),
          targetWeightKg: isWeight ? (overload.currentWeight > 0 ? overload.targetWeight : (template.defaultWeightKg || overload.targetWeight)) : 0,
          targetReps: isCardioDist || isTimed ? 0 : (overload.targetReps || template.targetRepRange[0] || 10),
          distanceKm: isCardioDist ? (template.defaultDistanceKm || 1.0) : undefined,
          durationSeconds: isCardioDist ? (template.defaultDurationSeconds || 900) : isTimed ? (template.defaultDurationSeconds || 45) : undefined,
          completed: false
        }))
      };
    });

    const now = Date.now();
    const newSession: WorkoutSession = {
      id: `session-${now}`,
      routineId: routine.id,
      routineName: routine.name,
      dayTag: routine.dayTag,
      date: new Date(now).toISOString(),
      startTime: now,
      durationSeconds: 0,
      totalVolumeKg: 0,
      prCount: 0,
      exercises: workoutExercises
    };

    setActiveSession(newSession);
    StorageService.saveActiveWorkout(newSession);
    setCurrentTab('workout');
  };

  // Finish and save workout
  const handleFinishWorkout = (completed: WorkoutSession) => {
    // Caloric expenditure & mesocycle periodization tagging
    const cals = calculateSessionTotalCalories(completed, settings.bodyWeightKg);
    completed.caloriesBurned = cals.totalCalories;
    completed.mesocycleWeek = mesocycleBlock.currentWeek;
    const currentWeekPhase = mesocycleBlock.weeks.find((w) => w.weekNumber === mesocycleBlock.currentWeek);
    completed.isDeload = currentWeekPhase?.phaseName === 'Deload';

    StorageService.addWorkout(completed);
    StorageService.saveActiveWorkout(null);

    // Record any new PRs
    completed.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.isPR && set.weightKg > 0) {
          const est1RM = set.weightKg * (1 + set.reps / 30);
          StorageService.addPR({
            id: `pr-${Date.now()}-${Math.random()}`,
            exerciseId: ex.exerciseId,
            exerciseName: ex.name,
            type: '1RM',
            value: Math.round(est1RM * 10) / 10,
            reps: set.reps,
            date: new Date().toISOString()
          });
        }
      });
    });

    // Refresh state
    const updatedWorkouts = StorageService.getWorkouts();
    setWorkouts(updatedWorkouts);
    setPrs(StorageService.getPRs());
    setActiveSession(null);
    setJustCompletedSession(completed);
    setCurrentTab('dashboard');
  };

  const handleCancelWorkout = () => {
    if (window.confirm('Are you sure you want to discard this active workout?')) {
      setActiveSession(null);
      StorageService.saveActiveWorkout(null);
      setCurrentTab('dashboard');
    }
  };

  const handleDeleteWorkout = (id: string) => {
    const updated = StorageService.deleteWorkout(id);
    setWorkouts(updated);
  };

  const handleToggleUnit = () => {
    const newUnit = settings.unit === 'kg' ? 'lbs' : 'kg';
    const updated = { ...settings, unit: newUnit as 'kg' | 'lbs' };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleSaveSettings = (updated: UserSettings) => {
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleResetData = () => {
    localStorage.clear();
    setWorkouts(StorageService.getWorkouts());
    setPrs(StorageService.getPRs());
    setMesocycleBlock(StorageService.getMesocycleBlock());
    setActiveSession(null);
    StorageService.saveActiveWorkout(null);
  };

  // Compute live recovery state for all muscle groups
  const recoveryStates = calculateMuscleRecovery(workouts);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        settings={settings}
        onToggleUnit={handleToggleUnit}
        onOpenSettings={() => setShowSettings(true)}
        prCount={prs.length}
      />

      {/* Active Workout Banner (if workout in progress and not currently on workout tab) */}
      {activeSession && currentTab !== 'workout' && (
        <ActiveWorkoutBanner
          session={activeSession}
          onResume={() => setCurrentTab('workout')}
        />
      )}

      {/* Main Tab Routing */}
      <main style={{ flex: 1 }}>
        {currentTab === 'dashboard' && (
          <DashboardView
            routines={routines}
            historySessions={workouts}
            recoveryStates={recoveryStates}
            prs={prs}
            settings={settings}
            mesocycleBlock={mesocycleBlock}
            activeSession={activeSession}
            onStartRoutine={handleStartRoutine}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onUpdateMesocycle={handleUpdateMesocycle}
          />
        )}

        {currentTab === 'workout' && (
          activeSession ? (
            <ActiveWorkoutView
              session={activeSession}
              historySessions={workouts}
              existingPRs={prs}
              settings={settings}
              mesocycleBlock={mesocycleBlock}
              onUpdateSession={handleUpdateActiveSession}
              onFinishWorkout={handleFinishWorkout}
              onCancelWorkout={handleCancelWorkout}
            />
          ) : (
            <div className="view-content" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  color: 'var(--accent-volt)',
                  boxShadow: '0 0 24px rgba(0, 245, 155, 0.2)'
                }}
              >
                <Dumbbell size={28} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>No Active Workout</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 20 }}>
                {todayWorkout.isScheduledToday
                  ? `Today is ${todayWorkout.formattedDate} · Scheduled Split Session`
                  : `Today is ${todayWorkout.formattedDate} · Scheduled Rest & Recovery Day`}
              </p>

              {/* Today's Target Card */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: todayWorkout.isScheduledToday ? 'var(--accent-volt)' : '#38BDF8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: todayWorkout.isScheduledToday ? 'rgba(0, 245, 155, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {todayWorkout.isScheduledToday
                      ? `📅 TODAY · ${todayWorkout.dayName.toUpperCase()}`
                      : `🧘 ${todayWorkout.dayName.toUpperCase()} · REST DAY`}
                  </span>

                  {todayWorkout.isAlreadyCompletedToday && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--accent-volt)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <CheckCircle2 size={13} /> Completed Today
                    </span>
                  )}
                </div>

                {todayWorkout.routine ? (
                  <>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                      {todayWorkout.routine.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {todayWorkout.routine.description}
                    </p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          background: 'var(--bg-surface)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        🏋️ {todayWorkout.routine.exercises.length} Exercises
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          background: 'var(--bg-surface)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        ⏱️ ~45–60 min
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          background: 'var(--bg-surface)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        ⚡ {todayWorkout.routine.splitType}
                      </span>
                    </div>

                    <button
                      className="btn-primary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onClick={() => handleStartRoutine(todayWorkout.routine)}
                    >
                      <Play size={18} fill="#050D0A" />
                      {todayWorkout.isAlreadyCompletedToday
                        ? `Repeat ${todayWorkout.routine.dayTag || todayWorkout.dayName} Workout`
                        : todayWorkout.isScheduledToday
                        ? `Start ${todayWorkout.routine.dayTag || todayWorkout.dayName} Workout`
                        : `Train Anyway: Start ${todayWorkout.routine.dayTag || todayWorkout.routine.name}`}
                    </button>
                  </>
                ) : (
                  <>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                      No Routines Configured
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                      You have a fresh slate. Build a custom routine using any of the 1,300+ WorkoutX exercises!
                    </p>
                    <button
                      className="btn-primary"
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onClick={() => setCurrentTab('routines')}
                    >
                      Go to Routines Split →
                    </button>
                  </>
                )}
              </div>

              {/* Option to choose other day */}
              <button
                className="btn-secondary"
                style={{ width: '100%', fontSize: '0.82rem' }}
                onClick={() => setCurrentTab('routines')}
              >
                Browse All Workout Splits & Days
              </button>
            </div>
          )
        )}

        {currentTab === 'routines' && (
          <RoutinesView
            routines={routines}
            onStartRoutine={handleStartRoutine}
            onUpdateRoutines={(updated) => {
              setRoutines(updated);
              StorageService.saveRoutines(updated);
            }}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            historySessions={workouts}
            prs={prs}
            settings={settings}
            onDeleteSession={handleDeleteWorkout}
          />
        )}

        {currentTab === 'coach' && (
          <AICoachView
            settings={settings}
            historySessions={workouts}
            prs={prs}
            routines={routines}
            onUpdateRoutines={(updated) => {
              setRoutines(updated);
              StorageService.saveRoutines(updated);
            }}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            activeSession={activeSession}
            onUpdateActiveSession={handleUpdateActiveSession}
            recoveryStates={recoveryStates}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        hasActiveWorkout={activeSession !== null}
      />

      {/* Global Persistent Floating Rest Timer */}
      {activeSession?.restTimer && (
        <RestTimerFloating
          endsAt={activeSession.restTimer.endsAt}
          totalSeconds={activeSession.restTimer.totalSeconds}
          soundEnabled={settings.soundEnabled}
          onFinish={() => {
            handleUpdateActiveSession({ ...activeSession, restTimer: null });
          }}
          onCancel={() => {
            handleUpdateActiveSession({ ...activeSession, restTimer: null });
          }}
          onAdjust={(newEndsAt, newTotal) => {
            handleUpdateActiveSession({
              ...activeSession,
              restTimer: { endsAt: newEndsAt, totalSeconds: newTotal }
            });
          }}
        />
      )}

      {/* Post-Workout AI Debrief & Celebration Modal */}
      {justCompletedSession && (
        <WorkoutSummaryModal
          session={justCompletedSession}
          settings={settings}
          mesocycleBlock={mesocycleBlock}
          onClose={() => setJustCompletedSession(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onResetData={handleResetData}
        />
      )}
    </div>
  );
}

export default App;
