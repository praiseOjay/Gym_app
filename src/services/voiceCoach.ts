// Voice Coach Service using Web Speech API (SpeechSynthesis)
// Provides hands-free audio cues during workouts and rest countdowns

class VoiceCoachService {
  private enabled: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
      // Prefer clear English voices (Google, Samantha, Daniel, or standard en-US/en-GB)
      const preferred = voices.find(
        (v) =>
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) &&
          v.lang.startsWith('en')
      ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];
      this.selectedVoice = preferred || null;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('Speech synthesis cancel error:', e);
      }
    }
  }

  public speak(text: string, priority: boolean = false) {
    if (!this.enabled || !this.isSupported()) return;

    try {
      if (priority) {
        this.stop();
      }

      if (!this.voicesLoaded) {
        this.initVoices();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = 1.05; // slightly punchy athletic cadence
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice coach speak failed:', e);
    }
  }

  /**
   * Called immediately upon logging a completed set
   */
  public announceSetComplete(setNum: number, weight: number, reps: number, unit: string, restSeconds: number) {
    if (!this.enabled) return;
    const weightStr = weight > 0 ? `${weight} ${unit}` : 'bodyweight';
    const msg = `Set ${setNum} logged: ${weightStr} for ${reps} reps. Starting ${restSeconds} seconds rest.`;
    this.speak(msg, true);
  }

  /**
   * Called when rest timer approaches completion (e.g. 15 seconds remaining)
   */
  public announceRestApproaching(secondsRemaining: number, targetWeight?: number, targetReps?: number, unit: string = 'kg') {
    if (!this.enabled) return;
    if (targetWeight && targetWeight > 0 && targetReps) {
      this.speak(`${secondsRemaining} seconds remaining. Next set: ${targetWeight} ${unit} for ${targetReps} reps. Get focused.`);
    } else {
      this.speak(`${secondsRemaining} seconds left. Prepare for your next set.`);
    }
  }

  /**
   * Called when rest interval reaches zero
   */
  public announceRestComplete() {
    if (!this.enabled) return;
    this.speak("Rest finished. Let's attack the next set.", true);
  }

  /**
   * Real-time autoregulation audio cue (e.g. drop-off warning or overshoot adjustment)
   */
  public announceAutoregulation(message: string) {
    if (!this.enabled) return;
    this.speak(`Coaching cue: ${message}`);
  }
}

export const VoiceCoach = new VoiceCoachService();
