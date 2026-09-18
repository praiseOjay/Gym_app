import React, { useState, useRef, useEffect } from 'react';
import type { UserSettings } from '../types/gym';
import { kgToLbs, lbsToKg, cmToFeet, feetToCm } from '../engine/overloadEngine';
import { StorageService } from '../db/storage';
import { triggerHaptic } from '../utils/haptics';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import {
  X,
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
  Smartphone,
  Copy,
  Clipboard,
  FileText,
  Crown,
  Sparkles,
  Globe,
  Bot,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WorkoutImportModal } from './WorkoutImportModal';
import { SwipeableModalSheet } from './SwipeableModalSheet';
import { subscriptionService } from '../services/subscriptionService';
import { currencyService, SUPPORTED_CURRENCIES } from '../services/currencyService';
import { aiProxyService } from '../services/aiProxyService';
import { PaywallModal } from './PaywallModal';

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
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showWorkoutImportModal, setShowWorkoutImportModal] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [subState, setSubState] = useState(() => subscriptionService.getState());
  const [showPaywall, setShowPaywall] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDevAIOptions, setShowDevAIOptions] = useState(false);
  const [customProxyUrl, setCustomProxyUrl] = useState(() => aiProxyService.getProxyUrl());
  const [aiStatus, setAiStatus] = useState(() => aiProxyService.getStatus());
  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubSub = subscriptionService.subscribe((s) => setSubState(s));
    const unsubAI = aiProxyService.subscribe(() => setAiStatus(aiProxyService.getStatus()));
    return () => {
      unsubSub();
      unsubAI();
    };
  }, []);

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    setRestoreMsg(null);
    triggerHaptic('medium');
    try {
      const res = await subscriptionService.restorePurchases();
      if (res.isPro) {
        triggerHaptic('success');
      } else {
        triggerHaptic('warning');
      }
      setRestoreMsg(res.message);
      setTimeout(() => setRestoreMsg(null), 4000);
    } catch (err: any) {
      setRestoreMsg(`Restore failed: ${err.message}`);
      setTimeout(() => setRestoreMsg(null), 4000);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleToggleDevPro = () => {
    triggerHaptic('light');
    const next = subscriptionService.toggleDevPro();
    setSubState(next);
  };

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
   * Universal export function supporting Native Android/iOS Capacitor Share, Mobile Web Share API, and desktop fallbacks.
   */
  const exportFile = async (content: string, fileName: string, contentType: string) => {
    setExportStatus(`Preparing ${fileName}...`);
    try {
      // 1. Android / iOS Native Capacitor App Export
      if (Capacitor.isNativePlatform()) {
        try {
          const fileResult = await Filesystem.writeFile({
            path: fileName,
            data: content,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
          });

          // Do NOT pass 'text' when sharing a file, as Capacitor Android will force
          // intent.setType("text/plain"), causing Android to name it 'transfer doc.txt'.
          // Passing 'files' allows Capacitor to look up the exact MIME type (text/csv or application/json)
          await Share.share({
            title: fileName,
            files: [fileResult.uri],
            dialogTitle: `Save or Share ${fileName}`
          });

          setExportStatus(`✓ Exported ${fileName} via Android Share!`);
          setTimeout(() => setExportStatus(null), 4000);
          return;
        } catch (nativeErr: any) {
          console.warn('Capacitor native export failed, falling back:', nativeErr);
          if (
            nativeErr?.message?.toLowerCase().includes('canceled') ||
            nativeErr?.message?.toLowerCase().includes('cancelled')
          ) {
            setExportStatus(null);
            return;
          }
        }
      }

      // 2. Mobile Native Web Share API with File
      const blob = new Blob([content], { type: contentType });
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

      // 3. Fallback: DOM anchor download attached to body
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
      // 4. Fallback: Copy to clipboard if writing is blocked
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

  const handleCopyJSON = async () => {
    triggerHaptic('medium');
    try {
      const json = StorageService.exportFullBackupJSON();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(json);
      } else {
        const ta = document.createElement('textarea');
        ta.value = json;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      triggerHaptic('success');
      setExportStatus('✓ Full backup JSON copied to clipboard!');
      setTimeout(() => setExportStatus(null), 4000);
    } catch (err: any) {
      setExportStatus(`⚠️ Could not copy: ${err.message}`);
      setTimeout(() => setExportStatus(null), 4000);
    }
  };

  const handleExportCSV = async () => {
    triggerHaptic('medium');
    const csv = StorageService.exportWorkoutsCSV();
    const dateStr = new Date().toISOString().split('T')[0];
    await exportFile(csv, `overload-ai-workouts-${dateStr}.csv`, 'text/csv');
    triggerHaptic('success');
  };

  const handleCopyCSV = async () => {
    triggerHaptic('medium');
    try {
      const csv = StorageService.exportWorkoutsCSV();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(csv);
      } else {
        const ta = document.createElement('textarea');
        ta.value = csv;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      triggerHaptic('success');
      setExportStatus('✓ Workout logs CSV copied to clipboard!');
      setTimeout(() => setExportStatus(null), 4000);
    } catch (err: any) {
      setExportStatus(`⚠️ Could not copy: ${err.message}`);
      setTimeout(() => setExportStatus(null), 4000);
    }
  };

  const processBackupString = (content: string): boolean => {
    if (!content || !content.trim()) {
      setExportStatus('⚠️ Empty backup content provided.');
      setTimeout(() => setExportStatus(null), 4000);
      return false;
    }
    try {
      setExportStatus('Validating and restoring backup...');
      const res = StorageService.importFullBackupJSON(content);
      if (res.success) {
        triggerHaptic('success');
        setExportStatus('✓ Backup restored successfully! Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
        return true;
      } else {
        triggerHaptic('warning');
        setExportStatus(`⚠️ ${res.message}`);
        setTimeout(() => setExportStatus(null), 6000);
        return false;
      }
    } catch (err: any) {
      triggerHaptic('warning');
      setExportStatus(`⚠️ Invalid JSON: ${err.message}`);
      setTimeout(() => setExportStatus(null), 6000);
      return false;
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Reset immediately so subsequent file selections always fire onChange
    if (!file) return;

    setExportStatus(`Reading ${file.name}...`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processBackupString(content);
    };
    reader.onerror = () => {
      setExportStatus('⚠️ Could not read file from device.');
      setTimeout(() => setExportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  const handlePasteFromClipboard = async () => {
    triggerHaptic('light');
    setPasteError(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPastedJsonText(text);
          triggerHaptic('success');
          return;
        }
      }
    } catch (err: any) {
      console.warn('Clipboard auto-read failed:', err);
    }
    setPasteError('Could not auto-read clipboard. Please long-press inside the box and tap Paste.');
  };

  const handleConfirmPastedRestore = () => {
    if (!pastedJsonText.trim()) {
      setPasteError('Please paste your backup JSON text first.');
      return;
    }
    const ok = processBackupString(pastedJsonText);
    if (ok) {
      setShowPasteModal(false);
    } else {
      setPasteError('Invalid backup JSON format. Please verify the copied text.');
    }
  };

  const handleSave = () => {
    aiProxyService.setCustomKey(localSettings.geminiApiKey || '');
    aiProxyService.setProxyUrl(customProxyUrl);
    onSave(localSettings);
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 800);
  };

  // Convert weights and height for display based on selected unit (rounded to 2 decimal places)
  const displayCurrentWeight =
    localSettings.unit === 'lbs'
      ? localSettings.bodyWeightKg !== undefined ? kgToLbs(localSettings.bodyWeightKg) : ''
      : localSettings.bodyWeightKg !== undefined ? Math.round(localSettings.bodyWeightKg * 100) / 100 : '';

  const displayTargetWeight =
    localSettings.unit === 'lbs'
      ? localSettings.targetWeightKg !== undefined ? kgToLbs(localSettings.targetWeightKg) : ''
      : localSettings.targetWeightKg !== undefined ? Math.round(localSettings.targetWeightKg * 100) / 100 : '';

  const displayHeight =
    localSettings.unit === 'lbs'
      ? localSettings.heightCm !== undefined ? cmToFeet(localSettings.heightCm) : ''
      : localSettings.heightCm !== undefined ? Math.round(localSettings.heightCm * 100) / 100 : '';

  const handleCurrentWeightChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      setLocalSettings({ ...localSettings, bodyWeightKg: undefined });
      return;
    }
    const kg = localSettings.unit === 'lbs' ? lbsToKg(val) : val;
    setLocalSettings({ ...localSettings, bodyWeightKg: Math.round(kg * 100) / 100 });
  };

  const handleTargetWeightChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      setLocalSettings({ ...localSettings, targetWeightKg: undefined });
      return;
    }
    const kg = localSettings.unit === 'lbs' ? lbsToKg(val) : val;
    setLocalSettings({ ...localSettings, targetWeightKg: Math.round(kg * 100) / 100 });
  };

  const handleHeightChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) {
      setLocalSettings({ ...localSettings, heightCm: undefined });
      return;
    }
    const cm = localSettings.unit === 'lbs' ? feetToCm(val) : val;
    setLocalSettings({ ...localSettings, heightCm: Math.round(cm * 100) / 100 });
  };

  // BMI and Delta calculation (rounded to 2 decimal places)
  let bmi: string | null = null;
  if (localSettings.bodyWeightKg && localSettings.heightCm && localSettings.heightCm > 0) {
    const hM = localSettings.heightCm / 100;
    bmi = (localSettings.bodyWeightKg / (hM * hM)).toFixed(2);
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
      ? Math.round((localSettings.targetWeightKg - localSettings.bodyWeightKg) * 100) / 100
      : null;

  return (
    <>
      <SwipeableModalSheet onClose={onClose}>
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

        {/* Membership & Subscription Tier Card */}
        <div
          className="gym-card"
          style={{
            background: subState.isPro
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(0, 245, 155, 0.08) 50%, rgba(5, 13, 10, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(0, 245, 155, 0.08) 0%, rgba(5, 13, 10, 0.95) 100%)',
            border: subState.isPro
              ? '1px solid rgba(255, 215, 0, 0.45)'
              : '1px solid rgba(0, 245, 155, 0.3)',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: subState.isPro
                    ? 'linear-gradient(135deg, #ffd700, #ffaa00)'
                    : 'rgba(0, 245, 155, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: subState.isPro ? '#050D0A' : 'var(--accent-volt)'
                }}
              >
                {subState.isPro ? <Crown size={20} /> : <Sparkles size={20} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                    {subState.isPro ? 'Overload Pro' : 'Free Athlete'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: subState.isPro ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      color: subState.isPro ? '#ffd700' : 'var(--text-secondary)',
                      border: subState.isPro ? '1px solid rgba(255, 215, 0, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    {subState.isPro ? `${subState.plan.toUpperCase()} ACTIVE` : 'STANDARD'}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {subState.isPro
                    ? 'Unlimited routines, AI Coach, volume landmarks & periodization'
                    : 'Up to 3 custom routines & 3 AI queries daily'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {!subState.isPro ? (
              <button
                type="button"
                className="btn-primary"
                style={{
                  flex: 1,
                  minWidth: 140,
                  fontSize: '0.82rem',
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
                onClick={() => setShowPaywall(true)}
              >
                <Sparkles size={15} /> Upgrade to Pro
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                style={{
                  flex: 1,
                  minWidth: 140,
                  fontSize: '0.82rem',
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
                onClick={() => setShowPaywall(true)}
              >
                View Plans / Change Tier
              </button>
            )}

            {/* Google Play Compliance Restore Purchases */}
            <button
              type="button"
              className="btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '9px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
              onClick={handleRestorePurchases}
              disabled={isRestoring}
            >
              <RotateCcw size={14} className={isRestoring ? 'spin' : ''} />
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </button>
          </div>

          {/* Restore feedback toast */}
          {restoreMsg && (
            <div
              style={{
                marginTop: 10,
                fontSize: '0.75rem',
                color: subState.isPro ? 'var(--accent-volt)' : 'var(--text-secondary)',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {restoreMsg}
            </div>
          )}

          {/* Dev Mode Sandbox Toggle */}
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Developer Sandbox Mode
            </span>
            <button
              type="button"
              onClick={handleToggleDevPro}
              style={{
                background: subState.isPro ? 'rgba(0, 245, 155, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                border: subState.isPro ? '1px solid var(--accent-volt)' : '1px solid rgba(255, 255, 255, 0.15)',
                color: subState.isPro ? 'var(--accent-volt)' : 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer'
              }}
            >
              Switch to {subState.isPro ? 'Free' : 'Pro (Simulated)'}
            </button>
          </div>
        </div>

        {/* Units System Preference */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={18} color="var(--accent-volt)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Units System</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Weight ({localSettings.unit}) & Height ({localSettings.unit === 'lbs' ? 'ft' : 'cm'}) · 2 decimal precision
                </div>
              </div>
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
                Metric (kg / cm)
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
                Imperial (lbs / ft)
              </button>
            </div>
          </div>
        </div>

        {/* Currency & Pricing Preference */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={18} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Store Currency</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Default is GBP (£). Auto-detects your country currency.
                </div>
              </div>
            </div>
            <select
              value={currencyService.getCurrency()}
              onChange={(e) => {
                currencyService.setCurrency(e.target.value);
                setLocalSettings({ ...localSettings, preferredCurrency: e.target.value });
              }}
              style={{
                background: 'var(--bg-surface)',
                color: '#fff',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="auto">Auto ({currencyService.getDetectedCurrency()})</option>
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
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
                step="0.01"
                className="settings-input"
                value={displayCurrentWeight}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleCurrentWeightChange(e.target.value)}
                placeholder={localSettings.unit === 'kg' ? '80.00' : '176.37'}
              />
            </div>

            {/* Target Weight */}
            <div>
              <label className="settings-label">
                Target Weight ({localSettings.unit})
              </label>
              <input
                type="number"
                step="0.01"
                className="settings-input"
                value={displayTargetWeight}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleTargetWeightChange(e.target.value)}
                placeholder={localSettings.unit === 'kg' ? '85.00' : '187.39'}
              />
            </div>

            {/* Height */}
            <div>
              <label className="settings-label">
                Height ({localSettings.unit === 'lbs' ? 'ft' : 'cm'})
              </label>
              <input
                type="number"
                step="0.01"
                className="settings-input"
                value={displayHeight}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleHeightChange(e.target.value)}
                placeholder={localSettings.unit === 'lbs' ? '5.91' : '180.00'}
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
                onFocus={(e) => e.target.select()}
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
                  BMI: <strong style={{ color: 'var(--accent-volt)' }}>{bmi}</strong>
                </span>
              )}
              {heightFtIn && (
                <span>
                  Height:{' '}
                  <strong style={{ color: '#fff' }}>
                    {localSettings.unit === 'lbs'
                      ? `${cmToFeet(localSettings.heightCm || 0)} ft`
                      : `${Math.round((localSettings.heightCm || 0) * 100) / 100} cm`}{' '}
                    ({heightFtIn})
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* AI Intelligence Cloud Engine & Security Proxy Card */}
        <div className="gym-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={18} color="var(--accent-volt)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Intelligence Cloud Engine</span>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                background: aiStatus.mode === 'custom_key' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 245, 155, 0.12)',
                color: aiStatus.mode === 'custom_key' ? '#ffd700' : 'var(--accent-volt)',
                border: aiStatus.mode === 'custom_key' ? '1px solid rgba(255, 215, 0, 0.35)' : '1px solid rgba(0, 245, 155, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <ShieldCheck size={11} />
              <span>{aiStatus.providerName}</span>
            </span>
          </div>

          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.45 }}>
            Powers Coach Overload debriefs, smart exercise swaps, and periodization tuning with Google Gemini.
            <strong> No API key setup required</strong> — secured through our cloud proxy.
          </p>

          {/* Developer BYOK / Custom Proxy Toggle */}
          <button
            type="button"
            onClick={() => setShowDevAIOptions(!showDevAIOptions)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              padding: 0,
              marginBottom: showDevAIOptions ? 10 : 0
            }}
          >
            <span>Advanced Developer Options (Custom Key / Proxy)</span>
            {showDevAIOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showDevAIOptions && (
            <div
              style={{
                marginTop: 8,
                padding: '12px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div>
                <label className="settings-label" style={{ marginBottom: 4 }}>
                  Custom Gemini API Key (Optional BYOK)
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="settings-input"
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                    value={localSettings.geminiApiKey || ''}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, geminiApiKey: e.target.value })
                    }
                    placeholder="Leave empty to use managed cloud proxy"
                  />
                  <button
                    type="button"
                    className="timer-chip"
                    onClick={() => setShowKey(!showKey)}
                    style={{ minHeight: 38, padding: '0 12px', fontSize: '0.75rem', fontWeight: 800 }}
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Supply your personal Google AI Studio key to override the cloud engine.
                </div>
              </div>

              <div>
                <label className="settings-label" style={{ marginBottom: 4 }}>
                  Custom Proxy Endpoint URL (Optional)
                </label>
                <input
                  type="text"
                  className="settings-input"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                  value={customProxyUrl}
                  onChange={(e) => setCustomProxyUrl(e.target.value)}
                  placeholder="https://<project-ref>.supabase.co/functions/v1/gemini-proxy"
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Self-hosted Supabase, Firebase, or Cloudflare Worker endpoint URL.
                </div>
              </div>
            </div>
          )}
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
            accept="application/json,text/plain,*/*,.json"
            style={{
              position: 'fixed',
              top: -9999,
              left: -9999,
              opacity: 0,
              pointerEvents: 'none',
              width: 1,
              height: 1
            }}
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
                title="Download full JSON backup or share to Drive/WhatsApp/Files"
              >
                <Download size={14} /> Export Backup (JSON)
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => fileInputRef.current?.click()}
                title="Restore workouts and splits from JSON file"
              >
                <Upload size={14} /> Import File (.json)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={handleCopyJSON}
                title="Copy entire JSON backup text directly to clipboard"
              >
                <Copy size={14} /> Copy Backup JSON
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => {
                  setPasteError(null);
                  setShowPasteModal(true);
                }}
                title="Paste JSON text to restore without needing file picker"
              >
                <FileText size={14} /> Paste JSON Text
              </button>
            </div>

            <div style={{ margin: '4px 0 2px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.25) 0%, rgba(0, 229, 255, 0.18) 100%)',
                  border: '1px solid rgba(0, 245, 155, 0.45)',
                  color: '#fff',
                  borderRadius: 'var(--radius-md)'
                }}
                onClick={() => {
                  triggerHaptic('light');
                  setShowWorkoutImportModal(true);
                }}
                title="Import workouts from Strong, Hevy, FitNotes, CSV or JSON"
              >
                <FileSpreadsheet size={16} color="var(--accent-volt)" />
                Import Workout Logs (CSV / JSON)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={handleExportCSV}
                title="Download CSV spreadsheet of all workout sets"
              >
                <FileSpreadsheet size={14} color="var(--accent-volt)" /> Export Logs (CSV)
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={handleCopyCSV}
                title="Copy entire CSV spreadsheet directly to clipboard"
              >
                <Copy size={14} /> Copy CSV Text
              </button>
            </div>
          </div>
        </div>

        {/* Legal & Health Compliance */}
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ShieldCheck size={18} color="var(--accent-volt)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Legal & Health Compliance
            </h3>
          </div>

          <div
            style={{
              background: 'rgba(255, 170, 0, 0.08)',
              border: '1px solid rgba(255, 170, 0, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '14px'
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFD166', marginBottom: 4 }}>
              ⚠️ Health & Medical Advisory
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Overload AI provides periodization targets and progressive overload tracking for educational and fitness logging purposes only. It is not medical advice. Consult a healthcare professional before starting any strenuous training regimen.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => setShowLegalModal('privacy')}
            >
              <FileText size={14} color="var(--accent-cyan)" /> Privacy Policy
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => setShowLegalModal('terms')}
            >
              <FileText size={14} color="var(--accent-volt)" /> Terms of Service
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Overload AI v1.0.0 (Build 1)</span>
            <span style={{ color: 'var(--accent-volt)' }}>100% Offline-First Engine</span>
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
      </SwipeableModalSheet>

      {/* Paste JSON Modal Dialog */}
      {showPasteModal && (
        <SwipeableModalSheet
          onClose={() => setShowPasteModal(false)}
          overlayStyle={{ zIndex: 9999 }}
          maxHeight="85vh"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={18} color="var(--accent-volt)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  Paste Backup JSON
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>
              Paste your backup JSON directly or tap <strong>Paste from Clipboard</strong> to restore your history, routines, and PRs without needing file access permissions.
            </p>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginBottom: 10, padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={handlePasteFromClipboard}
            >
              <Clipboard size={14} color="var(--accent-volt)" /> Paste from Clipboard
            </button>

            <textarea
              value={pastedJsonText}
              onChange={(e) => {
                setPastedJsonText(e.target.value);
                setPasteError(null);
              }}
              placeholder='Paste {"version": 3, "workouts": [...]} here...'
              style={{
                width: '100%',
                height: 160,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                padding: '10px',
                resize: 'vertical',
                marginBottom: 10,
                boxSizing: 'border-box'
              }}
            />

            {pasteError && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-crimson)', marginBottom: 10, fontWeight: 700 }}>
                ⚠️ {pasteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowPasteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 2 }}
                onClick={handleConfirmPastedRestore}
              >
                Restore Backup Data
              </button>
            </div>
        </SwipeableModalSheet>
      )}

      {showWorkoutImportModal && (
        <WorkoutImportModal
          onClose={() => setShowWorkoutImportModal(false)}
        />
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="general"
        onSuccess={() => setSubState(subscriptionService.getState())}
      />

      {/* In-App Legal & Compliance Modal */}
      {showLegalModal && (
        <SwipeableModalSheet
          onClose={() => setShowLegalModal(null)}
          overlayStyle={{ zIndex: 9999 }}
          maxHeight="85vh"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="var(--accent-volt)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {showLegalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowLegalModal(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4, color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
            {showLegalModal === 'privacy' ? (
              <>
                <div style={{ background: 'rgba(0, 245, 155, 0.08)', border: '1px solid rgba(0, 245, 155, 0.25)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-volt)', marginBottom: 4 }}>At a Glance:</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#fff' }}>
                    <li><strong>Offline-First Storage:</strong> Workouts, sets, and weights are stored locally in IndexedDB on your device. Never sold.</li>
                    <li><strong>Ephemeral Voice Audio:</strong> Spoken entries are transcribed in real-time and immediately discarded. Never stored or shared.</li>
                    <li><strong>Gemini AI Intelligence:</strong> Questions are proxied securely without personal identity details.</li>
                  </ul>
                </div>
                <p><strong>1. Information Collection:</strong> Overload AI operates locally on your personal device. Workout history, personal bests, and custom routines are stored in your device's local browser/Capacitor database (IndexedDB).</p>
                <p><strong>2. Microphone Permission:</strong> The microphone is requested solely for optional hands-free workout logging. Audio is processed ephemerally on-the-fly and never stored.</p>
                <p><strong>3. Artificial Intelligence:</strong> Prompt context for workout advice is sent securely to Google Gemini without personally identifying data.</p>
                <p><strong>4. User Data Control:</strong> You can completely erase your workout records at any time using the Reset Data button in Settings.</p>
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Official Public Policy: </span>
                  <a href="https://praiseojay.github.io/Gym_app/privacy-policy.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                    https://praiseojay.github.io/Gym_app/privacy-policy.html
                  </a>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: 'rgba(255, 68, 68, 0.08)', border: '1px solid rgba(255, 68, 68, 0.25)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: '#FF6B6B', marginBottom: 4 }}>⚠️ Health & Fitness Disclaimer:</div>
                  <p style={{ margin: 0, color: '#FFBABA' }}>Overload AI is designed solely for self-tracking and educational purposes. It does not provide medical advice. Consult a physician before beginning any exercise routine.</p>
                </div>
                <p><strong>1. License:</strong> Praise Ojay grants you a personal, revocable license to use Overload AI for personal fitness logging.</p>
                <p><strong>2. In-App Subscriptions:</strong> Overload Pro subscriptions and lifetime passes are processed through Google Play Billing. Subscriptions auto-renew unless cancelled at least 24 hours prior to expiration via Google Play Subscriptions settings.</p>
                <p><strong>3. Limitation of Liability:</strong> You assume full personal risk and responsibility for your physical training activities and exercise execution.</p>
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Official Public Terms: </span>
                  <a href="https://praiseojay.github.io/Gym_app/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-volt)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                    https://praiseojay.github.io/Gym_app/terms.html
                  </a>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.8rem', padding: '10px' }}
              onClick={() => {
                const url = showLegalModal === 'privacy' 
                  ? 'https://praiseojay.github.io/Gym_app/privacy-policy.html' 
                  : 'https://praiseojay.github.io/Gym_app/terms.html';
                window.open(url, '_blank');
              }}
            >
              Open Web Version
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ flex: 1, fontSize: '0.8rem', padding: '10px' }}
              onClick={() => setShowLegalModal(null)}
            >
              Close
            </button>
          </div>
        </SwipeableModalSheet>
      )}
    </>
  );
};
