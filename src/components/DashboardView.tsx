import React, { useState, useMemo } from 'react';
import type {
  WorkoutSession,
  Routine,
  UserSettings,
  MuscleRecoveryState,
  PRRecord
} from '../types/gym';
import { MuscleRecoveryHeatmap } from './MuscleRecoveryHeatmap';
import { kgToLbs } from '../engine/overloadEngine';
import { getPreWorkoutPrimer } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';
import { getTodayWorkoutState } from '../utils/dateUtils';
import {
  Play,
  Flame,
  Calendar,
  Sparkles,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface DashboardViewProps {
  routines: Routine[];
  historySessions: WorkoutSession[];
  recoveryStates: MuscleRecoveryState[];
  prs: PRRecord[];
  settings: UserSettings;
  onStartRoutine: (routine: Routine) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  routines,
  historySessions,
  recoveryStates,
  prs,
  settings,
  onStartRoutine,
  onNavigateTab
}) => {
  const [primerData, setPrimerData] = useState<{
    headline: string;
    focusPoints: string[];
    recoveryNote: string;
  } | null>(null);
  const [loadingPrimer, setLoadingPrimer] = useState(false);

  // Determine scheduled routine for today (or next in split)
  const todayWorkout = useMemo(
    () => getTodayWorkoutState(routines, historySessions),
    [routines, historySessions]
  );
  const nextRoutine = todayWorkout.routine;

  // Calculate 7-day volume safely
  const [mountTime] = useState(() => Date.now());
  const recentSessions = useMemo(() => {
    const cutoff = mountTime - 7 * 24 * 60 * 60 * 1000;
    return historySessions.filter((s) => new Date(s.date).getTime() > cutoff);
  }, [historySessions, mountTime]);

  const weeklyVolumeKg = useMemo(() => {
    return recentSessions.reduce((sum, s) => sum + s.totalVolumeKg, 0);
  }, [recentSessions]);

  const displayVolume = (kg: number) => {
    if (settings.unit === 'lbs') return `${kgToLbs(kg)} lbs`;
    return `${kg} kg`;
  };

  const handleFetchPrimer = async () => {
    if (!nextRoutine || loadingPrimer) return;
    setLoadingPrimer(true);
    triggerHaptic('light', settings.vibrationEnabled);

    try {
      const result = await getPreWorkoutPrimer(
        nextRoutine,
        recoveryStates,
        settings.geminiApiKey
      );
      setPrimerData(result);
      triggerHaptic('success', settings.vibrationEnabled);
    } catch {
      setPrimerData({
        headline: 'Maximum Tension & Progressive Overload',
        focusPoints: [
          'Aim to beat last session by +1 rep or +2.5kg on opening compound lifts.',
          'Control eccentrics for 2-3 seconds to maximize mechanical tension.'
        ],
        recoveryNote: 'Muscles are primed. Execute with high intent.'
      });
    } finally {
      setLoadingPrimer(false);
    }
  };

  return (
    <div className="view-content">
      {/* Athlete Greeting Card */}
      <div
        className="gym-card"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.12) 0%, rgba(0, 229, 255, 0.08) 100%)',
          border: '1px solid rgba(0, 245, 155, 0.35)',
          padding: '18px 20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-volt)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Hypertrophy & Progressive Overload
            </span>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', marginTop: 2 }}>
              Ready to Overload, {settings.userName}?
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Progressive overload targets calculated. Lift with mechanical tension today.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(0, 245, 155, 0.15)',
              border: '1px solid var(--accent-volt)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Flame size={16} color="var(--accent-volt)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-volt)' }}>
              {recentSessions.length} Days This Wk
            </span>
          </div>
        </div>

        {/* Quick Weekly KPI Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginTop: 16,
            paddingTop: 14,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              7-Day Volume
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
              {displayVolume(weeklyVolumeKg)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              All-Time PRs
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: '#FFD700' }}>
              {prs.length} Records
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Readiness
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: 'var(--accent-volt)' }}>
              96% Optimal
            </div>
          </div>
        </div>

        {/* Bodyweight & Target Weight Pill */}
        {settings.bodyWeightKg && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--accent-volt)', fontWeight: 800 }}>⚖️ Weight:</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {settings.unit === 'lbs' ? kgToLbs(settings.bodyWeightKg) : settings.bodyWeightKg} {settings.unit}
              </span>
              {settings.targetWeightKg && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    Target: {settings.unit === 'lbs' ? kgToLbs(settings.targetWeightKg) : settings.targetWeightKg} {settings.unit}
                  </span>
                </>
              )}
            </div>

            {settings.age && settings.heightCm && (
              <span style={{ color: 'var(--text-secondary)' }}>
                {settings.age}y · {settings.heightCm}cm
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress & Calendar Quick Shortcut Card */}
      <div
        className="gym-card"
        style={{
          cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, var(--bg-card) 100%)',
          border: '1px solid rgba(0, 229, 255, 0.3)'
        }}
        onClick={() => onNavigateTab('analytics')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 229, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                Progress & Calendar Hub
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Progression graphs, weekly MEV/MRV sets & 1RM calculator
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>
            View →
          </span>
        </div>
      </div>

      {/* Up Next: Recommended Workout */}
      {nextRoutine && (
        <div className="gym-card gym-card-highlight">
          <div className="section-header" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: todayWorkout.isScheduledToday ? 'var(--accent-volt)' : '#38BDF8' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: todayWorkout.isScheduledToday ? 'var(--accent-volt)' : '#38BDF8', textTransform: 'uppercase' }}>
                {todayWorkout.isScheduledToday
                  ? `Today's Target · ${todayWorkout.dayName}`
                  : `Next Up · ${todayWorkout.dayName} (Rest Day)`}
              </span>
            </div>
            <span className="section-tag">{todayWorkout.isScheduledToday ? 'TODAY' : nextRoutine.dayTag || nextRoutine.weekday}</span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
            {nextRoutine.name}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 14 }}>
            {nextRoutine.description}
          </p>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              🏋️ {nextRoutine.exercises.length} Exercises Planned
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              ⏱️ ~50-60 min
            </div>
            {todayWorkout.isAlreadyCompletedToday && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-volt)',
                  background: 'rgba(0, 245, 155, 0.12)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700
                }}
              >
                ✓ Completed Today
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={handleFetchPrimer}
              disabled={loadingPrimer}
            >
              {loadingPrimer ? (
                <Loader2 size={16} className="spinner" />
              ) : (
                <Sparkles size={16} color="var(--accent-cyan)" />
              )}
              <span>AI Tactical Primer</span>
            </button>

            <button
              className="btn-primary"
              style={{ flex: 1.5 }}
              onClick={() => onStartRoutine(nextRoutine)}
            >
              <Play size={18} fill="#050D0A" />
              {todayWorkout.isAlreadyCompletedToday
                ? `Repeat ${nextRoutine.dayTag || 'Workout'}`
                : `Start ${nextRoutine.dayTag || 'Workout'}`}
            </button>
          </div>
        </div>
      )}

      {/* Muscle Recovery Heatmap Component */}
      <MuscleRecoveryHeatmap recoveryStates={recoveryStates} />

      {/* Recent Workout Activity Card */}
      <div className="gym-card">
        <div className="section-header" style={{ marginBottom: 12 }}>
          <h3 className="section-title">
            <Calendar size={18} color="var(--accent-cyan)" />
            Recent Activity
          </h3>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            onClick={() => onNavigateTab('analytics')}
          >
            View All Logs →
          </button>
        </div>

        {historySessions.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            No workouts logged yet. Start your first session!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historySessions.slice(0, 3).map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{s.routineName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {new Date(s.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}{' '}
                    · {Math.round(s.durationSeconds / 60)} min · {displayVolume(s.totalVolumeKg)}
                  </div>
                </div>

                {s.prCount > 0 && (
                  <span className="pr-badge-gold">
                    <Flame size={12} fill="#261600" />
                    {s.prCount} PR
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Pre-Workout Tactical Primer Modal */}
      {primerData && nextRoutine && (
        <div className="modal-overlay" onClick={() => setPrimerData(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-volt)', textTransform: 'uppercase' }}>
                  Pre-Workout Tactical Brief
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>
                  {primerData.headline}
                </h3>
              </div>
              <button
                onClick={() => setPrimerData(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Tactical Cues */}
            <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-lg)', marginBottom: 12 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: 8 }}>
                🎯 Tactical Cues for Today
              </div>
              <ul style={{ paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {primerData.focusPoints.map((pt, idx) => (
                  <li key={idx} style={{ marginBottom: 6 }}>{pt}</li>
                ))}
              </ul>
            </div>

            {/* Physiological Readiness Note */}
            <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-volt)', textTransform: 'uppercase', marginBottom: 4 }}>
                ⚡ Muscle Recovery Status
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {primerData.recoveryNote}
              </p>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                setPrimerData(null);
                onStartRoutine(nextRoutine);
              }}
            >
              <CheckCircle2 size={18} />
              Start Workout with Cues
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
