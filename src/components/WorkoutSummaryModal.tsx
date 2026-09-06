import React, { useEffect, useState, useMemo } from 'react';
import type { WorkoutSession, UserSettings, MesocycleBlock, MuscleRecoveryFeedback, MuscleGroup } from '../types/gym';
import { analyzeWorkoutSessionWithAI } from '../services/geminiService';
import { kgToLbs } from '../engine/overloadEngine';
import { StorageService } from '../db/storage';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Flame,
  Activity,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkoutSummaryModalProps {
  session: WorkoutSession;
  settings: UserSettings;
  mesocycleBlock?: MesocycleBlock;
  onClose: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  session,
  settings,
  mesocycleBlock,
  onClose
}) => {
  const [loadingAI, setLoadingAI] = useState(true);
  const [aiDebrief, setAiDebrief] = useState<{
    summary: string;
    highlights: string[];
    overloadSuccess: boolean;
    recommendations: string[];
    recoveryAdvice: string;
  } | null>(null);

  useEffect(() => {
    // Fire celebratory confetti shower!
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 }
    });

    const getDebrief = async () => {
      try {
        const result = await analyzeWorkoutSessionWithAI(session, settings);
        setAiDebrief(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAI(false);
      }
    };
    getDebrief();
  }, [session, settings]);

  // RP Recovery feedback state
  const [pumpRating, setPumpRating] = useState<0 | 1 | 2>(1); // 0 = Poor, 1 = Good, 2 = Insane
  const [workloadRating, setWorkloadRating] = useState<0 | 1 | 2>(1); // 0 = Low, 1 = Ideal, 2 = Excessive
  const [sorenessRating, setSorenessRating] = useState<0 | 1 | 2>(1); // 0 = None, 1 = Mild, 2 = Severe
  const [feedbackSaved, setFeedbackSaved] = useState<boolean>(false);

  // Discover trained muscle groups from session
  const trainedMuscles = useMemo(() => {
    const muscles = new Set<MuscleGroup>();
    session.exercises.forEach((ex) => {
      const meta = EXERCISE_LIBRARY.find(
        (e) => e.id.toLowerCase() === (ex.exerciseId || '').toLowerCase() || e.name.toLowerCase() === ex.name.toLowerCase()
      );
      if (meta) muscles.add(meta.muscleGroup);
      else if (session.dayTag) muscles.add('Chest');
    });
    return Array.from(muscles);
  }, [session]);

  const handleSaveFeedback = () => {
    const targets = trainedMuscles.length > 0 ? trainedMuscles : (['Chest'] as MuscleGroup[]);
    const records: MuscleRecoveryFeedback[] = targets.map((muscle) => ({
      id: `mrf-${Date.now()}-${muscle}`,
      sessionId: session.id,
      date: session.date || new Date().toISOString(),
      muscle,
      pumpRating,
      workloadRating,
      sorenessRating
    }));
    StorageService.addRecoveryFeedback(records);
    setFeedbackSaved(true);
  };

  const displayVolume =
    settings.unit === 'lbs'
      ? `${kgToLbs(session.totalVolumeKg)} lbs`
      : `${session.totalVolumeKg} kg`;

  const minutes = Math.max(1, Math.round(session.durationSeconds / 60));
  const caloriesBurned = session.caloriesBurned || Math.round(minutes * 7.5);
  const avgBurnRate = (caloriesBurned / minutes).toFixed(1);

  const mesoWeekNumber = session.mesocycleWeek || mesocycleBlock?.currentWeek;
  const mesoWeekConfig = mesocycleBlock?.weeks.find((w) => w.weekNumber === mesoWeekNumber);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00F59B, #00A3FF)',
              color: '#050D0A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 0 30px rgba(0, 245, 155, 0.4)'
            }}
          >
            <Trophy size={30} strokeWidth={2.5} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            Workout Conquered!
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--accent-volt)', fontWeight: 700 }}>
            {session.routineName}
          </p>
        </div>

        {/* Quick Stats Grid with Active Calorie Burn */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            background: 'var(--bg-card)',
            padding: '14px 8px',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Duration
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
              {minutes}m
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Volume
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: 'var(--accent-volt)' }}>
              {displayVolume}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Burned
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: '#FF7A00', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Flame size={12} color="#FF7A00" fill="#FF7A00" />
              <span>{caloriesBurned}</span>
            </div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
              ~{avgBurnRate} c/m
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              PRs
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: '#FFD700' }}>
              {session.prCount}
            </div>
          </div>
        </div>

        {/* Mesocycle Progress Strip */}
        {mesoWeekNumber && mesocycleBlock && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(0, 245, 155, 0.06) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                  {mesocycleBlock.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Week {mesoWeekNumber} of {mesocycleBlock.totalWeeks} ({mesoWeekConfig?.phaseName || 'Active'}) · Target {mesoWeekConfig?.targetRir ?? 2} RIR
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--accent-volt)',
                background: 'rgba(0, 245, 155, 0.12)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Session Logged
            </span>
          </div>
        )}

        {/* RP Hypertrophy Soreness & Pump Feedback Widget */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(0, 245, 155, 0.08) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(0, 245, 155, 0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} color="var(--accent-volt)" />
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>
                RP Hypertrophy Recovery Calibration
              </span>
            </div>
            {feedbackSaved && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--accent-volt)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Check size={14} /> Saved
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            Feeds Dr. Mike Israetel’s volume landmarks to auto-scale next week’s prescribed sets toward your MAV.
          </p>

          {/* 1. Pump Rating */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
              MUSCLE PUMP RATING
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { val: 0, label: 'Flat (0)' },
                { val: 1, label: 'Solid Pump (1)' },
                { val: 2, label: 'Insane Pump (2)' }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  disabled={feedbackSaved}
                  onClick={() => setPumpRating(item.val as any)}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 'var(--radius-sm)',
                    background: pumpRating === item.val ? 'var(--accent-volt)' : 'rgba(255, 255, 255, 0.05)',
                    color: pumpRating === item.val ? '#050D0A' : 'var(--text-secondary)',
                    border: pumpRating === item.val ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: feedbackSaved ? 'default' : 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Workload Strain */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
              WORKLOAD STRAIN
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { val: 0, label: 'Sub-MEV (0)' },
                { val: 1, label: 'Ideal (1)' },
                { val: 2, label: 'Brutal (2)' }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  disabled={feedbackSaved}
                  onClick={() => setWorkloadRating(item.val as any)}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 'var(--radius-sm)',
                    background: workloadRating === item.val ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.05)',
                    color: workloadRating === item.val ? '#050D0A' : 'var(--text-secondary)',
                    border: workloadRating === item.val ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: feedbackSaved ? 'default' : 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Anticipated Soreness */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
              ANTICIPATED SORENESS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { val: 0, label: 'None (0)' },
                { val: 1, label: 'Mild (1)' },
                { val: 2, label: 'Severe (2)' }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  disabled={feedbackSaved}
                  onClick={() => setSorenessRating(item.val as any)}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 'var(--radius-sm)',
                    background: sorenessRating === item.val ? '#FFB800' : 'rgba(255, 255, 255, 0.05)',
                    color: sorenessRating === item.val ? '#050D0A' : 'var(--text-secondary)',
                    border: sorenessRating === item.val ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: feedbackSaved ? 'default' : 'pointer'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {!feedbackSaved ? (
            <button
              onClick={handleSaveFeedback}
              style={{
                background: 'rgba(0, 245, 155, 0.15)',
                border: '1px solid rgba(0, 245, 155, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '9px 12px',
                color: 'var(--accent-volt)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginTop: 4
              }}
            >
              Record Recovery Calibration
            </button>
          ) : (
            <div
              style={{
                fontSize: '0.76rem',
                color: 'var(--accent-volt)',
                textAlign: 'center',
                paddingTop: 4,
                fontWeight: 700
              }}
            >
              ✓ Logged to volume auto-scaler for {trainedMuscles.join(', ') || 'Chest'}
            </div>
          )}
        </div>

        {/* AI Debrief Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.08) 0%, var(--bg-card) 100%)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>
              Gemini AI Coach Debrief
            </span>
          </div>

          {loadingAI ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--accent-cyan)' }}>
              <RefreshCw size={24} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                Synthesizing progressive overload metrics...
              </p>
            </div>
          ) : aiDebrief ? (
            <>
              <p style={{ fontSize: '0.88rem', color: '#fff', lineHeight: 1.45 }}>
                {aiDebrief.summary}
              </p>

              {aiDebrief.highlights.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Session Highlights
                  </div>
                  <ul style={{ paddingLeft: 18, marginTop: 4, fontSize: '0.82rem', color: 'var(--accent-volt)' }}>
                    {aiDebrief.highlights.map((h, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiDebrief.recommendations.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                    Next Session Overload Target
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                    {aiDebrief.recommendations[0]}
                  </p>
                </div>
              )}

              <div style={{ background: 'rgba(0, 245, 155, 0.06)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-volt)', textTransform: 'uppercase' }}>
                  Recovery & Nutrition Advice
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {aiDebrief.recoveryAdvice}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={onClose}>
          <CheckCircle2 size={18} />
          Save Workout to Log
        </button>
      </div>
    </div>
  );
};
