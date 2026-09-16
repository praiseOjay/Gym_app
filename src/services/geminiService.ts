import type { WorkoutSession, UserSettings, Exercise, Routine, MuscleRecoveryState } from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

import { aiProxyService, type GeminiCallOptions } from './aiProxyService';
export type { GeminiCallOptions };

/**
 * Resilient call to AI engine routed through secure proxy with developer fallback
 */
async function callGemini(
  prompt: string,
  options?: string | GeminiCallOptions
): Promise<string> {
  const opts: GeminiCallOptions =
    typeof options === 'string' ? { apiKey: options } : options || {};
  return aiProxyService.callAI(prompt, opts);
}

/**
 * Bulletproof JSON extractor supporting raw JSON, markdown fences, and embedded objects
 */
export function extractJson<T>(raw: string): T {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlock) {
    try {
      return JSON.parse(jsonBlock[1].trim());
    } catch {}
  }

  const curlyMatch = trimmed.match(/\{[\s\S]*\}/);
  if (curlyMatch) {
    try {
      return JSON.parse(curlyMatch[0].trim());
    } catch {}
  }

  throw new Error('Unable to parse JSON from Gemini response');
}

/**
 * AI Post-Workout Session Analysis
 */
export async function analyzeWorkoutSessionWithAI(
  session: WorkoutSession,
  settings: UserSettings
): Promise<{
  summary: string;
  highlights: string[];
  overloadSuccess: boolean;
  recommendations: string[];
  recoveryAdvice: string;
}> {
  const workoutSummary = session.exercises.map((e) => {
    const setDetails = e.sets
      .filter((s) => s.completed)
      .map((s) => `${s.weightKg}kg x ${s.reps} reps (RPE ${s.rpe ?? 8})`)
      .join(', ');
    return `- ${e.name} (${e.muscleGroup}): [${setDetails}]`;
  }).join('\n');

  const prompt = `You are an elite bodybuilding & hypertrophy coach analyzing a finished gym workout.
User Split: 3 Upper / 2 Lower Bodybuilding Focus.
Workout Name: ${session.routineName} (${session.dayTag || 'Hypertrophy'})
Duration: ${Math.round(session.durationSeconds / 60)} minutes
Total Volume: ${session.totalVolumeKg} kg
PRs Set: ${session.prCount}

Exercise & Sets Log:
${workoutSummary}

Provide a crisp, motivating, scientifically accurate debrief in JSON format with exactly these keys:
{
  "summary": "1-2 encouraging sentences reviewing the overall intensity and progression.",
  "highlights": ["highlight 1", "highlight 2"],
  "overloadSuccess": true,
  "recommendations": ["Actionable tip for next session's progressive overload", "form or tempo tip"],
  "recoveryAdvice": "Nutrition and sleep advice specifically for the muscles trained today."
}

Return ONLY valid JSON. No markdown backticks, no extra text.`;

  try {
    const rawResult = await callGemini(prompt, {
      apiKey: settings.geminiApiKey,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048
    });
    const parsed = extractJson<any>(rawResult);
    return {
      summary: parsed.summary || 'Superb workout! You pushed great volume today.',
      highlights: parsed.highlights || ['Maintained high mechanical tension', 'Solid volume execution'],
      overloadSuccess: parsed.overloadSuccess ?? true,
      recommendations: parsed.recommendations || ['Add 2.5kg to your top sets next session'],
      recoveryAdvice: parsed.recoveryAdvice || 'Consume 30-40g high quality protein and hydrate.'
    };
  } catch (err) {
    console.warn('Gemini API call failed or offline, using rule-based coach fallback:', err);
    // Intelligent heuristic fallback
    return {
      summary: `Awesome work completing ${session.routineName}! You moved ${session.totalVolumeKg} kg of mechanical volume across ${session.exercises.length} exercises.`,
      highlights: [
        session.prCount > 0 ? `Broke ${session.prCount} Personal Record(s) today!` : 'Maintained high quality working sets',
        `Clocked in ${Math.round(session.durationSeconds / 60)} minutes of focused hypertrophy work`
      ],
      overloadSuccess: true,
      recommendations: [
        'Aim to increase working sets by +1 rep or +2.5kg next session on compound openers.',
        'Ensure 2-3 seconds controlled eccentrics to maximize muscle fiber micro-tears.'
      ],
      recoveryAdvice: 'Target 1.6-2.2g protein per kg of bodyweight today. Prioritize 7-8 hours deep sleep for full myofibrillar protein synthesis.'
    };
  }
}

