import React, { useState } from 'react';
import type { UserSettings } from '../types/gym';
import { kgToLbs, lbsToKg } from '../engine/overloadEngine';
import {
  X,
  Key,
  Volume2,
  Scale,
  Clock,
  User,
  Check,
  RotateCcw,
  Target
} from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (updated: UserSettings) => void;
  onClose: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
  onResetData
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...settings });
  const [showKey, setShowKey] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  const handleSave = () => {
    onSave(localSettings);
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 800);
  };

  // Convert weights for display based on selected unit
  const displayCurrentWeight =
    localSettings.unit === 'lbs'
      ? localSettings.bodyWeightKg ? kgToLbs(localSettings.bodyWeightKg) : ''
      : localSettings.bodyWeightKg ?? '';

  const displayTargetWeight =
    localSettings.unit === 'lbs'
      ? localSettings.targetWeightKg ? kgToLbs(localSettings.targetWeightKg) : ''
      : localSettings.targetWeightKg ?? '';

  const handleCurrentWeightChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      setLocalSettings({ ...localSettings, bodyWeightKg: undefined });
      return;
    }
    const kg = localSettings.unit === 'lbs' ? lbsToKg(val) : val;
    setLocalSettings({ ...localSettings, bodyWeightKg: Math.round(kg * 10) / 10 });
  };

  const handleTargetWeightChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      setLocalSettings({ ...localSettings, targetWeightKg: undefined });
      return;
    }
    const kg = localSettings.unit === 'lbs' ? lbsToKg(val) : val;
    setLocalSettings({ ...localSettings, targetWeightKg: Math.round(kg * 10) / 10 });
  };

  // BMI and Delta calculation
  let bmi: string | null = null;
  if (localSettings.bodyWeightKg && localSettings.heightCm && localSettings.heightCm > 0) {
    const hM = localSettings.heightCm / 100;
    bmi = (localSettings.bodyWeightKg / (hM * hM)).toFixed(1);
  }

  let heightFtIn: string | null = null;
  if (localSettings.heightCm && localSettings.heightCm > 0) {
    const totalInches = localSettings.heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    heightFtIn = `${feet}'${inches}"`;
  }

  const weightDeltaKg =
    localSettings.targetWeightKg && localSettings.bodyWeightKg
      ? Math.round((localSettings.targetWeightKg - localSettings.bodyWeightKg) * 10) / 10
      : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Preferences & AI</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Customize tracking parameters & Gemini intelligence
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Units Preference */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={18} color="var(--accent-volt)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Weight Measurement</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="timer-chip"
                style={{
                  background: localSettings.unit === 'kg' ? 'var(--accent-volt)' : undefined,
                  color: localSettings.unit === 'kg' ? '#050D0A' : undefined,
                  fontWeight: 800,
                  padding: '6px 14px'
                }}
                onClick={() => setLocalSettings({ ...localSettings, unit: 'kg' })}
              >
                Metric (kg)
              </button>
              <button
                className="timer-chip"
                style={{
                  background: localSettings.unit === 'lbs' ? 'var(--accent-volt)' : undefined,
                  color: localSettings.unit === 'lbs' ? '#050D0A' : undefined,
                  fontWeight: 800,
                  padding: '6px 14px'
                }}
                onClick={() => setLocalSettings({ ...localSettings, unit: 'lbs' })}
              >
                Imperial (lbs)
              </button>
            </div>
          </div>
        </div>

        {/* Body Metrics & Target Weight Section */}
        <div
          className="gym-card"
          style={{
            border: '1px solid rgba(0, 245, 155, 0.3)',
            background: 'linear-gradient(180deg, rgba(0, 245, 155, 0.05) 0%, var(--bg-card) 100%)',
            padding: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={18} color="var(--accent-volt)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Body Metrics & Goals</span>
            </div>
            {weightDeltaKg !== null && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: weightDeltaKg > 0 ? 'rgba(0, 245, 155, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                  color: weightDeltaKg > 0 ? 'var(--accent-volt)' : 'var(--accent-cyan)'
                }}
              >
                {weightDeltaKg > 0
                  ? `+${localSettings.unit === 'lbs' ? kgToLbs(weightDeltaKg) : weightDeltaKg} ${localSettings.unit} (Hypertrophy Surplus)`
                  : `${localSettings.unit === 'lbs' ? kgToLbs(weightDeltaKg) : weightDeltaKg} ${localSettings.unit} (Cut / Lean Down)`}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 12px' }}>
            {/* Current Weight */}
            <div>
              <label className="settings-label">
                Current Weight ({localSettings.unit})
              </label>
              <input
                type="number"
                step="0.1"
                className="settings-input"
                value={displayCurrentWeight}
                onChange={(e) => handleCurrentWeightChange(e.target.value)}
                placeholder={localSettings.unit === 'kg' ? '80' : '176'}
              />
            </div>

            {/* Target Weight */}
            <div>
              <label className="settings-label">
                Target Weight ({localSettings.unit})
              </label>
              <input
                type="number"
                step="0.1"
                className="settings-input"
                value={displayTargetWeight}
                onChange={(e) => handleTargetWeightChange(e.target.value)}
                placeholder={localSettings.unit === 'kg' ? '85' : '187'}
              />
            </div>

            {/* Height */}
            <div>
              <label className="settings-label">
                Height (cm)
              </label>
              <input
                type="number"
                className="settings-input"
                value={localSettings.heightCm || ''}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, heightCm: parseFloat(e.target.value) || undefined })
                }
                placeholder="180"
              />
            </div>

            {/* Age */}
            <div>
              <label className="settings-label">
                Age (years)
              </label>
              <input
                type="number"
                className="settings-input"
                value={localSettings.age || ''}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, age: parseInt(e.target.value, 10) || undefined })
                }
                placeholder="25"
              />
            </div>
          </div>

          {/* Quick Body Composition Status Strip */}
          {(bmi || heightFtIn) && (
            <div
              style={{
                marginTop: 14,
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 10
              }}
            >
              {bmi && (
                <span>
                  BMI: <strong style={{ color: '#fff' }}>{bmi}</strong>
                </span>
              )}
              {heightFtIn && (
                <span>
                  Height Ref: <strong style={{ color: '#fff' }}>{heightFtIn}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Gemini API Key */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Key size={18} color="var(--accent-cyan)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Google Gemini API Key</span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.45 }}>
            Powers instant workout debriefs, smart equipment alternatives, and interactive AI coaching.
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type={showKey ? 'text' : 'password'}
              className="settings-input"
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              value={localSettings.geminiApiKey}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })
              }
              placeholder="AIzaSy..."
            />
            <button
              type="button"
              className="timer-chip"
              onClick={() => setShowKey(!showKey)}
              style={{ minHeight: 44, padding: '0 16px', fontWeight: 800, whiteSpace: 'nowrap' }}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Rest Timer Default */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--accent-amber)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Default Rest Timer</span>
            </div>
            <select
              className="settings-input"
              style={{ width: 'auto', minWidth: 160, minHeight: 42, padding: '8px 12px', fontSize: '0.85rem' }}
              value={localSettings.defaultRestSeconds}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  defaultRestSeconds: parseInt(e.target.value, 10)
                })
              }
            >
              <option value={60}>60 Seconds</option>
              <option value={90}>90 Seconds (Hypertrophy)</option>
              <option value={120}>2 Minutes (Heavy Compound)</option>
              <option value={180}>3 Minutes (Strength/Squats)</option>
            </select>
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={18} color="#fff" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Audio Chimes & PR Fanfare</span>
            </div>
            <input
              type="checkbox"
              style={{ width: 22, height: 22, accentColor: 'var(--accent-volt)', cursor: 'pointer' }}
              checked={localSettings.soundEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })
              }
            />
          </div>
        </div>

        {/* Athlete Name */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <User size={18} color="#fff" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Athlete Name</span>
          </div>
          <input
            type="text"
            className="settings-input"
            value={localSettings.userName}
            onChange={(e) => setLocalSettings({ ...localSettings, userName: e.target.value })}
            placeholder="Athlete"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, paddingBottom: 16 }}>
          <button className="btn-primary" style={{ minHeight: 48, fontSize: '1rem', fontWeight: 800 }} onClick={handleSave}>
            {savedAlert ? (
              <>
                <Check size={18} /> Settings Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </button>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-crimson)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 8,
              cursor: 'pointer'
            }}
            onClick={() => {
              if (window.confirm('Reset workout history and PRs to initial baseline?')) {
                onResetData();
                onClose();
              }
            }}
          >
            <RotateCcw size={14} /> Reset Demo History
          </button>
        </div>
      </div>
    </div>
  );
};
