/**
 * Web Audio API synthesizer for clean, zero-dependency gym timer chimes & PR fanfares.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Rest timer countdown warning beep (3, 2, 1...)
   */
  playWarningBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Rest timer finished alert chime
   */
  playTimerComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // High pitch two-tone ding
      [
        { freq: 880, start: 0, dur: 0.18 },
        { freq: 1174.66, start: 0.15, dur: 0.35 }
      ].forEach((tone) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(tone.freq, now + tone.start);
        gain.gain.setValueAtTime(0.25, now + tone.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + tone.start + tone.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + tone.start);
        osc.stop(now + tone.start + tone.dur);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Personal Record (PR) celebration fanfare
   */
  playPRCelebration() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.25, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  /**
   * Quick set checked haptic/sound
   */
  playSetComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

export const sounds = new SoundEffects();
