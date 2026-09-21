import React, { useState, useRef, useEffect } from 'react';
import type {
  UserSettings,
  WorkoutSession,
  PRRecord,
  Routine,
  RoutineExerciseTemplate,
  MuscleRecoveryState,
  WorkoutExercise,
  WorkoutSet,
  MuscleGroup,
  EquipmentType
} from '../types/gym';
import { chatWithAICoach } from '../services/geminiService';
import type { CoachProposedAction } from '../services/geminiService';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { sounds } from '../utils/audio';
import {
  Sparkles,
  Send,
  RefreshCw,
  CheckCircle2,
  Check,
  Zap,
  Flame,
  ArrowRight,
  Dumbbell,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { subscriptionService } from '../services/subscriptionService';
import { PaywallModal } from './PaywallModal';

interface AICoachViewProps {
  settings: UserSettings;
  historySessions: WorkoutSession[];
  prs: PRRecord[];
  routines: Routine[];
  onUpdateRoutines: (updated: Routine[]) => void;
  onNavigateTab: (tab: any) => void;
  activeSession?: WorkoutSession | null;
  onUpdateActiveSession?: (updated: WorkoutSession) => void;
  recoveryStates?: MuscleRecoveryState[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  proposedAction?: CoachProposedAction;
  applied?: boolean;
}

/**
 * Formats coach markdown cleanly: bolding, bullet points, numbered lists, and highlights
 */
function renderCoachMessageContent(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`spacer-${lineIdx}`} style={{ height: 6 }} />);
      return;
    }

    // Bullet point: "- " or "* "
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    // Numbered item: "1. ", "2. ", etc.
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

    let contentToFormat = trimmed;
    if (isBullet) {
      contentToFormat = trimmed.substring(2);
    } else if (numberMatch) {
      contentToFormat = numberMatch[2];
    }

    // Parse bold **text** within the line
    const parts = contentToFormat.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={partIdx} style={{ color: '#fff', fontWeight: 700 }}>
            {inner}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      elements.push(
        <div
          key={`bullet-${lineIdx}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginTop: 3,
            marginBottom: 3,
            paddingLeft: 4
          }}
        >
          <span
            style={{
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              lineHeight: '1.4',
              userSelect: 'none'
            }}
          >
            •
          </span>
          <div style={{ flex: 1, lineHeight: '1.45' }}>{formattedLine}</div>
        </div>
      );
    } else if (numberMatch) {
      elements.push(
        <div
          key={`num-${lineIdx}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginTop: 3,
            marginBottom: 3,
            paddingLeft: 4
          }}
        >
          <span
            style={{
              color: 'var(--accent-volt)',
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              lineHeight: '1.45',
              userSelect: 'none'
            }}
          >
            {numberMatch[1]}.
          </span>
          <div style={{ flex: 1, lineHeight: '1.45' }}>{formattedLine}</div>
        </div>
      );
    } else {
      elements.push(
        <p
          key={`p-${lineIdx}`}
          style={{ margin: '0 0 6px 0', lineHeight: '1.45' }}
        >
          {formattedLine}
        </p>
      );
    }
  });

  return elements;
}