/**
 * Smart Alternative Recommendation (When gym equipment is taken)
 */
export async function getSmartExerciseSwap(
  currentExercise: Exercise,
  reason = 'Equipment is occupied in the gym',
  apiKey?: string
): Promise<{
  alternativeName: string;
  equipment: string;
  biomechanicsExplanation: string;
  recommendedWeightAdj: string;
}> {
  const prompt = `A lifter is at the gym and needs an immediate smart swap for "${currentExercise.name}" (${currentExercise.muscleGroup}, ${currentExercise.equipment}).
Reason: ${reason}.
Targeting: ${currentExercise.muscleGroup} hypertrophy.

Return the single best alternative exercise that mimics the exact biomechanics, resistance profile, and muscle fiber angle.
Respond ONLY in this JSON format:
{
  "alternativeName": "Name of replacement exercise",
  "equipment": "Dumbbell | Cable | Barbell | Machine",
  "biomechanicsExplanation": "1-2 sentences explaining why this matches the stretch/tension profile of ${currentExercise.name}",
  "recommendedWeightAdj": "e.g. Use approx 70% of barbell weight per dumbbell"
}
Return only JSON.`;

  try {
    const rawResult = await callGemini(prompt, {
      apiKey,
      responseMimeType: 'application/json',
      maxOutputTokens: 1500
    });
    return extractJson(rawResult);
  } catch (err) {
    console.warn('Gemini fallback for exercise swap:', err);
    // Rule-based fallback matching muscle group and alternate equipment
    const candidates = EXERCISE_LIBRARY.filter(
      (e) => e.muscleGroup === currentExercise.muscleGroup && e.id !== currentExercise.id
    );
    const alt = candidates.length > 0 ? candidates[0] : currentExercise;
    return {
      alternativeName: alt.name,
      equipment: alt.equipment,
      biomechanicsExplanation: `Provides equivalent tension on the ${currentExercise.muscleGroup.toLowerCase()} with high motor unit recruitment.`,
      recommendedWeightAdj: alt.equipment === 'Dumbbell' ? 'Use ~35-40% of barbell weight per hand' : 'Match resistance to RPE 8'
    };
  }
}

/**
 * AI Pre-Workout Tactical Primer based on target routine and current muscle recovery state.
 */
