import React, { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Exercise } from '../types/gym';
import { getSmartExerciseSwap } from '../services/geminiService';

interface SmartSwapModalProps {
  exercise: Exercise;
  apiKey: string;
  onClose: () => void;
  onSelectAlternative: (newExerciseName: string, equipment: string) => void;
}

export const SmartSwapModal: React.FC<SmartSwapModalProps> = ({
  exercise,
  apiKey,
  onClose,
  onSelectAlternative
}) => {
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('Machine or equipment is currently occupied');
  const [result, setResult] = useState<{
    alternativeName: string;
    equipment: string;
    biomechanicsExplanation: string;
    recommendedWeightAdj: string;
  } | null>(null);

  const fetchSwap = useCallback(async (customReason?: string) => {
    setLoading(true);
    try {
      const swap = await getSmartExerciseSwap(exercise, customReason || reason, apiKey);
      setResult(swap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [exercise, reason, apiKey]);

  useEffect(() => {
    fetchSwap();
  }, [fetchSwap]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 229, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>AI Smart Swap</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Targeting identical {exercise.muscleGroup} fiber recruitment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Current exercise banner */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Current Exercise
            </span>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{exercise.name}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-volt)' }}>{exercise.equipment}</span>
          </div>
          <ArrowRight size={20} color="var(--text-muted)" />
        </div>

        {/* Reason Selector Chips */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Why do you need a swap?
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {[
              'Equipment is occupied',
              'Joint or shoulder discomfort',
              'Looking for dumbbell alternative',
              'Prefer cable machine tension'
            ].map((r, i) => (
              <button
                key={i}
                className="timer-chip"
                style={{
                  background: reason === r ? 'rgba(0, 229, 255, 0.2)' : undefined,
                  borderColor: reason === r ? 'var(--accent-cyan)' : undefined,
                  color: reason === r ? '#fff' : undefined
                }}
                onClick={() => {
                  setReason(r);
                  fetchSwap(r);
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* AI Result Card */}
        {loading ? (
          <div
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: 'var(--accent-cyan)'
            }}
          >
            <RefreshCw size={28} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Gemini AI analyzing biomechanics & movement angles...
            </span>
          </div>
        ) : result ? (
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.08) 0%, var(--bg-card) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--accent-cyan)',
                    letterSpacing: '0.5px'
                  }}
                >
                  Recommended Alternative
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>
                  {result.alternativeName}
                </div>
                <div style={{ display: 'inline-block', fontSize: '0.75rem', color: 'var(--accent-volt)', fontWeight: 700 }}>
                  Equipment: {result.equipment}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              💡 {result.biomechanicsExplanation}
            </p>

            <div
              style={{
                background: 'var(--bg-surface)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--accent-amber)',
                border: '1px solid rgba(255, 184, 0, 0.2)'
              }}
            >
              ⚖️ <strong>Weight Adjustment:</strong> {result.recommendedWeightAdj}
            </div>

            <button
              className="btn-accent-cyan"
              style={{ width: '100%', marginTop: 4 }}
              onClick={() => {
                onSelectAlternative(result.alternativeName, result.equipment);
                onClose();
              }}
            >
              <CheckCircle2 size={18} />
              Swap Into Today's Session
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
