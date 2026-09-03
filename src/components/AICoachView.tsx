import React, { useState, useRef, useEffect } from 'react';
import type { UserSettings, WorkoutSession, PRRecord, Routine, RoutineExerciseTemplate } from '../types/gym';
import { chatWithAICoach } from '../services/geminiService';
import type { CoachProposedAction } from '../services/geminiService';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { sounds } from '../utils/audio';
import {
  Sparkles,
  Send,
  RefreshCw,
  CheckCircle2,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AICoachViewProps {
  settings: UserSettings;
  historySessions: WorkoutSession[];
  prs: PRRecord[];
  routines: Routine[];
  onUpdateRoutines: (updated: Routine[]) => void;
  onNavigateTab: (tab: any) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  proposedAction?: CoachProposedAction;
  applied?: boolean;
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  settings,
  historySessions,
  prs,
  routines,
  onUpdateRoutines,
  onNavigateTab
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `Hey ${settings.userName}! I'm your Gemini AI Coach. You can talk to me to completely customize your routine, swap exercises, or adjust your volume.\n\nTry asking: "Swap Hack Squat for Sled Leg Press on Tuesday" or "Change Friday to focus more on arms and delts" and I'll update your plan for you!`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    'Generate a 4-Day Push/Pull/Legs Split',
    'Create a 3-Day Full Body Hypertrophy Split',
    'Swap Hack Squat for Sled Leg Press on Tuesday',
    'Change Friday to focus more on arms & delts',
    'How do I break my Incline Bench plateau?'
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const newHistory: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(newHistory);
    setInputText('');
    setLoading(true);

    const recentVolume = historySessions.slice(0, 3).reduce((s, x) => s + x.totalVolumeKg, 0);
    const prStrings = prs.map((p) => `${p.exerciseName}: ${p.value}kg`);

    try {
      const reply = await chatWithAICoach(
        newHistory.map((m) => ({ role: m.role, text: m.text })),
        {
          recentVolume,
          split: '3 Upper / 2 Lower Hypertrophy Split',
          prs: prStrings,
          userSettings: settings,
          currentRoutines: routines
        }
      );

      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          text: reply.text,
          proposedAction: reply.proposedAction
        }
      ]);
    } catch (e) {
      console.error(e);
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          text: 'I can help adjust your exercises and sets. What day would you like to modify?'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAction = (msgIndex: number, action: CoachProposedAction) => {
    if (action.action === 'UPDATE_ALL_ROUTINES' && action.routines) {
      onUpdateRoutines(action.routines);
      setMessages((prev) =>
        prev.map((m, idx) => (idx === msgIndex ? { ...m, applied: true } : m))
      );
      if (settings.soundEnabled) sounds.playSetComplete();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      return;
    }

    if (action.action === 'UPDATE_ROUTINE' && action.weekday && action.exercises) {
      // Find matching routine by weekday or dayTag or title
      const targetWeekday = action.weekday.toLowerCase();
      const existingIdx = routines.findIndex((r) => {
        const rDay = r.weekday.toLowerCase();
        const rTag = r.dayTag.toLowerCase();
        const rName = r.name.toLowerCase();
        return (
          rDay === targetWeekday ||
          rTag === targetWeekday ||
          (targetWeekday && (targetWeekday.includes(rDay) || rDay.includes(targetWeekday))) ||
          (targetWeekday && (targetWeekday.includes(rName) || rName.includes(targetWeekday)))
        );
      });

      // Convert proposed exercises into valid RoutineExerciseTemplates
      const formattedExercises: RoutineExerciseTemplate[] = action.exercises.map((e) => {
        let exId = e.exerciseId;
        const found = EXERCISE_LIBRARY.find(
          (lib) =>
            lib.id.toLowerCase() === exId.toLowerCase() ||
            (e.name && lib.name.toLowerCase() === e.name.toLowerCase()) ||
            lib.name.toLowerCase().includes((e.name || exId).toLowerCase())
        );
        if (found) {
          exId = found.id;
        }

        return {
          exerciseId: exId,
          defaultSets: e.defaultSets || 3,
          targetRepRange: e.targetRepRange || [8, 12],
          defaultWeightKg: e.defaultWeightKg || 20,
          targetRpe: e.targetRpe || 8.5,
          restSeconds: e.restSeconds || 60
        };
      });

      const updatedRoutines = [...routines];

      if (existingIdx >= 0) {
        updatedRoutines[existingIdx] = {
          ...updatedRoutines[existingIdx],
          name: action.routineName || updatedRoutines[existingIdx].name,
          description: action.description || updatedRoutines[existingIdx].description,
          exercises: formattedExercises
        };
      } else {
        // Append new routine
        const cleanDay = (action.weekday || 'custom').toLowerCase().replace(/\s+/g, '-');
        updatedRoutines.push({
          id: `routine-${cleanDay}-${routines.length + 1}`,
          name: action.routineName || `${action.weekday} Routine`,
          description: action.description || 'Customized by AI Coach',
          weekday: action.weekday as any,
          splitType: 'Upper/Lower',
          dayTag: action.weekday,
          exercises: formattedExercises
        });
      }

      onUpdateRoutines(updatedRoutines);

      // Mark message as applied
      setMessages((prev) =>
        prev.map((m, idx) => (idx === msgIndex ? { ...m, applied: true } : m))
      );

      if (settings.soundEnabled) {
        sounds.playSetComplete();
      }

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  return (
    <div className="view-content" style={{ paddingBottom: 110 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Sparkles size={20} color="var(--accent-cyan)" />
            AI Gym Coach
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Ask me to change your plan or swap exercises
          </p>
        </div>
        <span
          style={{
            background: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)'
          }}
        >
          Active
        </span>
      </div>

      {/* Quick Prompt Chips */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
          Quick Coach Requests
        </div>
        <div className="quick-prompts-row">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              className="quick-prompt-chip"
              onClick={() => handleSend(qp)}
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="gym-card coach-chat-history">
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-bubble ${m.role === 'user' ? 'user' : 'coach'}`}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                marginBottom: 4,
                color: m.role === 'user' ? 'var(--accent-volt)' : 'var(--accent-cyan)'
              }}
            >
              {m.role === 'user' ? 'You' : 'Overload AI'}
            </div>
            <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>

            {/* Proposed Routine Update Card */}
            {m.proposedAction && (
              <div
                style={{
                  marginTop: 12,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(0, 229, 255, 0.4)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={15} color="var(--accent-cyan)" />
                    <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                      Proposed Plan: {m.proposedAction.weekday || 'Workout'}
                    </strong>
                  </div>
                  {m.applied && (
                    <span
                      style={{
                        background: 'rgba(0, 245, 155, 0.2)',
                        color: 'var(--accent-volt)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      Applied
                    </span>
                  )}
                </div>

                {m.proposedAction.exercises && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {m.proposedAction.exercises.map((ex, exI) => (
                      <div
                        key={exI}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <span style={{ color: '#fff', fontWeight: 600 }}>
                          {exI + 1}. {(() => {
                            const found = EXERCISE_LIBRARY.find(
                              (lib) => lib.id.toLowerCase() === ex.exerciseId.toLowerCase()
                            );
                            return found?.name || ex.name || ex.exerciseId;
                          })()}
                        </span>
                        <span style={{ color: 'var(--accent-volt)', fontFamily: 'var(--font-mono)' }}>
                          {ex.defaultSets} sets × {ex.targetRepRange ? `${ex.targetRepRange[0]}-${ex.targetRepRange[1]}` : '8-12'} · {ex.defaultWeightKg || 20}kg
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {m.applied ? (
                  <button
                    className="btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.78rem', marginTop: 4, color: 'var(--accent-volt)' }}
                    onClick={() => onNavigateTab('routines')}
                  >
                    <Check size={14} /> Plan Updated! View in Split Tab →
                  </button>
                ) : (
                  <button
                    className="btn-accent-cyan"
                    style={{ padding: '8px 12px', fontSize: '0.82rem', marginTop: 4 }}
                    onClick={() => handleApplyAction(idx, m.proposedAction!)}
                  >
                    <CheckCircle2 size={16} />
                    Apply Changes to My Plan
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble coach" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Analyzing biomechanics and updating your plan...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          className="set-input-box"
          style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 'var(--radius-lg)' }}
          placeholder="e.g. Swap hack squat for leg press on Tuesday..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          className="btn-accent-cyan"
          style={{ padding: '0 18px', borderRadius: 'var(--radius-lg)' }}
          onClick={() => handleSend()}
          disabled={loading || !inputText.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
