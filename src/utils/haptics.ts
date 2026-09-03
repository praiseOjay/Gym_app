/**
 * Haptic feedback utility using the Web Vibration API.
 * Provides subtle physical confirmation for lifters in the gym.
 * Gracefully no-ops if vibration is unsupported or disabled.
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'pr';

export function triggerHaptic(type: HapticType = 'medium', enabled: boolean = true): void {
  if (!enabled || typeof window === 'undefined' || !('vibrate' in navigator)) {
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
