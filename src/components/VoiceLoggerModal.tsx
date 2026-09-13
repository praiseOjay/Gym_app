import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Check
} from 'lucide-react';
import {
  VoiceLoggerController,
  isSpeechRecognitionSupported,
  parseGymVoiceCommand
} from '../services/voiceLogger';
import type { ParsedVoiceCommand } from '../services/voiceLogger';
import { triggerHaptic } from '../utils/haptics';
import { kgToLbs } from '../engine/overloadEngine';
import { displayDistance, distanceUnitLabel, formatDuration } from '../utils/trackingTypeUtils';
import { SwipeableModalSheet } from './SwipeableModalSheet';

interface VoiceLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeExerciseName: string;
  activeSetNumber: number;
  unit: 'kg' | 'lbs';
  onApplyCommand: (cmd: ParsedVoiceCommand) => void;
}

export const VoiceLoggerModal: React.FC<VoiceLoggerModalProps> = ({
  isOpen,
  onClose,
  activeExerciseName,
  activeSetNumber,
  unit,
  onApplyCommand
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedCmd, setParsedCmd] = useState<ParsedVoiceCommand | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const controllerRef = useRef<VoiceLoggerController | null>(null);

  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (isOpen) {
      if (!controllerRef.current) {
        controllerRef.current = new VoiceLoggerController(unit);
      } else {
        controllerRef.current.setUnit(unit);
      }

      // Automatically start listening if supported
      if (supported) {
        controllerRef.current.start(
          (cmd) => {
            setTranscript(cmd.rawTranscript);
            setParsedCmd(cmd);
            triggerHaptic('light');
          },
          (err) => {
            setErrorMsg(err);
          },
          (active) => {
            setIsListening(active);
          }
        );
      } else {
        setErrorMsg('Web Speech API is not supported in this browser. You can tap quick voice commands below.');
      }
    } else {
      controllerRef.current?.stop();
      setIsListening(false);
      setTranscript('');
      setParsedCmd(null);
      setErrorMsg(null);
    }

    return () => {
      controllerRef.current?.stop();
    };
  }, [isOpen, unit, supported]);

  if (!isOpen) return null;

  const handleToggleMic = () => {
    if (!controllerRef.current) return;
    if (isListening) {
      controllerRef.current.stop();
    } else {
      setErrorMsg(null);
      controllerRef.current.start(
        (cmd) => {
          setTranscript(cmd.rawTranscript);
          setParsedCmd(cmd);
          triggerHaptic('light');
        },
        (err) => setErrorMsg(err),
        (active) => setIsListening(active)
      );
    }
  };

  const handleApply = () => {
    if (parsedCmd) {
      onApplyCommand(parsedCmd);
      triggerHaptic('success');
      onClose();
    }
  };

  const handleSimulatePhrase = (phrase: string) => {
    const parsed = parseGymVoiceCommand(phrase, unit);
    setTranscript(phrase);
    setParsedCmd(parsed);
    triggerHaptic('medium');
  };

  const displayWeight = (kg?: number) => {
    if (kg === undefined) return null;
    return unit === 'lbs' ? `${kgToLbs(kg)} lbs` : `${kg} kg`;
  };

  return (
    <SwipeableModalSheet
      onClose={onClose}
      overlayStyle={{ zIndex: 1200 }}
      style={{
        borderTop: '2px solid var(--accent-volt)',
        background: 'linear-gradient(180deg, #10161E 0%, #070B10 100%)',
        maxWidth: 480
      }}
    >
      {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: isListening ? 'rgba(0, 245, 155, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isListening ? 'var(--accent-volt)' : 'var(--text-muted)'
              }}
            >
              <Mic size={18} className={isListening ? 'voice-mic-active' : ''} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-volt)' }}>
                AI Hands-Free Logger
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                {activeExerciseName} · Set #{activeSetNumber}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sound Wave Visualization */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px 16px',
            textAlign: 'center',
            marginBottom: 16,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {isListening ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40 }}>
              {[0.4, 0.8, 1.2, 0.7, 0.3].map((delay, idx) => (
                <div
                  key={idx}
                  className="voice-wave-bar"
                  style={{
                    animationDelay: `${delay}s`,
                    background: 'var(--accent-volt)'
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Microphone paused. Tap below to speak.
            </div>
          )}

          {/* Transcript / Prompt text */}
          <div style={{ marginTop: 14 }}>
            {transcript ? (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#fff',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-block'
                }}
              >
                "{transcript}"
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Say: <span style={{ color: 'var(--accent-volt)' }}>"80 kilos for 8 reps"</span> or <span style={{ color: 'var(--accent-cyan)' }}>"Drop set 60kg 10 reps"</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-crimson)', marginTop: 8 }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Parsed Result Card */}
        {parsedCmd && (parsedCmd.weightKg !== undefined || parsedCmd.reps !== undefined || parsedCmd.distanceKm !== undefined || parsedCmd.durationSeconds !== undefined || parsedCmd.action || parsedCmd.setType) && (
          <div
            style={{
              background: 'rgba(0, 245, 155, 0.08)',
              border: '1px solid rgba(0, 245, 155, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 16px',
              marginBottom: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-volt)', textTransform: 'uppercase' }}>
                Detected Log
              </span>
              {parsedCmd.action === 'complete' && (
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-volt)' }}>
                  ✓ Ready to Complete
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {parsedCmd.setType && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: parsedCmd.setType === 'drop' ? '#FF2A85' : '#FFA500',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  ⚡ {parsedCmd.setType} Set
                </span>
              )}

              {parsedCmd.weightKg !== undefined && (
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                  🏋️ {displayWeight(parsedCmd.weightKg)}
                </span>
              )}

              {parsedCmd.reps !== undefined && (
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                  🔁 {parsedCmd.reps} reps
                </span>
              )}

              {parsedCmd.distanceKm !== undefined && (
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  🏃 {displayDistance(parsedCmd.distanceKm, unit)} {distanceUnitLabel(unit)}
                </span>
              )}

              {parsedCmd.durationSeconds !== undefined && (
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFA500' }}>
                  ⏱️ {formatDuration(parsedCmd.durationSeconds)}
                </span>
              )}

              {parsedCmd.rpe !== undefined && (
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  ⚡ RPE {parsedCmd.rpe}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Voice Phrases Suggestion */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
            Try Saying:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              '80kg for 8 reps',
              '100kg 6 reps rpe 8',
              '20 minutes 5 km',
              '15 minutes',
              '45 seconds',
              'Drop set 60kg 10 reps',
              'Complete set'
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                className="chip-btn"
                style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                onClick={() => handleSimulatePhrase(phrase)}
              >
                "{phrase}"
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn-secondary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: isListening ? '1px solid var(--accent-crimson)' : '1px solid var(--border-subtle)',
              color: isListening ? 'var(--accent-crimson)' : 'var(--text-secondary)'
            }}
            onClick={handleToggleMic}
          >
            {isListening ? (
              <>
                <MicOff size={16} /> Mute Mic
              </>
            ) : (
              <>
                <Mic size={16} color="var(--accent-volt)" /> Start Listening
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-primary"
            style={{
              flex: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            disabled={!parsedCmd}
            onClick={handleApply}
          >
            <Check size={18} fill="#050D0A" /> Apply to Set #{activeSetNumber}
          </button>
        </div>
    </SwipeableModalSheet>
  );
};
