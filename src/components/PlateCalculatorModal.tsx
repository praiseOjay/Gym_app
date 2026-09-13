import React, { useState, useMemo } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { calculateBarbellPlates } from '../engine/overloadEngine';
import { SwipeableModalSheet } from './SwipeableModalSheet';

interface PlateCalculatorModalProps {
  initialWeight: number;
  unit: 'kg' | 'lbs';
  exerciseName?: string;
  targetSetIndex?: number;
  sets?: { setNumber: number; weightKg: number; completed: boolean }[];
  onClose: () => void;
  onApplyWeight?: (
    weight: number,
    scope: 'current' | 'all_remaining' | 'all',
    targetSetIndex: number
  ) => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeight,
  unit,
  exerciseName,
  targetSetIndex = 0,
  sets,
  onClose,
  onApplyWeight
}) => {
  const [activeSetIdx, setActiveSetIdx] = useState<number>(targetSetIndex);

  const isLeverOrPlateLoaded = useMemo(() => {
    if (!exerciseName) return false;
    const lower = exerciseName.toLowerCase();
    return (
      lower.includes('lever') ||
      lower.includes('plate') ||
      lower.includes('sled') ||
      lower.includes('hack squat') ||
      lower.includes('leg press')
    );
  }, [exerciseName]);

  const [barWeight, setBarWeight] = useState(() => {
    if (isLeverOrPlateLoaded) return 0;
    return unit === 'kg' ? 20 : 45;
  });
  const [weight, setWeight] = useState(initialWeight || (unit === 'kg' ? 60 : 135));
  const plateCalc = calculateBarbellPlates(weight, unit, barWeight);

  const adjustWeight = (delta: number) => {
    setWeight((prev) => Math.max(barWeight, Math.round((prev + delta) * 10) / 10));
  };

  const handleSelectSet = (idx: number) => {
    setActiveSetIdx(idx);
    if (sets && sets[idx]) {
      const setRawKg = sets[idx].weightKg;
      const converted = unit === 'lbs' ? Math.round(setRawKg * 2.20462 * 10) / 10 : setRawKg;
      if (converted > 0) {
        setWeight(converted);
      }
    }
  };

  const handleApply = (scope: 'current' | 'all_remaining' | 'all') => {
    if (onApplyWeight) {
      onApplyWeight(weight, scope, activeSetIdx);
    }
    onClose();
  };

  const barPresets = unit === 'kg'
    ? [
        { label: 'Olympic 20kg', wt: 20 },
        { label: "Women's 15kg", wt: 15 },
        { label: 'EZ Curl 10kg', wt: 10 },
        { label: 'Smith 15kg', wt: 15 },
        { label: 'Plates Only 0kg', wt: 0 }
      ]
    : [
        { label: 'Olympic 45lb', wt: 45 },
        { label: "Women's 35lb", wt: 35 },
        { label: 'EZ Curl 25lb', wt: 25 },
        { label: 'Smith 30lb', wt: 30 },
        { label: 'Plates Only 0lb', wt: 0 }
      ];

  return (
    <SwipeableModalSheet onClose={onClose}>
      {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Barbell & Plate Calculator</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {exerciseName ? `${exerciseName} · ` : ''}
              {barWeight === 0
                ? `Visual plate rack loading (Plates Only / Lever)`
                : `Visual plate rack loading (${barWeight} ${unit} bar)`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Target Set Selector Pills */}
        {sets && sets.length > 0 && (
          <div style={{ marginTop: 10, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
                Target Set:
              </span>
              {sets.map((s, idx) => {
                const isSelected = activeSetIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="quick-prompt-chip"
                    style={{
                      background: isSelected ? 'var(--accent-volt)' : undefined,
                      color: isSelected ? '#050D0A' : undefined,
                      fontWeight: isSelected ? 800 : undefined,
                      padding: '3px 10px',
                      fontSize: '0.74rem',
                      flexShrink: 0
                    }}
                    onClick={() => handleSelectSet(idx)}
                  >
                    Set {s.setNumber} {s.completed ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bar Type Presets */}
        <div className="quick-prompts-row" style={{ marginTop: 6, marginBottom: 10 }}>
          {barPresets.map((b) => (
            <button
              key={b.label}
              className="quick-prompt-chip"
              style={{
                background: barWeight === b.wt ? 'var(--accent-volt)' : undefined,
                color: barWeight === b.wt ? '#050D0A' : undefined,
                fontWeight: barWeight === b.wt ? 800 : undefined
              }}
              onClick={() => {
                setBarWeight(b.wt);
                if (weight < b.wt) setWeight(b.wt);
              }}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Target Weight Controls */}
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn-secondary"
              style={{ padding: '8px 12px' }}
              onClick={() => adjustWeight(-5)}
            >
              <Minus size={16} /> 5
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '8px 12px' }}
              onClick={() => adjustWeight(-2.5)}
            >
              <Minus size={16} /> 2.5
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-volt)',
                lineHeight: 1
              }}
            >
              {weight}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total {unit}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn-secondary"
              style={{ padding: '8px 12px' }}
              onClick={() => adjustWeight(2.5)}
            >
              <Plus size={16} /> 2.5
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '8px 12px' }}
              onClick={() => adjustWeight(5)}
            >
              <Plus size={16} /> 5
            </button>
          </div>
        </div>

        {/* Visual Barbell Loading Representation */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Load Per Side: <strong style={{ color: '#fff' }}>{plateCalc.weightPerSide} {unit}</strong>
          </div>

          <div className="plate-visualizer">
            {/* Barbell sleeve */}
            <div className="barbell-sleeve" />
            <div className="barbell-collar" />

            {/* Rendered plates from inside to outside */}
            {plateCalc.platesPerSide.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 20px' }}>
                {barWeight === 0 ? `No Plates Loaded (0 ${unit})` : `Empty Barbell (${barWeight}${unit})`}
              </span>
            ) : (
              plateCalc.platesPerSide.map((p, idx) => {
                // Height scaling according to plate weight
                const height = Math.max(36, Math.min(100, 36 + p.weight * 2.4));
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 2
                    }}
                  >
                    {Array.from({ length: p.count }).map((_, cIdx) => (
                      <div
                        key={cIdx}
                        className="plate-disc"
                        style={{
                          backgroundColor: p.color,
                          height: `${height}px`,
                          width: `${Math.max(14, p.weight * 0.7 + 10)}px`
                        }}
                        title={`${p.weight} ${unit}`}
                      >
                        <span style={{ transform: 'rotate(-90deg)', fontSize: '0.65rem' }}>
                          {p.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: 'var(--radius-lg)', marginTop: 12 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Plates Needed (Each Side):
          </div>
          {plateCalc.platesPerSide.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Just the empty bar.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {plateCalc.platesPerSide.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-surface)',
                    border: `1px solid ${p.color}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: p.color
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.9rem' }}>
                    {p.count} × {p.weight} {unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!plateCalc.isExact && (
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
              ⚠️ Remainder: {plateCalc.remainder} {unit} cannot be loaded with standard plates.
            </div>
          )}
        </div>

        {/* Multi-Scope Apply Buttons */}
        {onApplyWeight && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <button
              className="btn-primary"
              onClick={() => handleApply('current')}
            >
              Apply {weight} {unit} to Set {activeSetIdx + 1}
            </button>
            {sets && sets.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '8px 4px', color: 'var(--accent-cyan)' }}
                  onClick={() => handleApply('all_remaining')}
                  title={`Apply to Set ${activeSetIdx + 1} and subsequent uncompleted sets`}
                >
                  Apply to Remaining Sets
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.74rem', padding: '8px 4px', color: 'var(--text-secondary)' }}
                  onClick={() => handleApply('all')}
                  title="Apply this weight across all sets of this exercise"
                >
                  Apply to All Sets
                </button>
              </div>
            )}
          </div>
        )}
    </SwipeableModalSheet>
  );
};
