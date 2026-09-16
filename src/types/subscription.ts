export type SubscriptionPlan = 'free' | 'monthly' | 'annual' | 'lifetime';

export type PaywallTriggerReason =
  | 'routine_limit'      // Hit 3 routine limit on Free
  | 'ai_coach'           // Full AI Coach & Chat access
  | 'smart_swap'         // Smart Swaps powered by AI
  | 'analytics_export'   // CSV/JSON Export
  | 'mesocycle_engine'   // Periodization & Fatigue engine
  | 'general';           // User tapped Upgrade to Pro / Membership

export interface UserSubscriptionState {
  isPro: boolean;
  plan: SubscriptionPlan;
  purchasedAt?: string;
  expiresAt?: string;
  isTrial?: boolean;
}

export interface PaywallPlanOption {
  id: SubscriptionPlan;
  title: string;
  price: string;
  period: string;
  subtext: string;
  badge?: string;
  highlighted?: boolean;
}

export const FREE_ROUTINE_LIMIT = 3;
export const FREE_AI_COACH_DAILY_QUOTA = 3;

export const PAYWALL_PLANS: PaywallPlanOption[] = [
  {
    id: 'monthly',
    title: 'Monthly Pass',
    price: '£3.99',
    period: '/ month',
    subtext: 'Billed monthly. Cancel anytime.'
  },
  {
    id: 'annual',
    title: 'Annual Pro',
    price: '£24.99',
    period: '/ year',
    subtext: 'Just £2.08/mo. Billed annually.',
    badge: 'SAVE 50% • BEST VALUE',
    highlighted: true
  },
  {
    id: 'lifetime',
    title: 'Lifetime Athlete',
    price: '£59.99',
    period: 'one-time',
    subtext: 'Pay once, own all future updates forever.'
  }
];