export async function getPreWorkoutPrimer(
  routine: Routine,
  recoveryStates: MuscleRecoveryState[],
  apiKey?: string
): Promise<{
  headline: string;
  focusPoints: string[];
  recoveryNote: string;
}> {
  const exerciseNames = routine.exercises.map((e) => {
    const meta = EXERCISE_LIBRARY.find((lib) => lib.id === e.exerciseId);
    return `${meta?.name || e.exerciseId} (${meta?.muscleGroup || 'Muscle'})`;
  }).join(', ');

  const freshMuscles = recoveryStates.filter((r) => r.status === 'Fresh').map((r) => r.muscle);
  const fatiguedMuscles = recoveryStates.filter((r) => r.status === 'Fatigued').map((r) => r.muscle);

  const prompt = `You are an elite bodybuilding coach providing a quick tactical pre-workout primer for a lifter who is about to start training.
Workout Name: "${routine.name}" (${routine.dayTag || routine.weekday})
Exercises planned: ${exerciseNames}
Fresh muscle groups: ${freshMuscles.join(', ') || 'Normal'}
Fatigued muscle groups: ${fatiguedMuscles.join(', ') || 'None'}

Provide concise, laser-focused, biomechanically sound cues in JSON format with exactly these keys:
{
  "headline": "Short punchy motivational slogan (max 8 words)",
  "focusPoints": [
    "Primary progressive overload or tempo cue for compound openers",
    "Mind-muscle connection or eccentric control cue"
  ],
  "recoveryNote": "1 sentence summarizing physiological readiness for today's session"
}
Return ONLY valid JSON. No extra text.`;

  try {
    const rawResult = await callGemini(prompt, {
      apiKey,
      responseMimeType: 'application/json',
      maxOutputTokens: 1000
    });
    const parsed = extractJson<any>(rawResult);
    return {
      headline: parsed.headline || 'Maximum Tension & Progressive Overload',
      focusPoints: parsed.focusPoints || [
        'Push top sets to RPE 8.5 with strict 2-3 second eccentrics.',
        'Ensure full range of motion stretch on each repetition.'
      ],
      recoveryNote: parsed.recoveryNote || 'Target muscle groups are primed for mechanical tension.'
    };
  } catch (err) {
    console.warn('Gemini fallback for pre-workout primer:', err);
    return {
      headline: `Primed for ${routine.dayTag || routine.name}`,
      focusPoints: [
        'Aim to beat last week’s working sets by +1 rep or +2.5kg on opening compound lifts.',
        'Control the negative (eccentric) phase for 2-3 seconds to maximize mechanical tension.'
      ],
      recoveryNote: freshMuscles.length > 0
        ? `${freshMuscles.slice(0, 3).join(', ')} are in optimal fresh state for heavy load.`
        : 'Target muscle groups are well-rested. Stay hydrated and lock in your mind-muscle connection.'
    };
  }
}


export interface CoachProposedAction {
  action: 'UPDATE_ROUTINE' | 'UPDATE_ALL_ROUTINES' | 'MODIFY_ACTIVE_WORKOUT';
  weekday?: string;
  routineName?: string;
  description?: string;
  exercises?: {
    exerciseId: string;
    name?: string;
    defaultSets: number;
    targetRepRange: [number, number];
    defaultWeightKg?: number;
    targetRpe: number;
    restSeconds: number;
  }[];
  activeWorkoutChanges?: {
    type: 'SWAP_EXERCISE' | 'ADD_EXERCISE' | 'REMOVE_EXERCISE' | 'UPDATE_TARGETS';
    oldExerciseId?: string;
    oldExerciseName?: string;
    newExercise?: {
      exerciseId: string;
      name: string;
      muscleGroup: string;
      equipment: string;
      sets: number;
      targetWeightKg?: number;
      targetReps?: number;
      restSeconds?: number;
    };
    targetWeightKg?: number;
    targetReps?: number;
    targetRpe?: number;
  };
  routines?: Routine[];
}

export interface AICoachReply {
  text: string;
  proposedAction?: CoachProposedAction;
}

/**
 * Interactive AI Fitness Coach Chat with Direct Routine & Exercise Modification
 */
