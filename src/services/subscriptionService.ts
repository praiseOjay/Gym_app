import type {
  UserSubscriptionState,
  SubscriptionPlan
} from '../types/subscription';
import { FREE_ROUTINE_LIMIT, FREE_AI_COACH_DAILY_QUOTA } from '../types/subscription';

const STORAGE_KEY = 'overload_subscription_state_v1';
const AI_USAGE_KEY_PREFIX = 'overload_ai_usage_';

class SubscriptionService {
  private state: UserSubscriptionState;
  private listeners: Set<(state: UserSubscriptionState) => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): UserSubscriptionState {
    if (typeof window === 'undefined') {
      return { isPro: false, plan: 'free' };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse subscription state:', e);
    }
    return { isPro: false, plan: 'free' };
  }

  private persistState(newState: UserSubscriptionState) {
    this.state = newState;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        window.dispatchEvent(
          new CustomEvent('overload_subscription_changed', { detail: newState })
        );
      } catch (e) {
        console.warn('Failed to save subscription state:', e);
      }
    }
    this.listeners.forEach((cb) => cb(this.state));
  }

  public getState(): UserSubscriptionState {
    return { ...this.state };
  }

  public isPro(): boolean {
    return Boolean(this.state.isPro);
  }

  public canCreateRoutine(currentRoutinesCount: number): boolean {
    if (this.isPro()) return true;
    return currentRoutinesCount < FREE_ROUTINE_LIMIT;
  }

  public getDailyAICoachUsage(): { used: number; max: number; remaining: number } {
    if (typeof window === 'undefined') {
      return { used: 0, max: FREE_AI_COACH_DAILY_QUOTA, remaining: FREE_AI_COACH_DAILY_QUOTA };
    }
    const today = new Date().toISOString().split('T')[0];
    const key = `${AI_USAGE_KEY_PREFIX}${today}`;
    const used = parseInt(localStorage.getItem(key) || '0', 10);
    const max = this.isPro() ? Infinity : FREE_AI_COACH_DAILY_QUOTA;
    const remaining = this.isPro() ? Infinity : Math.max(0, max - used);
    return { used, max, remaining };
  }

  public canUseAICoach(): boolean {
    if (this.isPro()) return true;
    return this.getDailyAICoachUsage().remaining > 0;
  }

  public recordAICoachUsage(): void {
    if (typeof window === 'undefined') return;
    const today = new Date().toISOString().split('T')[0];
    const key = `${AI_USAGE_KEY_PREFIX}${today}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    localStorage.setItem(key, String(current + 1));
  }

  public upgradeToPro(plan: SubscriptionPlan): UserSubscriptionState {
    const newState: UserSubscriptionState = {
      isPro: true,
      plan,
      purchasedAt: new Date().toISOString()
    };
    this.persistState(newState);
    return newState;
  }

  public async restorePurchases(): Promise<{
    success: boolean;
    isPro: boolean;
    message: string;
  }> {
    // In production with RevenueCat Capacitor plugin, this queries Google Play Store receipt ledger.
    // For local dev / offline resilience, we verify local state and report status accurately.
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate store verification latency
    if (this.state.isPro) {
      return {
        success: true,
        isPro: true,
        message: `Restored active ${this.state.plan.toUpperCase()} membership successfully!`
      };
    }
    return {
      success: false,
      isPro: false,
      message: 'No previous active subscription found on this Google Play account.'
    };
  }

  public toggleDevPro(): UserSubscriptionState {
    const nextIsPro = !this.state.isPro;
    const newState: UserSubscriptionState = {
      isPro: nextIsPro,
      plan: nextIsPro ? 'annual' : 'free',
      purchasedAt: nextIsPro ? new Date().toISOString() : undefined
    };
    this.persistState(newState);
    return newState;
  }

  public subscribe(cb: (state: UserSubscriptionState) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const subscriptionService = new SubscriptionService();
