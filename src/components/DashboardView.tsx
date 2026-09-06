import React, { useState, useMemo } from 'react';
import type {
  WorkoutSession,
  Routine,
  UserSettings,
  MuscleRecoveryState,
  PRRecord,
  MesocycleBlock
} from '../types/gym';
import { MuscleRecoveryHeatmap } from './MuscleRecoveryHeatmap';
import { MesocycleCard } from './MesocycleCard';
import { kgToLbs, calculateMuscleWeeklySets } from '../engine/overloadEngine';
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
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DashboardViewProps {
  routines: Routine[];
  historySessions: WorkoutSession[];
  recoveryStates: MuscleRecoveryState[];
  prs: PRRecord[];
  settings: UserSettings;
  mesocycleBlock: MesocycleBlock;
  onStartRoutine: (routine: Routine) => void;
  onNavigateTab: (tab: any) => void;
  onUpdateMesocycle: (updated: MesocycleBlock) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  routines,
  historySessions,
  recoveryStates,
  prs,
  settings,
  mesocycleBlock,
  onStartRoutine,
  onNavigateTab,
  onUpdateMesocycle
}) => {
  const [primerData, setPrimerData] = useState<{
    headline: string;
    focusPoints: string[];
    recoveryNote: string;
  } | null>(null);
  const [loadingPrimer, setLoadingPrimer] = useState(false);
  const [showAllLandmarks, setShowAllLandmarks] = useState(false);

  // Weekly hypertrophy volume landmarks (MEV, MAV, MRV)
  const weeklyLandmarks = useMemo(() => {
    return calculateMuscleWeeklySets(historySessions, 7);
  }, [historySessions]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-volt)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Hypertrophy & Progressive Overload
            </span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', marginTop: 2, lineHeight: 1.25 }}>
              Ready to Overload, {settings.userName}?
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              Progressive overload targets calculated. Lift with mechanical tension today.
            </p>
          </div>

          <div
            style={{
              flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.16) 0%, rgba(0, 229, 255, 0.08) 100%)',
              border: '1px solid rgba(0, 245, 155, 0.4)',
              padding: '7px 14px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 12px rgba(0, 245, 155, 0.15)'
            }}
          >
            <Flame size={15} color="var(--accent-volt)" fill="var(--accent-volt)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', letterSpacing: '0.2px' }}>
              <strong style={{ color: 'var(--accent-volt)', fontWeight: 900, fontSize: '0.88rem' }}>
                {recentSessions.length}
              </strong>{' '}
              {recentSessions.length === 1 ? 'Day' : 'Days'} This Wk
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

      {/* Mesocycle Periodization & Auto-Deload HUD */}
      <MesocycleCard
        mesocycleBlock={mesocycleBlock}
        workouts={historySessions}
        onUpdateMesocycle={onUpdateMesocycle}
      />

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

      {/* Weekly Hypertrophy Volume Landmarks Card (MEV / MAV / MRV) */}
      <div className="gym-card">
        <div className="section-header" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="var(--accent-volt)" />
            <h3 className="section-title" style={{ margin: 0 }}>Weekly Hypertrophy Volume</h3>
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--accent-volt)',
              background: 'rgba(0, 245, 155, 0.12)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            MEV · MAV · MRV
          </span>
        </div>

        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.4 }}>
          Weekly working sets mapped against hypertrophy thresholds. Aim for <strong style={{ color: 'var(--accent-volt)' }}>10–18 sets</strong> (Optimal Growth) per target muscle.
        </p>

        {/* Landmarks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {weeklyLandmarks
            .filter((lm) => showAllLandmarks || lm.sets > 0)
            .slice(0, showAllLandmarks ? undefined : 6)
            .map((lm) => {
              const maxTarget = 20;
              const fillPct = Math.min(100, (lm.sets / maxTarget) * 100);

              return (
                <div
                  key={lm.muscle}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#fff' }}>
                        {lm.muscle}
                      </span>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          background: `${lm.color}22`,
                          color: lm.color,
                          border: `1px solid ${lm.color}44`
                        }}
                      >
                        {lm.status === 'Optimal Growth' ? '🎯 Optimal Growth' : lm.status}
                      </span>
                    </div>

                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800, color: lm.color }}>
                      {lm.sets} <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ 18 MAV</span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div
                    style={{
                      height: 6,
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${fillPct}%`,
                        background: lm.color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease-out',
                        boxShadow: `0 0 8px ${lm.color}66`
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Toggle Show All / Show Active */}
        <button
          className="btn-secondary"
          style={{ width: '100%', marginTop: 12, padding: '8px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => {
            setShowAllLandmarks(!showAllLandmarks);
            triggerHaptic('light', settings.vibrationEnabled);
          }}
        >
          {showAllLandmarks ? (
            <>
              <ChevronUp size={14} /> Show Active Muscles Only
            </>
          ) : (
            <>
              <ChevronDown size={14} /> View All 11 Muscle Volume Targets
            </>
          )}
        </button>
      </div>

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