export async function chatWithAICoach(
  conversation: { role: 'user' | 'assistant'; text: string }[],
  context: {
    recentVolume: number;
    split: string;
    prs: string[];
    userSettings: UserSettings;
    currentRoutines?: Routine[];
    activeSession?: WorkoutSession | null;
    recoveryStates?: MuscleRecoveryState[];
  }
): Promise<AICoachReply> {
  const historyText = conversation
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`)
    .join('\n');

  const routinesSummary = context.currentRoutines
    ? context.currentRoutines
        .map(
          (r) =>
            `- ${r.weekday} (${r.name}): [${r.exercises.map((e) => e.exerciseId).join(', ')}]`
        )
        .join('\n')
    : '5-Day Hypertrophy Split';

  const activeWorkoutSummary = context.activeSession
    ? `ACTIVE WORKOUT IN PROGRESS:
- Name: "${context.activeSession.routineName}" (${context.activeSession.dayTag || 'Custom'})
- Duration so far: ${Math.round(context.activeSession.durationSeconds / 60)} min
- Logged Volume: ${context.activeSession.totalVolumeKg} ${context.userSettings.unit}
- Exercises in active session:
${context.activeSession.exercises.map((ex, i) => `  ${i + 1}. ${ex.name} (${ex.muscleGroup}): ${ex.sets.length} sets [${ex.sets.filter((s) => s.completed).length}/${ex.sets.length} completed]`).join('\n')}`
    : 'NO active workout in progress currently.';

  const recoverySummary = context.recoveryStates && context.recoveryStates.length > 0
    ? `MUSCLE RECOVERY READINESS:
- Fresh / Ready (>=80%): ${context.recoveryStates.filter((r) => r.recoveryPercentage >= 80).map((r) => `${r.muscle} (${r.recoveryPercentage}%)`).join(', ') || 'All standard'}
- Fatigued / Sore (<60%): ${context.recoveryStates.filter((r) => r.recoveryPercentage < 60).map((r) => `${r.muscle} (${r.recoveryPercentage}%)`).join(', ') || 'None'}`
    : 'Recovery: Fully primed.';

  const prompt = `You are "Coach Overload" — the head AI hypertrophy scientist and personal bodybuilding coach in Overload AI.
You combine the mechanical tension rigor of Dr. Mike Israetel and Jeff Nippard with the high-octane motivational intensity of an elite strength mentor.

ATHLETE PROFILE:
- Name: ${context.userSettings.userName || 'Athlete'}
- Experience: ${context.userSettings.experienceLevel || 'Intermediate'} | Goal: ${context.userSettings.primaryGoal || 'Hypertrophy'}
- Current Weight: ${context.userSettings.bodyWeightKg ? `${context.userSettings.bodyWeightKg} kg` : '80 kg'} | Target: ${context.userSettings.targetWeightKg ? `${context.userSettings.targetWeightKg} kg` : '85 kg'}
- Unit Preference: ${context.userSettings.unit}
- Recent Weekly Volume: ${context.recentVolume} ${context.userSettings.unit}
- Notable Personal Records: ${context.prs.join(', ') || 'In training cycle'}

${activeWorkoutSummary}

${recoverySummary}

CURRENT WEEKLY ROUTINE TEMPLATES:
${routinesSummary}

APP CAPABILITIES THAT YOU OWN & CAN GUIDE THE ATHLETE ON:
- 🧬 3D Anatomical Demonstration GIFs & Biomechanical Vector Player for all 1,500+ exercises (including strength, hypertrophy, and cardio).
- ⚡ Supersets & Giant Sets: 1-tap antagonist pairing (e.g. Biceps + Triceps) with deferred rest.
- 🎯 Smart Drop-Sets: Instant -20% and -25% load calculation chips for metabolic fatigue.
- 🏋️ Barbell Plate Calculator: Exact 20kg/15kg Olympic plate visualizer per side.
- 📊 Weekly Volume Landmarks: Live tracking against Maintenance (MV), Optimal Growth (MAV: 10-18 sets 🎯), and Max Recoverable (MRV).
- 🎙️ Hands-Free Voice Logger: Microphone logging for chalked hands in the gym.
- 💾 Unlimited Offline Storage: Complete client-side IndexedDB persistence.

AVAILABLE EXERCISES IN LIBRARY (${EXERCISE_LIBRARY.length} TOTAL):
${EXERCISE_LIBRARY.map((e) => `${e.id} (${e.name} [${e.muscleGroup}])`).join(', ')}

COACHING RULES:
1. Speak with authentic bodybuilding expertise, motivational fire, and scientific precision. Use concepts like lengthened stretch hypertrophy, mechanical tension, stimulus-to-fatigue ratio (SFR), and RPE/RIR naturally.
2. If the user asks to modify an active workout (e.g. "swap hack squat for leg press right now", "add lateral raises to my workout"), create a "MODIFY_ACTIVE_WORKOUT" action.
3. If the user asks to change, swap, or restructure a scheduled routine (e.g. "change Tuesday to Push", "swap hack squat on Tuesday"), create an "UPDATE_ROUTINE" action with a full list of balanced exercises.
4. If the user asks to switch or create a multi-day split (e.g. "Push/Pull/Legs split", "Upper/Lower split"), create an "UPDATE_ROUTINE" action for the primary requested day.
5. If the user is asking advice, form checks, recovery audits, or app questions, set "action" to null.
6. CRITICAL: You MUST respond ONLY with a JSON object. Do NOT put raw JSON inside the "coachReply" text!
Output format:
{
  "coachReply": "Your response in rich, formatted markdown. Use bolding (**), bullet points (- ), and clear paragraph breaks for maximum readability. Never include raw JSON code in here.",
  "action": null | {
    "action": "UPDATE_ROUTINE" | "MODIFY_ACTIVE_WORKOUT" | "UPDATE_ALL_ROUTINES",
    "weekday": "Monday",
    "routineName": "Monday: Push A",
    "description": "Chest, Delts & Triceps Focus",
    "activeWorkoutChanges": {
      "type": "SWAP_EXERCISE" | "ADD_EXERCISE" | "REMOVE_EXERCISE",
      "oldExerciseName": "First exercise",
      "newExercise": {
        "exerciseId": "incline-dumbbell-press",
        "name": "Incline Dumbbell Press",
        "muscleGroup": "Chest",
        "equipment": "Dumbbell",
        "sets": 3,
        "targetWeightKg": 24,
        "targetReps": 10,
        "restSeconds": 90
      }
    },
    "exercises": [
      {
        "exerciseId": "smith-machine-incline-press",
        "name": "Smith Machine Incline Bench Press",
        "defaultSets": 3,
        "targetRepRange": [8, 12],
        "defaultWeightKg": 70,
        "targetRpe": 8.5,
        "restSeconds": 90
      }
    ]
  }
}

Conversation History:
${historyText}

Output valid JSON:`;

  try {
    const rawReply = await callGemini(prompt, {
      apiKey: context.userSettings.geminiApiKey,
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 2500
    });

    let coachReplyText = '';
    let proposedAction: CoachProposedAction | undefined;

    try {
      const parsed = extractJson<any>(rawReply);
      if (parsed && typeof parsed === 'object') {
        coachReplyText = parsed.coachReply || parsed.reply || parsed.text || '';
        if (parsed.action && typeof parsed.action === 'object' && parsed.action.action) {
          proposedAction = parsed.action;
        }
      }
    } catch {
      // Fallback JSON parsing
      const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          coachReplyText = parsed.coachReply || parsed.reply || parsed.text || '';
          if (parsed.action && parsed.action.action) {
            proposedAction = parsed.action;
          }
        } catch {}
      }
    }

    // Safety fallback if coachReplyText wasn't extracted
    if (!coachReplyText) {
      coachReplyText = rawReply;
    }

    // SANITIZATION: Completely strip any raw JSON or markdown code blocks from coachReplyText
    coachReplyText = coachReplyText
      .replace(/```(?:json)?[\s\S]*?```/g, '')
      .replace(/\{[\s\S]*"action"\s*:[\s\S]*\}/g, '')
      .trim();

    if (!coachReplyText && proposedAction) {
      coachReplyText = `I have dialed in the hypertrophy adjustments for your plan! Review the biomechanical breakdown below and tap **Apply** to lock it in.`;
    }

    return {
      text: coachReplyText,
      proposedAction
    };
  } catch (err) {
    console.warn('AI Coach chat fallback:', err);
    return {
      text: `Let's lock in your progressive overload! What would you like to adjust in your training? I can swap exercises in your active workout, restructure your weekly split, or audit your volume against MAV (10–18 sets) recovery landmarks.`
    };
  }
}

