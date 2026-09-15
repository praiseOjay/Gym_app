import React, { useState, useMemo } from 'react';
import type { WorkoutSession, PRRecord, UserSettings, BodyWeightEntry } from '../types/gym';
import {
  kgToLbs,
  lbsToKg,
  calculateMuscleWeeklySets,
  calculateRepMaxTable,
  calculate1RM
} from '../engine/overloadEngine';
import { StorageService } from '../db/storage';
import { triggerHaptic } from '../utils/haptics';
import { WorkoutCalendar } from './WorkoutCalendar';
import { ProgressGraph } from './ProgressGraph';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import {
  formatSetPerformance,
  getExerciseTrackingType,
  displayDistance,
  distanceUnitLabel,
  formatDuration
} from '../utils/trackingTypeUtils';
import {
  TrendingUp,
  Trophy,
  Flame,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Calculator,
  Scale,
  Plus,
  BookOpen,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { WorkoutImportModal } from './WorkoutImportModal';

interface AnalyticsViewProps {
  historySessions: WorkoutSession[];
  prs: PRRecord[];
  settings: UserSettings;
  onDeleteSession?: (id: string, index?: number) => void;
}

type TabType = 'overview' | 'muscleVolume' | 'graphs' | 'calendar' | 'prs' | 'tools';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  historySessions,
  prs,
  settings,
  onDeleteSession
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [inspectedSession, setInspectedSession] = useState<WorkoutSession | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // 1RM Calculator State
  const [calcWeight, setCalcWeight] = useState<number | string>(100);
  const [calcReps, setCalcReps] = useState<number | string>(8);

  const numericCalcWeight = typeof calcWeight === 'number' ? calcWeight : parseFloat(calcWeight) || 0;
  const numericCalcReps = typeof calcReps === 'number' ? calcReps : parseInt(calcReps, 10) || 1;

  // Bodyweight Weigh-In State
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightEntry[]>(
    StorageService.getBodyWeightLogs()
  );
  const [inputWeight, setInputWeight] = useState<string>('');
  const [inputNote, setInputNote] = useState<string>('');

  const displayVolume = (kg: number) => {
    if (settings.unit === 'lbs') return `${kgToLbs(kg)} lbs`;
    return `${kg} kg`;
  };

  const displayWeight = (kg: number) => {
    if (settings.unit === 'lbs') return `${kgToLbs(kg)} lbs`;
    return `${kg} kg`;
  };

  // Weekly muscle group set volume calculation (MEV / MRV)
  const muscleVolumeStats = useMemo(() => {
    return calculateMuscleWeeklySets(historySessions, 7);
  }, [historySessions]);

  // Real-time 1RM & Rep Max calculations
  const repMaxTable = useMemo(() => {
    return calculateRepMaxTable(numericCalcWeight, numericCalcReps);
  }, [numericCalcWeight, numericCalcReps]);

  const estimated1RM = useMemo(() => {
    return calculate1RM(numericCalcWeight, numericCalcReps);
  }, [numericCalcWeight, numericCalcReps]);

  const handleLogWeighIn = () => {
    const val = parseFloat(inputWeight);
    if (isNaN(val) || val <= 0) return;
    const kg = settings.unit === 'lbs' ? lbsToKg(val) : val;
    const entry = StorageService.addBodyWeightLog(kg, new Date().toISOString(), inputNote.trim() || undefined);
    setBodyWeightLogs([entry, ...bodyWeightLogs]);
    setInputWeight('');
    setInputNote('');
    triggerHaptic('success');
  };

  return (
    <div className="view-content" style={{ paddingBottom: 110 }}>
      {/* Top Section Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <TrendingUp size={20} color="var(--accent-volt)" />
            Progress & Analytics
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Mechanical volume, MEV/MRV muscle sets, calendar & gym tools
          </p>
        </div>
      </div>

      {/* Segmented Sub-Tab Switcher */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
          marginBottom: 14
        }}
      >
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'muscleVolume', label: 'Muscle Sets (MEV/MRV)', icon: Flame },
          { id: 'graphs', label: 'Progression Graph', icon: BarChart3 },
          { id: 'calendar', label: 'Workout Calendar', icon: Calendar },
          { id: 'prs', label: 'PR Hall of Fame', icon: Trophy },
          { id: 'tools', label: 'Gym Tools & 1RM', icon: Calculator }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                background: isActive ? 'rgba(0, 245, 155, 0.18)' : 'var(--bg-card)',
                color: isActive ? 'var(--accent-volt)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--accent-volt)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '7px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW TAB: Graphs + Calendar + Quick PRs */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ProgressGraph
            historySessions={historySessions}
            prs={prs}
            settings={settings}
          />

          <WorkoutCalendar
            historySessions={historySessions}
            settings={settings}
            onSelectSession={(session) => setInspectedSession(session)}
          />

          {prs.length > 0 && (
            <div className="gym-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trophy size={16} color="#FFD700" />
                  <strong style={{ fontSize: '0.9rem', color: '#fff' }}>Recent Personal Records</strong>
                </div>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                  onClick={() => setActiveTab('prs')}
                >
                  View All ({prs.length}) →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {prs.slice(0, 4).map((pr) => (
                  <div
                    key={pr.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pr.exerciseName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 900, color: '#FFD700' }}>
                        {displayWeight(pr.value)}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {pr.type === '1RM' ? 'Est 1RM' : 'Max Wt'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MUSCLE VOLUME MEV/MRV TAB */}
      {activeTab === 'muscleVolume' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            className="gym-card"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.08) 0%, var(--bg-card) 100%)',
              border: '1px solid rgba(0, 245, 155, 0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Flame size={18} color="var(--accent-volt)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Weekly Muscle Volume (7 Days)</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Hypertrophy science benchmarks (Dr. Mike Israetel / RP): <strong>10–18 hard sets per week</strong> is the Maximum Adaptive Volume (MAV) sweetspot for muscle hypertrophy. Warmup sets are excluded.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {muscleVolumeStats.map((item) => {
              const maxScale = 22;
              const percent = Math.min(100, Math.max(4, (item.sets / maxScale) * 100));

              return (
                <div
                  key={item.muscle}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>
                      {item.muscle}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: `${item.color}22`,
                          color: item.color,
                          border: `1px solid ${item.color}44`
                        }}
                      >
                        {item.status}
                      </span>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#fff' }}>
                        {item.sets} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>sets</span>
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bar with Landmarks */}
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: item.color,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>0 sets</span>
                    <span>MEV (6-10)</span>
                    <span>Optimal MAV (10-18)</span>
                    <span>MRV (20+)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GRAPHS ONLY TAB */}
      {activeTab === 'graphs' && (
        <ProgressGraph
          historySessions={historySessions}
          prs={prs}
          settings={settings}
        />
      )}

      {/* CALENDAR ONLY TAB */}
      {activeTab === 'calendar' && (
        <WorkoutCalendar
          historySessions={historySessions}
          settings={settings}
          onSelectSession={(session) => setInspectedSession(session)}
        />
      )}

      {/* PRs HALL OF FAME TAB */}
      {activeTab === 'prs' && (
        <div className="gym-card">
          <div className="section-header" style={{ marginBottom: 12 }}>
            <h3 className="section-title">
              <Trophy size={18} color="#FFD700" />
              PR Hall of Fame
            </h3>
            <span className="pr-badge-gold">
              <Flame size={12} fill="#261600" />
              {prs.length} Records
            </span>
          </div>

          {prs.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              No personal records yet. Log your first working sets to set benchmarks!
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {prs.map((pr) => (
                <div
                  key={pr.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(255, 215, 0, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{pr.exerciseName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {pr.type === '1RM'
                        ? 'Est. 1-Rep Max'
                        : pr.type === 'MaxDistance'
                        ? 'Longest Distance'
                        : pr.type === 'MaxDuration'
                        ? 'Longest Duration'
                        : pr.type === 'FastestPace'
                        ? 'Fastest Pace'
                        : 'Max Working Weight'} ·{' '}
                      {new Date(pr.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#FFD700'
                      }}
                    >
                      {pr.type === 'MaxDistance'
                        ? `${displayDistance(pr.value, settings.unit)} ${distanceUnitLabel(settings.unit)}`
                        : pr.type === 'MaxDuration'
                        ? formatDuration(pr.value)
                        : pr.type === 'FastestPace'
                        ? `${formatDuration(Math.round(pr.value))}/${distanceUnitLabel(settings.unit)}`
                        : displayWeight(pr.value)}
                    </div>
                    {pr.reps && pr.type !== 'MaxDistance' && pr.type !== 'MaxDuration' && pr.type !== 'FastestPace' && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Based on {pr.reps} reps
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GYM TOOLS & 1RM TAB */}
      {activeTab === 'tools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 1RM Calculator */}
          <div className="gym-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Calculator size={18} color="var(--accent-volt)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>1-Rep Max Calculator</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Lift Weight ({settings.unit})
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="set-input-box"
                  style={{ marginTop: 4 }}
                  value={calcWeight}
                  placeholder="100"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  onBlur={() => {
                    if (calcWeight === '' || Number(calcWeight) < 0) {
                      setCalcWeight(100);
                    }
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Reps Performed
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="set-input-box"
                  style={{ marginTop: 4 }}
                  value={calcReps}
                  placeholder="8"
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCalcReps(e.target.value)}
                  onBlur={() => {
                    if (calcReps === '' || Number(calcReps) < 1) {
                      setCalcReps(8);
                    }
                  }}
                />
              </div>
            </div>

            {/* Calculated 1RM Result Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.15) 0%, rgba(0, 229, 255, 0.1) 100%)',
                border: '1px solid var(--accent-volt)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                textAlign: 'center',
                marginBottom: 14
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>
                Estimated 1-Rep Max
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-volt)', margin: '4px 0' }}>
                {displayWeight(estimated1RM)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Derived using combined Epley & Brzycki formulas
              </div>
            </div>

            {/* Rep Max Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                Estimated Repetition Maximums
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {repMaxTable.map((item) => (
                  <div
                    key={item.reps}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                      {item.reps} RM ({item.percentage}%)
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>
                      {displayWeight(item.avgWeight)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RPE & RIR Reference Guide */}
          <div className="gym-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <BookOpen size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>RPE & RIR Training Guide</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem' }}>
              {[
                { rpe: 10, rir: 0, desc: 'Maximum effort. Zero reps left in reserve (True failure)' },
                { rpe: 9.5, rir: '0-1', desc: 'Could not do more reps, but maybe slight weight increase' },
                { rpe: 9, rir: 1, desc: '1 definite rep remaining in reserve' },
                { rpe: 8.5, rir: '1-2', desc: '1 to 2 reps remaining in reserve' },
                { rpe: 8, rir: 2, desc: '2 reps in reserve — optimal sweetspot for mechanical tension' },
                { rpe: 7, rir: 3, desc: '3 reps in reserve — good for speed, warmup, or deload' }
              ].map((item) => (
                <div
                  key={item.rpe}
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: item.rpe >= 9 ? 'var(--accent-crimson)' : 'var(--accent-volt)' }}>
                      RPE {item.rpe}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.desc}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {item.rir} RIR
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bodyweight Weigh-In Logger & History */}
          <div className="gym-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scale size={18} color="var(--accent-amber)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Bodyweight Log</h3>
              </div>
              {settings.targetWeightKg && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                  Target: {displayWeight(settings.targetWeightKg)}
                </span>
              )}
            </div>

            {/* Quick Weigh-In Input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                type="number"
                step="0.1"
                placeholder={`Weight (${settings.unit})`}
                className="set-input-box"
                style={{ flex: 1, textAlign: 'left', padding: '8px 12px' }}
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
              />
              <input
                type="text"
                placeholder="Note (optional)"
                className="set-input-box"
                style={{ flex: 1.5, textAlign: 'left', padding: '8px 12px' }}
                value={inputNote}
                onChange={(e) => setInputNote(e.target.value)}
              />
              <button
                className="btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                onClick={handleLogWeighIn}
              >
                <Plus size={16} /> Log
              </button>
            </div>

            {/* Weigh-In History List */}
            {bodyWeightLogs.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                No weigh-ins recorded yet. Track morning weigh-ins to correlate with strength gains!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {bodyWeightLogs.map((entry, idx) => {
                  const prev = bodyWeightLogs[idx + 1];
                  const delta = prev ? Math.round((entry.weightKg - prev.weightKg) * 10) / 10 : null;

                  return (
                    <div
                      key={entry.id}
                      style={{
                        background: 'var(--bg-surface)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                          {displayWeight(entry.weightKg)}
                        </span>
                        {delta !== null && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: delta > 0 ? 'var(--accent-volt)' : delta < 0 ? 'var(--accent-cyan)' : 'var(--text-muted)'
                            }}
                          >
                            {delta > 0 ? `+${displayWeight(delta)}` : displayWeight(delta)}
                          </span>
                        )}
                        {entry.note && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {entry.note}
                          </div>
                        )}
                      </div>

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Workout Log History Accordion */}
      <div className="gym-card" style={{ marginTop: 14 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>
          <h3 className="section-title">
            <Calendar size={18} color="var(--text-primary)" />
            Session History Log
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: 'var(--radius-md)',
                borderColor: 'rgba(0, 245, 155, 0.35)',
                background: 'rgba(0, 245, 155, 0.08)'
              }}
              onClick={() => {
                triggerHaptic('light');
                setShowImportModal(true);
              }}
              title="Import workouts from Strong, Hevy, FitNotes, CSV or JSON"
            >
              <FileSpreadsheet size={13} color="var(--accent-volt)" />
              Import Logs
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {historySessions.length} Completed
            </span>
          </div>
        </div>

        {historySessions.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            No sessions recorded yet. Complete a workout to see history here!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historySessions.map((s, sIdx) => {
              const isExpanded = expandedSessionId === s.id;
              return (
                <div
                  key={s.id || `session-${sIdx}`}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.prCount > 0 && (
                        <span className="pr-badge-gold" style={{ fontSize: '0.7rem' }}>
                          +{s.prCount} PR
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '10px 14px 14px',
                        borderTop: '1px solid var(--border-subtle)',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      {s.exercises.map((ex, exI) => {
                        const tType = getExerciseTrackingType(ex, ex.trackingType);
                        return (
                          <div key={exI} style={{ fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{ex.name}</div>
                            <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: 2 }}>
                              {ex.sets
                                .filter((st) => st.completed)
                                .map(
                                  (st, sIdx) =>
                                    `Set ${sIdx + 1} (${st.type === 'warmup' ? 'W' : st.type === 'drop' ? 'D' : st.type === 'failure' ? 'F' : 'Wk'}): ${formatSetPerformance(st, tType, settings.unit)}`
                                )
                                .join(' | ') || 'No sets recorded'}
                            </div>
                          </div>
                        );
                      })}

                      {s.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-volt)', marginTop: 4 }}>
                          📝 {s.notes}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => setInspectedSession(s)}
                        >
                          <Clock size={13} />
                          View Full Workout Debrief
                        </button>

                        {onDeleteSession && (
                          <button
                            className="btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              color: 'var(--accent-crimson)',
                              borderColor: 'rgba(255, 51, 102, 0.35)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete workout log for "${s.routineName}" on ${new Date(s.date).toLocaleDateString()}?`)) {
                                onDeleteSession(s.id, sIdx);
                                triggerHaptic('medium');
                              }
                            }}
                            title="Delete this session from history"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Workout Summary Inspector Modal */}
      {inspectedSession && (
        <WorkoutSummaryModal
          session={inspectedSession}
          settings={settings}
          onClose={() => setInspectedSession(null)}
        />
      )}

      {/* Workout Logs Importer Modal */}
      {showImportModal && (
        <WorkoutImportModal
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
};
