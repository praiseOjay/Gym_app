import React, { useState } from 'react';
import type { MesocycleBlock, WorkoutSession } from '../types/gym';
import {
  advanceMesocycleWeek,
  triggerManualDeload,
  detectSystemicFatigue,
  createDefaultMesocycle,
  MESOCYCLE_TEMPLATES
} from '../engine/mesocycleEngine';
import { triggerHaptic } from '../utils/haptics';
import {
  Activity,
  ChevronRight,
  RotateCcw,
  Settings2,
  X,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { SwipeableModalSheet } from './SwipeableModalSheet';

interface MesocycleCardProps {
  mesocycleBlock: MesocycleBlock;
  workouts: WorkoutSession[];
  onUpdateMesocycle: (updated: MesocycleBlock) => void;
}

export const MesocycleCard: React.FC<MesocycleCardProps> = ({
  mesocycleBlock,
  workouts,
  onUpdateMesocycle
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('HYPERTROPHY_5_WEEK');

  // Dismissal state for auto-deload recommendation in current week
  const [isDeloadDismissed, setIsDeloadDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`overload_dismiss_deload_${mesocycleBlock.id}_${mesocycleBlock.currentWeek}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissDeload = () => {
    setIsDeloadDismissed(true);
    try {
      localStorage.setItem(`overload_dismiss_deload_${mesocycleBlock.id}_${mesocycleBlock.currentWeek}`, 'true');
    } catch {}
    triggerHaptic('light');
  };

  // Evaluate systemic fatigue from past sessions
  const fatigueReport = detectSystemicFatigue(workouts);

  const currentWeekConfig =
    mesocycleBlock.weeks.find((w) => w.weekNumber === mesocycleBlock.currentWeek) ||
    mesocycleBlock.weeks[0];

  const isDeload = currentWeekConfig.phaseName === 'Deload';

  // Get color theme based on phase
  const getPhaseTheme = (phaseName: string) => {
    switch (phaseName) {
      case 'Accumulation':
        return { color: '#00F59B', bg: 'rgba(0, 245, 155, 0.12)', border: 'rgba(0, 245, 155, 0.35)' };
      case 'Progression':
        return { color: '#00E5FF', bg: 'rgba(0, 229, 255, 0.12)', border: 'rgba(0, 229, 255, 0.35)' };
      case 'Overload':
        return { color: '#FFB800', bg: 'rgba(255, 184, 0, 0.12)', border: 'rgba(255, 184, 0, 0.35)' };
      case 'Overreach':
        return { color: '#FF4757', bg: 'rgba(255, 71, 87, 0.15)', border: 'rgba(255, 71, 87, 0.4)' };
      case 'Deload':
        return { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)' };
      default:
        return { color: '#00F59B', bg: 'rgba(0, 245, 155, 0.12)', border: 'rgba(0, 245, 155, 0.35)' };
    }
  };

  const theme = getPhaseTheme(currentWeekConfig.phaseName);

  const handleAdvanceWeek = () => {
    triggerHaptic('success');
    const updated = advanceMesocycleWeek(mesocycleBlock);
    onUpdateMesocycle(updated);
  };

  const handleTriggerDeload = () => {
    triggerHaptic('warning');
    const updated = triggerManualDeload(mesocycleBlock);
    onUpdateMesocycle(updated);
  };

  const handleApplyNewTemplate = (templateKey: string) => {
    triggerHaptic('success');
    let newBlock: MesocycleBlock;
    if (templateKey === 'STRENGTH_4_WEEK') {
      newBlock = createDefaultMesocycle('Strength', 4);
    } else if (templateKey === 'HYPERTROPHY_6_WEEK') {
      newBlock = createDefaultMesocycle('Hypertrophy', 6);
    } else {
      newBlock = createDefaultMesocycle('Hypertrophy', 5);
    }
    onUpdateMesocycle(newBlock);
    setShowConfigModal(false);
  };

  const handleResetCurrentCycle = () => {
    triggerHaptic('light');
    const updated: MesocycleBlock = {
      ...mesocycleBlock,
      currentWeek: 1,
      startDate: new Date().toISOString(),
      status: 'active'
    };
    onUpdateMesocycle(updated);
    setShowConfigModal(false);
  };

  return (
    <>
      <div
        className="gym-card"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95) 0%, rgba(13, 17, 23, 0.95) 100%)',
          border: `1px solid ${theme.border}`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${theme.bg}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Header Row with dynamic wrap for mobile portrait */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            gap: 10,
            flexWrap: 'wrap'
          }}
        >
          {/* Title group with ample minWidth so portrait never squishes to 57px */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: '220px', flex: '1 1 220px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.color,
                flexShrink: 0
              }}
            >
              <Activity size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                style={{
                  fontSize: '0.98rem',
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.25,
                  margin: 0
                }}
              >
                {mesocycleBlock.name}
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Periodized Training Block · {mesocycleBlock.totalWeeks} Weeks Total
              </div>
            </div>
          </div>

          {/* Harmonious Right Toolbar: Phase Pill + Config Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                color: theme.color,
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                boxShadow: `0 0 12px ${theme.bg}`,
                height: 28,
                boxSizing: 'border-box'
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: theme.color,
                  boxShadow: `0 0 6px ${theme.color}`
                }}
              />
              <span>{currentWeekConfig.phaseName}</span>
            </div>

            <button
              onClick={() => setShowConfigModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.74rem',
                fontWeight: 700,
                height: 28,
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
              title="Configure Mesocycle Block"
            >
              <Settings2 size={13} />
              <span>Config</span>
            </button>
          </div>
        </div>

        {/* Hero Current Week Badge & Target RIR */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${theme.border}`,
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            marginBottom: 14
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                CURRENT STAGE
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', marginTop: 2 }}>
                Week {mesocycleBlock.currentWeek} of {mesocycleBlock.totalWeeks}
              </div>
            </div>

            <div
              style={{
                textAlign: 'right',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                TARGET RIR
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: theme.color, fontFamily: 'var(--font-mono)' }}>
                {currentWeekConfig.targetRir} RIR
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                (RPE ~{currentWeekConfig.targetRpe})
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.45 }}>
            {currentWeekConfig.description}
          </p>

          {isDeload && (
            <div
              style={{
                marginTop: 10,
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.78rem',
                color: '#D8B4FE'
              }}
            >
              <Zap size={15} color="#C084FC" />
              <span><strong>Deload Protocol Active:</strong> Working sets reduced by 50%. Focus on pristine bar path and clearing fatigue.</span>
            </div>
          )}
        </div>

        {/* Multi-Week Timeline Stepper */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              BLOCK TIMELINE
            </span>
            <span style={{ fontSize: '0.72rem', color: theme.color, fontWeight: 800 }}>
              {Math.round((mesocycleBlock.currentWeek / mesocycleBlock.totalWeeks) * 100)}% Complete
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${mesocycleBlock.totalWeeks}, 1fr)`,
              gap: 6
            }}
          >
            {mesocycleBlock.weeks.map((week) => {
              const isPast = week.weekNumber < mesocycleBlock.currentWeek;
              const isCurrent = week.weekNumber === mesocycleBlock.currentWeek;
              const weekTheme = getPhaseTheme(week.phaseName);

              return (
                <div
                  key={week.weekNumber}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 'var(--radius-full)',
                      background: isPast
                        ? 'var(--accent-volt)'
                        : isCurrent
                        ? weekTheme.color
                        : 'rgba(255, 255, 255, 0.1)',
                      boxShadow: isCurrent ? `0 0 10px ${weekTheme.color}` : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: isCurrent ? 900 : 700,
                        color: isCurrent ? '#fff' : isPast ? 'var(--accent-volt)' : 'var(--text-muted)'
                      }}
                    >
                      W{week.weekNumber}
                    </div>
                    <div
                      style={{
                        fontSize: '0.6rem',
                        color: isCurrent ? weekTheme.color : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {week.phaseName === 'Accumulation' ? 'Accum' : week.phaseName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Systemic Fatigue Detection & Auto-Deload Banner */}
        {fatigueReport.isDeloadRecommended && !isDeload && !isDeloadDismissed && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.18) 0%, rgba(255, 184, 0, 0.1) 100%)',
              border: '1px solid rgba(255, 71, 87, 0.5)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: 14,
              animation: 'pulse-glow 2.5s infinite',
              position: 'relative'
            }}
          >
            <button
              onClick={handleDismissDeload}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
              title="Dismiss deload recommendation for this week"
            >
              <X size={14} />
            </button>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingRight: 20 }}>
              <ShieldAlert size={20} color="#FF4757" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#FF4757' }}>
                    Auto-Deload Recommended
                  </strong>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      background: 'rgba(255, 71, 87, 0.25)',
                      color: '#FF6B81',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    Fatigue Score: {fatigueReport.fatigueScore}/100
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                  {fatigueReport.reason}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleTriggerDeload}
                    style={{
                      background: 'linear-gradient(135deg, #FF4757, #FF6B81)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Zap size={13} />
                    <span>Apply Deload Week Now (-50% Volume)</span>
                  </button>
                  <button
                    onClick={handleDismissDeload}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-secondary)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Dismiss (Feeling Strong)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card Action Controls */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          {!isDeload && (
            <button
              onClick={handleTriggerDeload}
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#C084FC',
                borderRadius: 'var(--radius-md)',
                padding: '7px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Jump immediately to Deload week"
            >
              <Zap size={13} />
              <span>Deload Week</span>
            </button>
          )}

          <button
            onClick={handleAdvanceWeek}
            style={{
              background: 'linear-gradient(135deg, var(--accent-volt), var(--accent-cyan))',
              color: '#050D0A',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <span>{mesocycleBlock.currentWeek >= mesocycleBlock.totalWeeks ? 'Start New Cycle' : 'Advance Week'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Mesocycle Configuration Modal */}
      {showConfigModal && (
        <SwipeableModalSheet
          onClose={() => setShowConfigModal(false)}
          maxHeight="85vh"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                Configure Mesocycle Block
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Select an evidence-based periodization structure for your goals.
              </p>
            </div>
            <button
              className="icon-ctrl-btn"
              onClick={() => setShowConfigModal(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Template Selector Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {Object.entries(MESOCYCLE_TEMPLATES).map(([key, template]) => {
              const isSelected = selectedTemplateKey === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelectedTemplateKey(key)}
                  style={{
                    background: isSelected ? 'rgba(0, 245, 155, 0.1)' : 'var(--bg-card)',
                    border: isSelected ? '1.5px solid var(--accent-volt)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.95rem', color: '#fff' }}>
                      {template.name}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        background: isSelected ? 'var(--accent-volt)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#050D0A' : 'var(--text-secondary)',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {template.totalWeeks} Weeks · {template.focus}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {template.weeks.map((w) => (
                      <div
                        key={w.weekNumber}
                        style={{
                          flex: 1,
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '4px 2px',
                          textAlign: 'center',
                          fontSize: '0.62rem',
                          color: w.phaseName === 'Deload' ? '#C084FC' : 'var(--text-secondary)'
                        }}
                      >
                        W{w.weekNumber}: {w.targetRir}RIR
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <button
              onClick={handleResetCurrentCycle}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RotateCcw size={14} />
              <span>Reset to Week 1</span>
            </button>

            <button
              className="btn-primary"
              onClick={() => handleApplyNewTemplate(selectedTemplateKey)}
              style={{ padding: '9px 18px', fontSize: '0.82rem' }}
            >
              Apply Selected Block
            </button>
          </div>
        </SwipeableModalSheet>
      )}
    </>
  );
};
