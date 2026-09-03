import type { WorkoutSession, UserSettings, Exercise, Routine } from '../types/gym';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

const DEFAULT_API_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_GEMINI_API_KEY) ||
  'AIzaSyAfyy7j_3Vc9eJ4ds7RxOOmvHzUnjskosQ';

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  error?: {
    message?: string;
  };
}

export interface GeminiCallOptions {
  apiKey?: string;
  responseMimeType?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

const ACTIVE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest'
];

/**
 * Resilient multi-model call to Google Gemini API
 */
async function callGemini(
  prompt: string,
  options?: string | GeminiCallOptions
): Promise<string> {
  const opts: GeminiCallOptions =
    typeof options === 'string' ? { apiKey: options } : options || {};
  const key = opts.apiKey || DEFAULT_API_KEY;
  if (!key) {
    throw new Error('No Gemini API key provided');
  }

  const generationConfig: Record<string, any> = {
    temperature: opts.temperature ?? 0.7,
    topP: 0.95,
    maxOutputTokens: opts.maxOutputTokens ?? 2500
  };

  if (opts.responseMimeType) {
    generationConfig.responseMimeType = opts.responseMimeType;
  }

  let lastError: string = 'Unknown error';

  for (const model of ACTIVE_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = (errorData as GeminiResponse)?.error?.message || response.statusText;
        lastError = `Model ${model} (${response.status}): ${errMsg}`;
        console.warn(lastError);
        continue;
      }

      const data: GeminiResponse = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = `Model ${model} exception: ${err.message}`;
      console.warn(lastError);
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError}`);
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


export interface CoachProposedAction {
  action: 'UPDATE_ROUTINE' | 'UPDATE_ALL_ROUTINES';
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
  }
): Promise<AICoachReply> {
  const historyText = conversation
    .slice(-6)
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

  const prompt = `You are "Overload AI", an elite personal bodybuilding coach and biomechanics expert.
User Profile:
- Name: ${context.userSettings.userName}
- Age: ${context.userSettings.age ? `${context.userSettings.age} yrs` : 'Not specified'} | Height: ${context.userSettings.heightCm ? `${context.userSettings.heightCm} cm` : 'Not specified'}
- Current Weight: ${context.userSettings.bodyWeightKg ? `${context.userSettings.bodyWeightKg} kg` : 'Not specified'} | Target Weight: ${context.userSettings.targetWeightKg ? `${context.userSettings.targetWeightKg} kg` : 'Not specified'}
- Current Split: ${context.split}
- Unit: ${context.userSettings.unit}
- Goal: Hypertrophy & Progressive Overload
- Recent Volume: ${context.recentVolume} kg
- Notable PRs: ${context.prs.join(', ') || 'In training cycle'}

Current Active Routines:
${routinesSummary}

Available Exercises Library includes:
${EXERCISE_LIBRARY.map((e) => `${e.id} (${e.name})`).join(', ')}

CAPABILITY - PLAN & EXERCISE MODIFICATION:
If the user asks to change, swap, add, remove exercises, adjust sets/reps/weights, or restructure any day or plan (e.g., "swap hack squat for leg press on Tuesday", "change Friday to focus on arms", "make my plan 4 days", "reduce Wednesday volume"):
1. Provide a concise, motivating response (under 120 words) explaining your coaching decision and biomechanical rationale.
2. At the very end of your response, output a single valid JSON block containing the updated routine so the app can apply it with 1 tap:
\`\`\`json
{
  "action": "UPDATE_ROUTINE",
  "weekday": "Tuesday",
  "routineName": "Tuesday: Lower Body A",
  "description": "Short description",
  "exercises": [
    {
      "exerciseId": "sled-45-leg-press",
      "name": "Sled 45° Leg Press",
      "defaultSets": 3,
      "targetRepRange": [10, 14],
      "defaultWeightKg": 160,
      "targetRpe": 8.5,
      "restSeconds": 60
    }
  ]
}
\`\`\`
If the user is only asking general fitness questions (not asking to change a workout), answer normally without any JSON block.

Conversation:
${historyText}

Coach Response:`;

  try {
    const rawReply = await callGemini(prompt, context.userSettings.geminiApiKey);

    // Check if reply contains a JSON action block (markdown codeblock or embedded action object)
    const jsonMatch =
      rawReply.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
      rawReply.match(/(\{[\s\S]*"action"\s*:\s*"(?:UPDATE_ROUTINE|UPDATE_ALL_ROUTINES)"[\s\S]*\})/);

    if (jsonMatch) {
      try {
        const jsonContent = (jsonMatch[1] || jsonMatch[0]).trim();
        const parsedAction: CoachProposedAction = JSON.parse(jsonContent);
        const cleanedText = rawReply.replace(jsonMatch[0], '').trim();
        return {
          text: cleanedText || 'I have updated your routine as requested! Review the proposed changes below and tap Apply.',
          proposedAction: parsedAction
        };
      } catch (jsonErr) {
        console.warn('Failed parsing coach JSON action:', jsonErr);
      }
    }

    return { text: rawReply };
  } catch (err) {
    console.warn('AI Coach chat fallback:', err);
    return {
      text: `You can customize any day in your split! To modify exercises, tell me what you'd like to change (e.g. "Swap Hack Squat for Sled Leg Press on Tuesday" or "Add Incline Curls to Friday") and I will generate and apply the routine updates for you.`
    };
  }
}
