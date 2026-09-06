import React, { useState, useRef, useEffect } from 'react';
import type { UserSettings } from '../types/gym';
import { kgToLbs, lbsToKg } from '../engine/overloadEngine';
import { StorageService } from '../db/storage';
import { triggerHaptic } from '../utils/haptics';
import {
  X,
  Key,
  Volume2,
  Scale,
  Clock,
  User,
  Check,
  RotateCcw,
  Target,
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  Smartphone
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
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch {}
  };

  /**
   * Universal export function supporting Mobile Web Share API, standalone PWAs, iOS Safari, Android, and desktop.
   */
  const exportFile = async (content: string, fileName: string, contentType: string) => {
    setExportStatus(`Preparing ${fileName}...`);
    try {
      const blob = new Blob([content], { type: contentType });

      // 1. Mobile Native Web Share API with File (iOS Safari, Android Chrome, and PWA standalone mode)
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          const file = new File([blob], fileName, { type: contentType });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: fileName,
              text: `Overload AI: ${fileName}`
            });
            setExportStatus(`✓ Shared / Saved ${fileName}!`);
            setTimeout(() => setExportStatus(null), 4000);
            return;
          }
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setExportStatus(null);
            return;
          }
          console.warn('Native file share failed, falling back to anchor download:', shareErr);
        }
      }

      // 2. Fallback: DOM anchor download attached to body with safe delayed revocation
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      a.setAttribute('download', fileName);
      a.target = '_blank';
      document.body.appendChild(a);

      a.click();
      setExportStatus(`✓ Download started: ${fileName}`);
      setTimeout(() => setExportStatus(null), 4000);

      // Keep URL alive for 60 seconds so mobile OS background workers can finish saving
      setTimeout(() => {
        try {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
          URL.revokeObjectURL(url);
        } catch {}
      }, 60000);
    } catch (err: any) {
      console.error('Export error:', err);
      // 3. Fallback: Copy to clipboard if file writing is blocked by browser
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(content);
          setExportStatus(`✓ Copied to clipboard! (Paste into Notes or file)`);
          setTimeout(() => setExportStatus(null), 5000);
          return;
        }
      } catch {}
      setExportStatus(`⚠️ Export error: ${err.message || 'Could not save file'}`);
      setTimeout(() => setExportStatus(null), 5000);
    }
  };

  const handleExportJSON = async () => {
    triggerHaptic('medium');
    const json = StorageService.exportFullBackupJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    await exportFile(json, `overload-ai-backup-${dateStr}.json`, 'application/json');
    triggerHaptic('success');
  };

  const handleExportCSV = async () => {
    triggerHaptic('medium');
    const csv = StorageService.exportWorkoutsCSV();
    const dateStr = new Date().toISOString().split('T')[0];
    await exportFile(csv, `overload-ai-workouts-${dateStr}.csv`, 'text/csv');
    triggerHaptic('success');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.importFullBackupJSON(content);
      if (res.success) {
        triggerHaptic('success');
        alert('Backup restored successfully! The app will now reload.');
        window.location.reload();
      } else {
        triggerHaptic('warning');
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

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

        {/* PWA & Offline Engine Status */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Smartphone size={18} color="var(--accent-volt)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>App & Offline Storage</span>
            </div>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: 'var(--accent-volt)',
                background: 'rgba(0, 245, 155, 0.12)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              IndexedDB Active
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.45 }}>
            Overload AI runs offline with client-side high-capacity IndexedDB storage and cache-first service workers.
          </p>

          {deferredPrompt ? (
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleInstallPWA}
            >
              <Smartphone size={16} /> Install Overload AI to Home Screen
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <span>💡 Tip: Tap Share &gt; "Add to Home Screen" in Safari or Chrome for a full native app experience.</span>
            </div>
          )}
        </div>

        {/* Data Management & Backups */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Database size={18} color="var(--accent-volt)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Data Safety & Backups</span>
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.45 }}>
            Export full JSON backups to prevent data loss or export CSV spreadsheets of all your workout sets.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportJSON}
          />

          {/* Real-time Export / Save Status Banner */}
          {exportStatus && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: exportStatus.startsWith('✓') ? 'rgba(0, 245, 155, 0.15)' : exportStatus.startsWith('⚠️') ? 'rgba(255, 51, 102, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                border: `1px solid ${exportStatus.startsWith('✓') ? 'rgba(0, 245, 155, 0.4)' : exportStatus.startsWith('⚠️') ? 'rgba(255, 51, 102, 0.4)' : 'rgba(0, 229, 255, 0.4)'}`,
                color: exportStatus.startsWith('✓') ? '#00F59B' : exportStatus.startsWith('⚠️') ? '#FF3366' : 'var(--accent-cyan)',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
                animation: 'slide-down 0.2s ease'
              }}
            >
              <span>{exportStatus}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={handleExportJSON}
                title="Download full JSON backup of all workouts, routines, and PRs"
              >
                <Download size={14} /> Export Backup (JSON)
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => fileInputRef.current?.click()}
                title="Restore workouts and splits from JSON backup"
              >
                <Upload size={14} /> Import Backup (JSON)
              </button>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={handleExportCSV}
              title="Download CSV spreadsheet of all workout sets"
            >
              <FileSpreadsheet size={14} color="var(--accent-volt)" /> Export Workout Logs (CSV)
            </button>
          </div>
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
