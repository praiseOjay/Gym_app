import { useState } from 'react';
import type {
  WorkoutSession,
  Routine,
  PRRecord,
  UserSettings,
  WorkoutExercise
} from './types/gym';
import { StorageService } from './db/storage';
import { calculateMuscleRecovery, calculateProgressiveOverload } from './engine/overloadEngine';
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
import { Dumbbell, Play } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [workouts, setWorkouts] = useState<WorkoutSession[]>(() => StorageService.getWorkouts());
  const [routines, setRoutines] = useState<Routine[]>(() => StorageService.getRoutines());
  const [prs, setPrs] = useState<PRRecord[]>(() => StorageService.getPRs());
  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getSettings());
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() => StorageService.getActiveWorkout());
  const [justCompletedSession, setJustCompletedSession] = useState<WorkoutSession | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Save active workout whenever it updates
  const handleUpdateActiveSession = (updated: WorkoutSession) => {
    setActiveSession(updated);
    StorageService.saveActiveWorkout(updated);
  };

  // Start a new workout session from a routine template
  const handleStartRoutine = (routine: Routine) => {
    // Generate exercises with progressive overload targets
    const workoutExercises: WorkoutExercise[] = routine.exercises.map((template, idx) => {
      const exMeta = EXERCISE_LIBRARY.find((e) => e.id === template.exerciseId);
      const overload = calculateProgressiveOverload(
        template.exerciseId,
        template.targetRepRange,
        workouts
      );

      return {
        id: `we-${Date.now()}-${idx}`,
        exerciseId: template.exerciseId,
        name: exMeta?.name || template.exerciseId,
        muscleGroup: exMeta?.muscleGroup || 'Chest',
        equipment: exMeta?.equipment || 'Barbell',
        restSeconds: template.restSeconds,
        sets: Array.from({ length: template.defaultSets }).map((_, sIdx) => ({
          id: `set-${Date.now()}-${idx}-${sIdx + 1}`,
          setNumber: sIdx + 1,
          type: sIdx === 0 ? 'working' : 'working',
          weightKg: overload.currentWeight > 0 ? overload.targetWeight : (template.defaultWeightKg || overload.targetWeight || 20),
          reps: overload.targetReps || template.targetRepRange[0],
          targetWeightKg: overload.currentWeight > 0 ? overload.targetWeight : (template.defaultWeightKg || overload.targetWeight),
          targetReps: overload.targetReps || template.targetRepRange[0],
          completed: false
        }))
      };
    });

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineId: routine.id,
      routineName: routine.name,
      dayTag: routine.dayTag,
      date: new Date().toISOString(),
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
        <div
          className="active-session-banner"
          onClick={() => setCurrentTab('workout')}
        >
          <div className="banner-left">
            <div className="banner-pulse-dot" />
            <div>
              <div className="banner-title">{activeSession.routineName}</div>
              <div className="banner-meta">
                {activeSession.exercises.reduce(
                  (c, e) => c + e.sets.filter((s) => s.completed).length,
                  0
                )}{' '}
                sets logged · Tap to resume
              </div>
            </div>
          </div>
          <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            Resume
          </button>
        </div>
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
            onStartRoutine={handleStartRoutine}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'workout' && (
          activeSession ? (
            <ActiveWorkoutView
              session={activeSession}
              historySessions={workouts}
              existingPRs={prs}
              settings={settings}
              onUpdateSession={handleUpdateActiveSession}
              onFinishWorkout={handleFinishWorkout}
              onCancelWorkout={handleCancelWorkout}
            />
          ) : (
            <div className="view-content" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--accent-volt)'
                }}
              >
                <Dumbbell size={32} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>No Active Workout</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 24 }}>
                Choose a session from your 5-Day Hypertrophy split or start today's recommended workout.
              </p>

              {routines.length > 0 && (
                <button
                  className="btn-primary"
                  style={{ margin: '0 auto', maxWidth: 280 }}
                  onClick={() => handleStartRoutine(routines[0])}
                >
                  <Play size={18} fill="#050D0A" />
                  Start {routines[0].dayTag} Workout
                </button>
              )}
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
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        hasActiveWorkout={activeSession !== null}
      />

      {/* Post-Workout AI Debrief & Celebration Modal */}
      {justCompletedSession && (
        <WorkoutSummaryModal
          session={justCompletedSession}
          settings={settings}
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
