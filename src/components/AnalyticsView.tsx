import React, { useState } from 'react';
import type { WorkoutSession, PRRecord, UserSettings } from '../types/gym';
import { kgToLbs } from '../engine/overloadEngine';
import { WorkoutCalendar } from './WorkoutCalendar';
import { ProgressGraph } from './ProgressGraph';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import {
  TrendingUp,
  Trophy,
  Flame,
  Calendar,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers
} from 'lucide-react';

interface AnalyticsViewProps {
  historySessions: WorkoutSession[];
  prs: PRRecord[];
  settings: UserSettings;
}

type TabType = 'overview' | 'graphs' | 'calendar' | 'prs' | 'history';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  historySessions,
  prs,
  settings
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [inspectedSession, setInspectedSession] = useState<WorkoutSession | null>(null);

  const displayVolume = (kg: number) => {
    if (settings.unit === 'lbs') return `${kgToLbs(kg)} lbs`;
    return `${kg} kg`;
  };

  const displayWeight = (kg: number) => {
    if (settings.unit === 'lbs') return `${kgToLbs(kg)} lbs`;
    return `${kg} kg`;
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
            Mechanical volume graphs, workout calendar & PR tracking
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
          { id: 'graphs', label: 'Progression Graph', icon: BarChart3 },
          { id: 'calendar', label: 'Workout Calendar', icon: Calendar },
          { id: 'prs', label: 'PR Hall of Fame', icon: Trophy }
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

      {/* OVERVIEW TAB: Shows both Graph and Calendar */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Interactive Progression Graph */}
          <ProgressGraph
            historySessions={historySessions}
            prs={prs}
            settings={settings}
          />

          {/* Interactive Workout Calendar */}
          <WorkoutCalendar
            historySessions={historySessions}
            settings={settings}
            onSelectSession={(session) => setInspectedSession(session)}
          />

          {/* Quick PR Highlights Preview */}
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

      {/* GRAPHS ONLY TAB */}
      {activeTab === 'graphs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ProgressGraph
            historySessions={historySessions}
            prs={prs}
            settings={settings}
          />
        </div>
      )}

      {/* CALENDAR ONLY TAB */}
      {activeTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <WorkoutCalendar
            historySessions={historySessions}
            settings={settings}
            onSelectSession={(session) => setInspectedSession(session)}
          />
        </div>
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
                      {pr.type === '1RM' ? 'Est. 1-Rep Max' : 'Max Working Weight'} ·{' '}
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
                      {displayWeight(pr.value)}
                    </div>
                    {pr.reps && (
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

      {/* Complete Workout Log History Accordion */}
      <div className="gym-card" style={{ marginTop: 14 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>
          <h3 className="section-title">
            <Calendar size={18} color="var(--text-primary)" />
            Session History Log
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {historySessions.length} Completed
          </span>
        </div>

        {historySessions.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            No sessions recorded yet. Complete a workout to see history here!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historySessions.map((s) => {
              const isExpanded = expandedSessionId === s.id;
              return (
                <div
                  key={s.id}
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
                      {s.exercises.map((ex, exI) => (
                        <div key={exI} style={{ fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{ex.name}</div>
                          <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: 2 }}>
                            {ex.sets
                              .filter((st) => st.completed)
                              .map(
                                (st, sIdx) =>
                                  `Set ${sIdx + 1}: ${displayWeight(st.weightKg)} × ${st.reps}`
                              )
                              .join(' | ') || 'No sets recorded'}
                          </div>
                        </div>
                      ))}

                      {s.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-volt)', marginTop: 4 }}>
                          📝 {s.notes}
                        </div>
                      )}

                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', marginTop: 6, alignSelf: 'flex-start' }}
                        onClick={() => setInspectedSession(s)}
                      >
                        <Clock size={13} />
                        View Full Workout Debrief
                      </button>
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
    </div>
  );
};
