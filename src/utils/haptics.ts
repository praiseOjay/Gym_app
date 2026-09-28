/**
 * Haptic feedback utility using the Web Vibration API.
 * Provides subtle physical confirmation for lifters in the gym.
 * Gracefully no-ops if vibration is unsupported or disabled.
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'pr';

let globalHapticsEnabled = true;

// Initialize from local storage if available
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('overload_settings_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.vibrationEnabled === 'boolean') {
        globalHapticsEnabled = parsed.vibrationEnabled;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
}

export function setGlobalHapticsEnabled(enabled: boolean): void {
  globalHapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return globalHapticsEnabled;
}

export function triggerHaptic(type: HapticType = 'medium', enabled: boolean = globalHapticsEnabled): void {
  if (!enabled || !globalHapticsEnabled || typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
        navigator.vibrate(70);
        break;
      case 'success':
        // Two crisp taps
        navigator.vibrate([25, 40, 40]);
        break;
      case 'warning':
        // Double pulse alert
        navigator.vibrate([50, 40, 50]);
        break;
      case 'pr':
        // Grand fanfare vibration pattern
        navigator.vibrate([40, 40, 60, 40, 100]);
        break;
    }
  } catch {
    // Ignore any browser security restrictions
  }
}