export const AICoachView: React.FC<AICoachViewProps> = ({
  settings,
  historySessions,
  prs,
  routines,
  onUpdateRoutines,
  onNavigateTab,
  activeSession,
  onUpdateActiveSession,
  recoveryStates = []
}) => {
  const initialGreeting = activeSession
    ? `Coach Overload locked in! You have an active workout in progress: **${activeSession.routineName}** (${activeSession.exercises.length} exercises).\n\nNeed to swap a machine that is taken, adjust your load/reps, or want cues for maximum mechanical tension? Tell me and I'll modify your workout right now!`
    : `Coach Overload here — elite hypertrophy science at your command. I know your routine splits, PR history, and muscle recovery status.\n\nAsk me to optimize your workout split, swap movements, calculate volume landmarks (MEV/MAV/MRV), or provide plateau-breaking cues!`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: initialGreeting
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(() => subscriptionService.isPro());
  const [aiQuota, setAiQuota] = useState(() => subscriptionService.getDailyAICoachUsage());
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe((state) => {
      setIsPro(state.isPro);
      setAiQuota(subscriptionService.getDailyAICoachUsage());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Contextual quick prompts based on whether a workout is currently active
  const quickPrompts = activeSession
    ? [
        'Swap an exercise in my active workout',
        'Suggest a machine replacement for bench press',
        'My joints feel stiff, swap for a joint-friendly movement',
        'How many reps in reserve (RIR) should I leave on this set?'
      ]
    : [
        'Generate a science-based 4-Day Push/Pull/Legs Split',
        'Check if my chest volume is hitting MAV',
        'Which muscle groups are fully recovered today?',
        'Swap Hack Squat for Leg Press on Leg Day',
        'How do I break my Incline Dumbbell Bench plateau?'
      ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    // Check Pro or Free daily quota
    if (!subscriptionService.canUseAICoach()) {
      setShowPaywall(true);
      return;
    }

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
          split: 'Hypertrophy Split',
          prs: prStrings,
          userSettings: settings,
          currentRoutines: routines,
          activeSession: activeSession || null,
          recoveryStates
        }
      );

      subscriptionService.recordAICoachUsage();
      setAiQuota(subscriptionService.getDailyAICoachUsage());

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
          text: 'I can help adjust your exercises, sets, or live workout. Tell me what movement or routine you want to modify!'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAction = (msgIndex: number, action: CoachProposedAction) => {
    // 1. LIVE ACTIVE WORKOUT MODIFICATION
    if (action.action === 'MODIFY_ACTIVE_WORKOUT') {
      if (!activeSession || !onUpdateActiveSession) {
        alert('No active workout session found! Start a workout first to apply live modifications.');
        return;
      }

      let changes = action.activeWorkoutChanges;
      // If activeWorkoutChanges is missing, synthesize it from action.exercises
      if (!changes && action.exercises && action.exercises.length > 0) {
        const pEx = action.exercises[0];
        const libMatch = EXERCISE_LIBRARY.find(
          (lib) =>
            lib.id.toLowerCase() === pEx.exerciseId.toLowerCase() ||
            (pEx.name && lib.name.toLowerCase() === pEx.name.toLowerCase()) ||
            (pEx.name && lib.name.toLowerCase().includes(pEx.name.toLowerCase()))
        );
        changes = {
          type: 'SWAP_EXERCISE',
          oldExerciseName: 'first exercise',
          newExercise: {
            exerciseId: libMatch?.id || pEx.exerciseId,
            name: libMatch?.name || pEx.name || pEx.exerciseId,
            muscleGroup: (libMatch?.muscleGroup || 'Chest') as MuscleGroup,
            equipment: (libMatch?.equipment || 'Dumbbell') as EquipmentType,
            sets: pEx.defaultSets || 3,
            targetWeightKg: pEx.defaultWeightKg || 24,
            targetReps: pEx.targetRepRange ? pEx.targetRepRange[0] : 10,
            restSeconds: pEx.restSeconds || 90
          }
        };
      } else if (!changes) {
        changes = {
          type: 'SWAP_EXERCISE',
          oldExerciseName: 'first exercise',
          newExercise: {
            exerciseId: 'incline-dumbbell-press',
            name: 'Incline Dumbbell Press',
            muscleGroup: 'Chest',
            equipment: 'Dumbbell',
            sets: 3,
            targetWeightKg: 24,
            targetReps: 10,
            restSeconds: 90
          }
        };
      }

      let updatedExercises = [...activeSession.exercises];

      if (changes.type === 'SWAP_EXERCISE') {
        const oldId = (changes.oldExerciseId || '').toLowerCase().trim();
        const oldName = (changes.oldExerciseName || '').toLowerCase().trim();
        const newEx = changes.newExercise;

        if (newEx) {
          const libMatch = EXERCISE_LIBRARY.find(
            (lib) =>
              lib.id.toLowerCase() === newEx.exerciseId.toLowerCase() ||
              lib.name.toLowerCase() === newEx.name.toLowerCase() ||
              lib.name.toLowerCase().includes(newEx.name.toLowerCase())
          );

          // Find match with multiple robust heuristics
          let targetIndex = updatedExercises.findIndex((ex) => {
            const exId = ex.exerciseId.toLowerCase();
            const exName = ex.name.toLowerCase();
            return (
              (oldId && (exId === oldId || exName === oldId || exId.includes(oldId) || exName.includes(oldId))) ||
              (oldName && (exId === oldName || exName === oldName || exName.includes(oldName) || oldName.includes(exName)))
            );
          });

          // Fallback: If prompt mentioned 'first' or couldn't match, default to first exercise
          if (targetIndex < 0 && (oldName.includes('first') || oldId.includes('first') || updatedExercises.length > 0)) {
            targetIndex = 0;
          }

          const existingExercise = targetIndex >= 0 ? updatedExercises[targetIndex] : null;
          const setsCount = newEx.sets || existingExercise?.sets.length || 3;
          const defaultWeight = newEx.targetWeightKg || existingExercise?.sets[0]?.weightKg || 20;
          const defaultReps = newEx.targetReps || 10;

          const newSets: WorkoutSet[] = Array.from({ length: setsCount }).map((_, sIdx) => ({
            id: `set-${Date.now()}-${sIdx + 1}`,
            setNumber: sIdx + 1,
            type: 'working',
            weightKg: defaultWeight,
            reps: defaultReps,
            targetWeightKg: defaultWeight,
            targetReps: defaultReps,
            completed: false
          }));

          const replacementExercise: WorkoutExercise = {
            id: existingExercise ? existingExercise.id : `we-${Date.now()}-${updatedExercises.length}`,
            exerciseId: libMatch?.id || newEx.exerciseId,
            name: libMatch?.name || newEx.name,
            muscleGroup: (libMatch?.muscleGroup || newEx.muscleGroup || existingExercise?.muscleGroup || 'Chest') as MuscleGroup,
            equipment: (libMatch?.equipment || newEx.equipment || existingExercise?.equipment || 'Machine') as EquipmentType,
            sets: newSets,
            restSeconds: newEx.restSeconds || 90
          };

          if (targetIndex >= 0) {
            updatedExercises[targetIndex] = replacementExercise;
          } else {
            updatedExercises.push(replacementExercise);
          }
        }
      } else if (changes.type === 'ADD_EXERCISE') {
        const newEx = changes.newExercise;
        if (newEx) {
          const libMatch = EXERCISE_LIBRARY.find(
            (lib) =>
              lib.id.toLowerCase() === newEx.exerciseId.toLowerCase() ||
              lib.name.toLowerCase() === newEx.name.toLowerCase()
          );
          const setsCount = newEx.sets || 3;
          const defaultWeight = newEx.targetWeightKg || 20;
          const defaultReps = newEx.targetReps || 10;
          const newSets: WorkoutSet[] = Array.from({ length: setsCount }).map((_, sIdx) => ({
            id: `set-${Date.now()}-${sIdx + 1}`,
            setNumber: sIdx + 1,
            type: 'working',
            weightKg: defaultWeight,
            reps: defaultReps,
            targetWeightKg: defaultWeight,
            targetReps: defaultReps,
            completed: false
          }));

          updatedExercises.push({
            id: `we-${Date.now()}-${updatedExercises.length}`,
            exerciseId: libMatch?.id || newEx.exerciseId,
            name: libMatch?.name || newEx.name,
            muscleGroup: (libMatch?.muscleGroup || newEx.muscleGroup || 'Chest') as MuscleGroup,
            equipment: (libMatch?.equipment || newEx.equipment || 'Machine') as EquipmentType,
            sets: newSets,
            restSeconds: newEx.restSeconds || 90
          });
        }
      } else if (changes.type === 'REMOVE_EXERCISE') {
        const oldId = (changes.oldExerciseId || '').toLowerCase();
        const oldName = (changes.oldExerciseName || '').toLowerCase();
        updatedExercises = updatedExercises.filter(
          (ex) =>
            !(
              (oldId && ex.exerciseId.toLowerCase() === oldId) ||
              (oldName && ex.name.toLowerCase().includes(oldName))
            )
        );
      }

      const totalVolumeKg = updatedExercises.reduce(
        (sum, ex) =>
          sum +
          ex.sets
            .filter((s) => s.completed)
            .reduce((sSum, s) => sSum + s.weightKg * s.reps, 0),
        0
      );

      const updatedSession: WorkoutSession = {
        ...activeSession,
        exercises: updatedExercises,
        totalVolumeKg
      };

      onUpdateActiveSession(updatedSession);

      setMessages((prev) =>
        prev.map((m, idx) => (idx === msgIndex ? { ...m, applied: true } : m))
      );

      if (settings.soundEnabled) sounds.playSetComplete();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
      return;
    }

    // 2. UPDATE ALL ROUTINES
    if (action.action === 'UPDATE_ALL_ROUTINES' && action.routines) {
      onUpdateRoutines(action.routines);
      setMessages((prev) =>
        prev.map((m, idx) => (idx === msgIndex ? { ...m, applied: true } : m))
      );
      if (settings.soundEnabled) sounds.playSetComplete();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      return;
    }

    // 3. UPDATE SINGLE ROUTINE
    if (action.action === 'UPDATE_ROUTINE' && action.weekday && action.exercises) {
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

      setMessages((prev) =>
        prev.map((m, idx) => (idx === msgIndex ? { ...m, applied: true } : m))
      );

      if (settings.soundEnabled) sounds.playSetComplete();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    }
  };

  return (
    <div className="view-content" style={{ paddingBottom: 110 }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={22} color="var(--accent-volt)" />
            Coach Overload
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            AI Hypertrophy Scientist · Split Engineering & Live Workout Tuning
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPro ? (
            <span
              style={{
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(0, 245, 155, 0.15))',
                border: '1px solid rgba(255, 215, 0, 0.45)',
                color: '#ffd700',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 9px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                letterSpacing: '0.03em'
              }}
            >
              <Crown size={12} color="#ffd700" /> PRO UNLIMITED
            </span>
          ) : (
            <button
              onClick={() => setShowPaywall(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '4px 9px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
              title="Upgrade to Overload Pro for unlimited AI queries"
            >
              <span>{aiQuota.remaining}/{aiQuota.max} Left Today</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #00F59B, #00E5FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 900,
                  fontSize: '0.68rem'
                }}
              >
                PRO ✨
              </span>
            </button>
          )}

          {activeSession && (
            <span
              style={{
                background: 'rgba(0, 245, 155, 0.15)',
                border: '1px solid var(--accent-volt)',
                color: 'var(--accent-volt)',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Zap size={11} fill="var(--accent-volt)" /> Live
            </span>
          )}
        </div>
      </div>

      {/* Active Workout Banner in Coach View */}
      {activeSession && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.12) 0%, rgba(5, 13, 10, 0.95) 100%)',
            border: '1px solid rgba(0, 245, 155, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 14px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 245, 155, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-volt)'
              }}
            >
              <Dumbbell size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                {activeSession.routineName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {activeSession.exercises.length} exercises · {activeSession.totalVolumeKg}kg logged · {Math.round(activeSession.durationSeconds / 60)}m elapsed
              </div>
            </div>
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.72rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => onNavigateTab('workout')}
          >
            Live View <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Quick Prompt Chips */}
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6
          }}
        >
          {activeSession ? '⚡ Quick In-Workout Requests' : '💡 Recommended Prompts'}
        </div>
        <div className="quick-prompts-row" style={{ marginBottom: 12 }}>
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
                marginBottom: 6,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: m.role === 'user' ? 'var(--accent-volt)' : 'var(--accent-cyan)'
              }}
            >
              {m.role === 'user' ? (
                'You'
              ) : (
                <>
                  <Flame size={12} color="var(--accent-volt)" />
                  Coach Overload
                </>
              )}
            </div>

            {/* Render formatted message content */}
            <div style={{ fontSize: '0.86rem' }}>
              {renderCoachMessageContent(m.text)}
            </div>

            {/* Proposed Live Workout Modification Card */}
            {m.proposedAction?.action === 'MODIFY_ACTIVE_WORKOUT' && (
              <div
                style={{
                  marginTop: 12,
                  background: 'linear-gradient(135deg, rgba(0, 245, 155, 0.08) 0%, rgba(0, 0, 0, 0.6) 100%)',
                  border: '1px solid rgba(0, 245, 155, 0.4)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={15} color="var(--accent-volt)" />
                    <strong style={{ fontSize: '0.85rem', color: '#fff' }}>
                      Active Workout Modification
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
                      Applied Live
                    </span>
                  )}
                </div>

                {(() => {
                  const changes = m.proposedAction.activeWorkoutChanges;
                  const exList = m.proposedAction.exercises;

                  if (changes?.type === 'SWAP_EXERCISE') {
                    return (
                      <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ color: 'var(--text-muted)' }}>
                          Replace:{' '}
                          <span style={{ color: 'var(--accent-crimson)', textDecoration: 'line-through' }}>
                            {changes.oldExerciseName || changes.oldExerciseId || 'Current Movement'}
                          </span>
                        </div>
                        <div style={{ color: '#fff', fontWeight: 600 }}>
                          With:{' '}
                          <span style={{ color: 'var(--accent-volt)' }}>
                            {changes.newExercise?.name}
                          </span>{' '}
                          ({changes.newExercise?.sets || 3} sets ×{' '}
                          {changes.newExercise?.targetReps || 10} reps @{' '}
                          {changes.newExercise?.targetWeightKg || 20}kg)
                        </div>
                      </div>
                    );
                  }

                  if (changes?.type === 'ADD_EXERCISE') {
                    return (
                      <div style={{ fontSize: '0.78rem', color: '#fff' }}>
                        Add Exercise:{' '}
                        <span style={{ color: 'var(--accent-volt)', fontWeight: 700 }}>
                          {changes.newExercise?.name}
                        </span>{' '}
                        ({changes.newExercise?.sets || 3} sets ×{' '}
                        {changes.newExercise?.targetReps || 10} reps)
                      </div>
                    );
                  }

                  if (exList && exList.length > 0) {
                    const first = exList[0];
                    return (
                      <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ color: '#fff', fontWeight: 600 }}>
                          Swap Movement To:{' '}
                          <span style={{ color: 'var(--accent-volt)' }}>
                            {first.name || first.exerciseId}
                          </span>{' '}
                          ({first.defaultSets || 3} sets ×{' '}
                          {first.targetRepRange ? `${first.targetRepRange[0]}-${first.targetRepRange[1]}` : '8-12'} @{' '}
                          {first.defaultWeightKg || 20}kg)
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent-volt)', fontWeight: 600 }}>
                      ⚡ Incline Dumbbell Press (3 sets × 8-12 reps @ 24kg)
                    </div>
                  );
                })()}

                {m.applied ? (
                  <button
                    id="btn-workout-applied"
                    className="btn-secondary"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      marginTop: 4,
                      color: 'var(--accent-volt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                    onClick={() => onNavigateTab('workout')}
                  >
                    <Check size={14} /> Workout Updated! Go to Active Session →
                  </button>
                ) : (
                  <button
                    id="btn-apply-active-workout"
                    className="btn-primary"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleApplyAction(idx, m.proposedAction!)}
                  >
                    <Zap size={15} fill="#050D0A" />
                    Apply Changes to Active Workout Now
                  </button>
                )}
              </div>
            )}

            {/* Proposed Split Routine Update Card */}
            {(m.proposedAction?.action === 'UPDATE_ROUTINE' || m.proposedAction?.action === 'UPDATE_ALL_ROUTINES') && (
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
                      Proposed Split: {m.proposedAction.routineName || m.proposedAction.weekday || 'Routine'}
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
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      marginTop: 4,
                      color: 'var(--accent-volt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                    onClick={() => onNavigateTab('routines')}
                  >
                    <Check size={14} /> Plan Updated! View in Split Tab →
                  </button>
                ) : (
                  <button
                    className="btn-accent-cyan"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
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
              Analyzing biomechanics and calculating optimal volume...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id="coach-user-input"
          type="text"
          className="set-input-box"
          style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 'var(--radius-lg)' }}
          placeholder={activeSession ? 'e.g. Swap bench press for dumbbell press...' : 'e.g. Optimize my chest volume or swap leg press on Tuesday...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          id="coach-send-button"
          className="btn-primary"
          style={{ padding: '0 18px', borderRadius: 'var(--radius-lg)' }}
          onClick={() => handleSend()}
          disabled={loading || !inputText.trim()}
        >
          <Send size={18} fill="#050D0A" />
        </button>
      </div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="ai_coach"
        onSuccess={() => {
          setIsPro(true);
          setAiQuota(subscriptionService.getDailyAICoachUsage());
        }}
      />
    </div>
  );
};
