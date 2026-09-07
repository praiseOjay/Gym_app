/**
 * Web Speech Recognition Service for Hands-Free Gym Set Logging
 */
import { lbsToKg } from '../engine/overloadEngine';
import { milesToKm } from '../utils/trackingTypeUtils';
import type { SetType } from '../types/gym';

export interface ParsedVoiceCommand {
  rawTranscript: string;
  weightKg?: number;
  reps?: number;
  durationSeconds?: number;
  distanceKm?: number;
  rpe?: number;
  setType?: SetType;
  action?: 'complete' | 'next' | 'rest' | 'set_data';
  restSeconds?: number;
  confidence: number;
}

// Check Web Speech API support in browser
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Intelligent gym speech parser.
 * Handles patterns such as:
 * - "80 kilos for 8 reps"
 * - "100 kg 6 reps at rpe 8"
 * - "185 pounds for 10"
 * - "20 minutes 5 kilometers"
 * - "15 minutes"
 * - "45 seconds"
 * - "Drop set 60 kilos 12 reps"
 * - "Complete set" / "Done" / "Next set"
 * - "Rest 90 seconds"
 */
export function parseGymVoiceCommand(transcript: string, unit: 'kg' | 'lbs' = 'kg'): ParsedVoiceCommand {
  const clean = transcript.toLowerCase().trim();
  const result: ParsedVoiceCommand = {
    rawTranscript: transcript,
    confidence: 0.9
  };

  // 1. Direct command actions
  if (/\b(complete|completed|done|finish|finished|check|log set)\b/.test(clean)) {
    result.action = 'complete';
  } else if (/\b(next set|next)\b/.test(clean)) {
    result.action = 'next';
  } else if (/\b(rest|timer)\b/.test(clean)) {
    result.action = 'rest';
    const restMatch = clean.match(/(\d+)\s*(?:seconds|sec|s)?/);
    if (restMatch) {
      result.restSeconds = parseInt(restMatch[1], 10);
    }
  }

  // 2. Detect Set Type
  if (/\b(drop set|drop)\b/.test(clean)) {
    result.setType = 'drop';
  } else if (/\b(warmup|warm up|light ramp)\b/.test(clean)) {
    result.setType = 'warmup';
  } else if (/\b(failure|to failure|till failure)\b/.test(clean)) {
    result.setType = 'failure';
  }

  // 3. Detect RPE
  const rpeMatch = clean.match(/(?:rpe|effort|rate|scale)\s*(\d+(?:\.\d+)?)/i);
  if (rpeMatch) {
    const rpeVal = parseFloat(rpeMatch[1]);
    if (rpeVal >= 1 && rpeVal <= 10) {
      result.rpe = rpeVal;
    }
  }

  // 4. Detect Distance (e.g. "5 km", "3.2 kilometers", "2 miles")
  const distanceMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:km|kms|kilometers|kilometer|miles|mile|mi)\b/i);
  if (distanceMatch) {
    const rawDist = parseFloat(distanceMatch[1]);
    const isMiles = /(?:miles|mile|mi)/i.test(distanceMatch[0]);
    result.distanceKm = isMiles || unit === 'lbs' ? (isMiles ? milesToKm(rawDist) : rawDist) : rawDist;
    result.action = result.action || 'set_data';
  }

  // 5. Detect Duration (e.g. "20 minutes", "15 mins", "45 seconds")
  let detectedDuration = 0;
  const minuteMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:minutes|minute|mins|min)\b/i);
  if (minuteMatch) {
    detectedDuration += Math.round(parseFloat(minuteMatch[1]) * 60);
  }
  const secondMatch = clean.match(/(\d+)\s*(?:seconds|second|secs|sec|s)\b/i);
  if (secondMatch && !clean.includes('rest')) {
    detectedDuration += parseInt(secondMatch[1], 10);
  }
  if (detectedDuration > 0) {
    result.durationSeconds = detectedDuration;
    result.action = result.action || 'set_data';
  }

  // 6. Detect Weight and Reps
  // Pattern A: "80 kg for 8 reps" or "80 kilos 8 reps" or "185 lbs for 5"
  let parsedWeight: number | undefined;
  let parsedReps: number | undefined;

  const weightUnitMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilo|pounds|lbs|lb)\b/i);
  if (weightUnitMatch) {
    const val = parseFloat(weightUnitMatch[1]);
    const isLbsInSpeech = /(?:pounds|lbs|lb)/.test(weightUnitMatch[0]);
    parsedWeight = isLbsInSpeech || unit === 'lbs' ? (isLbsInSpeech ? lbsToKg(val) : val) : val;
  }

  const repMatch = clean.match(/(?:for|x|by|\b)\s*(\d+)\s*(?:reps|rep)\b/i);
  if (repMatch) {
    parsedReps = parseInt(repMatch[1], 10);
  }

  // Pattern B: e.g. "80 for 8" or "80 by 10" or "80 x 8"
  if (parsedWeight === undefined || parsedReps === undefined) {
    const comboMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:for|by|x)\s*(\d+)/i);
    if (comboMatch) {
      if (parsedWeight === undefined) {
        const rawW = parseFloat(comboMatch[1]);
        parsedWeight = unit === 'lbs' ? lbsToKg(rawW) : rawW;
      }
      if (parsedReps === undefined) {
        parsedReps = parseInt(comboMatch[2], 10);
      }
    }
  }

  // Pattern C: standalone numbers if only two numbers in string (e.g. "100 8")
  if (parsedWeight === undefined && parsedReps === undefined && !result.distanceKm && !result.durationSeconds) {
    const numbers = clean.match(/\b\d+(?:\.\d+)?\b/g);
    if (numbers && numbers.length >= 2) {
      const rawW = parseFloat(numbers[0]);
      parsedWeight = unit === 'lbs' ? lbsToKg(rawW) : rawW;
      parsedReps = parseInt(numbers[1], 10);
    } else if (numbers && numbers.length === 1 && result.action === undefined) {
      // Single number could be reps if < 30 and no weight mentioned
      const singleNum = parseFloat(numbers[0]);
      if (singleNum <= 30) {
        parsedReps = Math.round(singleNum);
      } else {
        parsedWeight = unit === 'lbs' ? lbsToKg(singleNum) : singleNum;
      }
    }
  }

  if (parsedWeight !== undefined) {
    result.weightKg = Math.round(parsedWeight * 10) / 10;
  }
  if (parsedReps !== undefined) {
    result.reps = parsedReps;
  }

  if (
    result.weightKg !== undefined ||
    result.reps !== undefined ||
    result.setType !== undefined ||
    result.durationSeconds !== undefined ||
    result.distanceKm !== undefined
  ) {
    result.action = result.action || 'set_data';
  }

  return result;
}

export class VoiceLoggerController {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback?: (cmd: ParsedVoiceCommand) => void;
  private onErrorCallback?: (err: string) => void;
  private onListeningChange?: (active: boolean) => void;
  private unit: 'kg' | 'lbs' = 'kg';

  constructor(unit: 'kg' | 'lbs' = 'kg') {
    this.unit = unit;
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          const parsed = parseGymVoiceCommand(finalTranscript, this.unit);
          this.onResultCallback?.(parsed);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          this.onErrorCallback?.(`Microphone notice: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onListeningChange?.(false);
      };
    }
  }

  setUnit(unit: 'kg' | 'lbs') {
    this.unit = unit;
  }

  start(
    onResult: (cmd: ParsedVoiceCommand) => void,
    onError: (err: string) => void,
    onListeningChange: (active: boolean) => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech Recognition is not supported by your browser.');
      return false;
    }

    if (this.isListening) return true;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onListeningChange = onListeningChange;

    try {
      this.recognition.start();
      this.isListening = true;
      this.onListeningChange(true);
      return true;
    } catch (e: any) {
      onError(e.message || 'Failed to start microphone');
      return false;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
      this.onListeningChange?.(false);
    }
  }

  get listening(): boolean {
    return this.isListening;
  }
}
