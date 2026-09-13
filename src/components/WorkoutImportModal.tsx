import React, { useState, useRef } from 'react';
import { StorageService } from '../db/storage';
import { parseWorkoutLogs, type WorkoutImportResult } from '../services/workoutImportService';
import { triggerHaptic } from '../utils/haptics';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Clipboard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SwipeableModalSheet } from './SwipeableModalSheet';

interface WorkoutImportModalProps {
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const WorkoutImportModal: React.FC<WorkoutImportModalProps> = ({
  onClose,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [rawContent, setRawContent] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<WorkoutImportResult | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessContent = (content: string, name?: string) => {
    setStatusError(null);
    setSuccessInfo(null);
    setRawContent(content);
    if (name) setFileName(name);

    if (!content.trim()) {
      setParsedPreview(null);
      return;
    }

    try {
      const res = parseWorkoutLogs(content);
      if (res.success && res.sessions.length > 0) {
        setParsedPreview(res);
        triggerHaptic('success');
      } else {
        setParsedPreview(null);
        setStatusError(res.message || 'No valid workouts found in the content.');
        triggerHaptic('warning');
      }
    } catch (err: any) {
      setParsedPreview(null);
      setStatusError(err?.message || 'Failed to parse file. Please verify format.');
      triggerHaptic('warning');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Reset input to allow re-selecting same file
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      handleProcessContent(text, file.name);
    };
    reader.onerror = () => {
      setStatusError('Failed to read file from your device.');
      triggerHaptic('warning');
    };
    reader.readAsText(file);
  };

  const handlePasteFromClipboard = async () => {
    triggerHaptic('light');
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          handleProcessContent(text, 'Clipboard Paste');
          return;
        }
      }
    } catch {
      // Clipboard read failed or denied
    }
    setStatusError('Could not auto-read clipboard. Please paste your text directly into the text box.');
  };

  const handleExecuteImport = () => {
    if (!rawContent || !parsedPreview) return;

    if (importMode === 'replace') {
      const confirmed = window.confirm(
        '⚠️ ARE YOU SURE? Replace mode will overwrite your current workout history with these imported workouts. This cannot be undone.'
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    triggerHaptic('medium');

    setTimeout(() => {
      try {
        const result = StorageService.importWorkoutLogs(rawContent, importMode);
        if (result.success) {
          triggerHaptic('success');
          setSuccessInfo(result.message);
          if (onImportSuccess) onImportSuccess();

          setTimeout(() => {
            window.location.reload();
          }, 1400);
        } else {
          setStatusError(result.message);
          triggerHaptic('warning');
        }
      } catch (err: any) {
        setStatusError(err?.message || 'Error occurred while saving imported workouts.');
        triggerHaptic('warning');
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  return (
    <SwipeableModalSheet
      onClose={onClose}
      overlayStyle={{ zIndex: 9999 }}
      style={{
        maxWidth: 560,
        maxHeight: '90vh',
        background: 'var(--bg-card, #12141a)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 0,
        overflow: 'hidden'
      }}
    >
      {/* Hidden native file input with broad mobile-friendly MIME support */}
        <input
          type="file"
          ref={fileInputRef}
          accept="text/csv, application/json, text/plain, .csv, .json, */*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(0, 245, 155, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileSpreadsheet size={20} color="var(--accent-volt, #00F59B)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Import Workout Logs
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)', margin: 0 }}>
                Supports Overload AI, Strong, Hevy, FitNotes, CSV & JSON
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Supported Apps Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Overload AI (CSV/JSON)', 'Strong App', 'Hevy App', 'FitNotes', 'Generic CSV'].map((app) => (
              <span
                key={app}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary, #94a3b8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {app}
              </span>
            ))}
          </div>

          {/* Mode Switch Tabs (Choose File vs Paste) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              padding: '3px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('file');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'file' ? 'rgba(0, 245, 155, 0.15)' : 'transparent',
                color: activeTab === 'file' ? 'var(--accent-volt, #00F59B)' : 'var(--text-secondary, #94a3b8)',
                fontWeight: activeTab === 'file' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
            >
              <Upload size={14} />
              Choose File (.csv / .json)
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('paste');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'paste' ? 'rgba(0, 245, 155, 0.15)' : 'transparent',
                color: activeTab === 'paste' ? 'var(--accent-volt, #00F59B)' : 'var(--text-secondary, #94a3b8)',
                fontWeight: activeTab === 'paste' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={14} />
              Paste Text
            </button>
          </div>

          {/* Tab 1: File Input */}
          {activeTab === 'file' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(0, 245, 155, 0.35)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                background: 'rgba(0, 245, 155, 0.03)',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(0, 245, 155, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Upload size={22} color="var(--accent-volt, #00F59B)" />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>
                  {fileName ? fileName : 'Tap to select CSV or JSON file'}
                </span>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', marginTop: 4, margin: 0 }}>
                  Works with files exported from Strong, Hevy, FitNotes, or Overload AI
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.78rem',
                  pointerEvents: 'none',
                  marginTop: 4
                }}
              >
                Browse Files
              </button>
            </div>
          )}

          {/* Tab 2: Paste Content */}
          {activeTab === 'paste' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary, #94a3b8)' }}>
                  Paste CSV Lines or JSON Array:
                </label>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-volt, #00F59B)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Clipboard size={12} /> Auto-Paste from Clipboard
                </button>
              </div>
              <textarea
                value={rawContent}
                onChange={(e) => handleProcessContent(e.target.value, 'Pasted Content')}
                placeholder="Date, Workout Name, Exercise Name, Set Order, Weight, Reps...&#10;or [ { &quot;routineName&quot;: &quot;Leg Day&quot;... } ]"
                rows={6}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.75rem',
                  padding: '10px',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* Status / Error Alerts */}
          {statusError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 51, 102, 0.15)',
                border: '1px solid rgba(255, 51, 102, 0.35)',
                color: '#FF3366',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{statusError}</span>
            </div>
          )}

          {successInfo && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 245, 155, 0.15)',
                border: '1px solid rgba(0, 245, 155, 0.4)',
                color: 'var(--accent-volt, #00F59B)',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Parsed Preview Card */}
          {parsedPreview && (
            <div
              style={{
                background: 'rgba(0, 229, 255, 0.05)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="var(--accent-cyan, #00E5FF)" />
                  <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#fff' }}>
                    Detected: {parsedPreview.detectedFormat}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'var(--accent-cyan, #00E5FF)',
                    background: 'rgba(0, 229, 255, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  Ready to Import
                </span>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>Sessions</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {parsedPreview.sessions.length}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>Total Sets</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    {parsedPreview.setsImported}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>PR Recalib.</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFD700', fontFamily: 'var(--font-mono)' }}>
                    Auto
                  </div>
                </div>
              </div>

              {/* Sample Preview List */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: 6, fontWeight: 700 }}>
                  Recent Sessions Preview:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {parsedPreview.sessions.slice(0, 3).map((s, idx) => (
                    <div
                      key={s.id || idx}
                      style={{
                        background: 'rgba(0,0,0,0.25)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#fff' }}>{s.routineName}</span>
                      <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.7rem' }}>
                        {new Date(s.date).toLocaleDateString()} · {s.exercises.length} exercises
                      </span>
                    </div>
                  ))}
                  {parsedPreview.sessions.length > 3 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', textAlign: 'center' }}>
                      + {parsedPreview.sessions.length - 3} more workout sessions
                    </div>
                  )}
                </div>
              </div>

              {/* Strategy Selector (Merge vs Replace) */}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                  Import Strategy:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label
                    style={{
                      border: `1px solid ${importMode === 'merge' ? 'var(--accent-volt, #00F59B)' : 'rgba(255,255,255,0.1)'}`,
                      background: importMode === 'merge' ? 'rgba(0, 245, 155, 0.08)' : 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8
                    }}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      style={{ marginTop: 2, accentColor: 'var(--accent-volt, #00F59B)' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                        Merge (Recommended)
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                        Keep current sessions, skip duplicates
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      border: `1px solid ${importMode === 'replace' ? 'var(--accent-crimson, #FF3366)' : 'rgba(255,255,255,0.1)'}`,
                      background: importMode === 'replace' ? 'rgba(255, 51, 102, 0.08)' : 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8
                    }}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      style={{ marginTop: 2, accentColor: 'var(--accent-crimson, #FF3366)' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                        Replace All
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                        Overwrite existing workout history
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            display: 'flex',
            gap: 10,
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{
              flex: 2,
              padding: '12px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: !parsedPreview || isProcessing ? 0.6 : 1,
              cursor: !parsedPreview || isProcessing ? 'not-allowed' : 'pointer'
            }}
            disabled={!parsedPreview || isProcessing}
            onClick={handleExecuteImport}
          >
            {isProcessing ? (
              <span>Importing Workouts...</span>
            ) : (
              <>
                <span>
                  {parsedPreview
                    ? `Import ${parsedPreview.sessions.length} Workouts`
                    : 'Select File to Import'}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
    </SwipeableModalSheet>
  );
};
