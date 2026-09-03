import React, { useEffect, useState } from 'react';
import type { WorkoutSession, UserSettings } from '../types/gym';
import { analyzeWorkoutSessionWithAI } from '../services/geminiService';
import { kgToLbs } from '../engine/overloadEngine';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkoutSummaryModalProps {
  session: WorkoutSession;
  settings: UserSettings;
  onClose: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  session,
  settings,
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

  const displayVolume =
    settings.unit === 'lbs'
      ? `${kgToLbs(session.totalVolumeKg)} lbs`
      : `${session.totalVolumeKg} kg`;

  const minutes = Math.round(session.durationSeconds / 60);

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

        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            background: 'var(--bg-card)',
            padding: '14px 10px',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Duration
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
              {minutes}m
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Volume
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-volt)' }}>
              {displayVolume}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              PRs Smashed
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: '#FFD700' }}>
              {session.prCount}
            </div>
          </div>
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
