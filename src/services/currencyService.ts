import type { PaywallPlanOption } from '../types/subscription';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  monthlyPrice: string;
  annualPrice: string;
  annualMonthlyEquivalent: string;
  lifetimePrice: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    monthlyPrice: '£3.99',
    annualPrice: '£24.99',
    annualMonthlyEquivalent: '£2.08',
    lifetimePrice: '£59.99'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    monthlyPrice: '$4.99',
    annualPrice: '$29.99',
    annualMonthlyEquivalent: '$2.50',
    lifetimePrice: '$69.99'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    monthlyPrice: '€4.49',
    annualPrice: '€27.99',
    annualMonthlyEquivalent: '€2.33',
    lifetimePrice: '€64.99'
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    monthlyPrice: 'CA$6.49',
    annualPrice: 'CA$39.99',
    annualMonthlyEquivalent: 'CA$3.33',
    lifetimePrice: 'CA$89.99'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    monthlyPrice: 'A$7.49',
    annualPrice: 'A$44.99',
    annualMonthlyEquivalent: 'A$3.75',
    lifetimePrice: 'A$99.99'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    flag: '🇯🇵',
    monthlyPrice: '¥700',
    annualPrice: '¥4,200',
    annualMonthlyEquivalent: '¥350',
    lifetimePrice: '¥9,800'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    flag: '🇮🇳',
    monthlyPrice: '₹399',
    annualPrice: '₹2,499',
    annualMonthlyEquivalent: '₹208',
    lifetimePrice: '₹5,999'
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    flag: '🇧🇷',
    monthlyPrice: 'R$24.90',
    annualPrice: 'R$149.90',
    annualMonthlyEquivalent: 'R$12.49',
    lifetimePrice: 'R$349.90'
  }
};

const STORAGE_CURRENCY_KEY = 'overload_preferred_currency_v1';

class CurrencyService {
  private detectedCurrency: string = 'GBP';
  private currentCurrency: string = 'GBP';
  private listeners: Set<(currency: string) => void> = new Set();

  constructor() {
    this.detectedCurrency = this.detectCountryCurrency();
    this.currentCurrency = this.loadPreference();
  }

  /**
   * Detects the user's country currency using browser timezone and locale,
   * strictly defaulting to GBP if uncertain.
   */
  private detectCountryCurrency(): string {
    if (typeof window === 'undefined') return 'GBP';

    try {
      // 1. Timezone detection (most reliable for country of physical device)
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.startsWith('Europe/London') || tz.startsWith('Europe/Belfast') || tz.startsWith('GB')) {
        return 'GBP';
      }
      if (
        tz.startsWith('America/New_York') ||
        tz.startsWith('America/Chicago') ||
        tz.startsWith('America/Los_Angeles') ||
        tz.startsWith('America/Denver') ||
        tz.startsWith('America/Phoenix') ||
        tz.startsWith('US/')
      ) {
        return 'USD';
      }
      if (
        tz.startsWith('Europe/Paris') ||
        tz.startsWith('Europe/Berlin') ||
        tz.startsWith('Europe/Rome') ||
        tz.startsWith('Europe/Madrid') ||
        tz.startsWith('Europe/Amsterdam') ||
        tz.startsWith('Europe/Brussels') ||
        tz.startsWith('Europe/Vienna') ||
        tz.startsWith('Europe/Dublin') ||
        tz.startsWith('Europe/Helsinki') ||
        tz.startsWith('Europe/Lisbon') ||
        tz.startsWith('Europe/Athens')
      ) {
        return 'EUR';
      }
      if (
        tz.startsWith('America/Toronto') ||
        tz.startsWith('America/Vancouver') ||
        tz.startsWith('America/Montreal') ||
        tz.startsWith('America/Edmonton') ||
        tz.startsWith('America/Winnipeg') ||
        tz.startsWith('Canada/')
      ) {
        return 'CAD';
      }
      if (
        tz.startsWith('Australia/') ||
        tz.startsWith('Antarctica/Macquarie')
      ) {
        return 'AUD';
      }
      if (tz.startsWith('Asia/Tokyo')) return 'JPY';
      if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'INR';
      if (tz.startsWith('America/Sao_Paulo') || tz.startsWith('Brazil/')) return 'BRL';

      // 2. Locale language detection fallback
      const navLang = (navigator.language || '').toLowerCase();
      if (navLang.includes('en-gb')) return 'GBP';
      if (navLang.includes('en-us')) return 'USD';
      if (navLang.includes('fr-fr') || navLang.includes('de-de') || navLang.includes('es-es') || navLang.includes('it-it')) {
        return 'EUR';
      }
      if (navLang.includes('en-ca') || navLang.includes('fr-ca')) return 'CAD';
      if (navLang.includes('en-au')) return 'AUD';
      if (navLang.includes('ja')) return 'JPY';
      if (navLang.includes('hi') || navLang.includes('en-in')) return 'INR';
      if (navLang.includes('pt-br')) return 'BRL';
    } catch (e) {
      console.warn('Could not detect device country currency, falling back to GBP:', e);
    }

    // Default to GBP
    return 'GBP';
  }

  private loadPreference(): string {
    if (typeof window === 'undefined') return 'GBP';
    try {
      const saved = localStorage.getItem(STORAGE_CURRENCY_KEY);
      if (saved && saved !== 'auto') {
        if (SUPPORTED_CURRENCIES[saved]) return saved;
      }
    } catch {}
    return this.detectedCurrency || 'GBP';
  }

  public getCurrency(): string {
    return this.currentCurrency;
  }

  public getCurrencyConfig(): CurrencyConfig {
    return SUPPORTED_CURRENCIES[this.currentCurrency] || SUPPORTED_CURRENCIES.GBP;
  }

  public getDetectedCurrency(): string {
    return this.detectedCurrency;
  }

  public setCurrency(currencyCode: string) {
    if (currencyCode === 'auto') {
      this.currentCurrency = this.detectedCurrency;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_CURRENCY_KEY);
      }
    } else if (SUPPORTED_CURRENCIES[currencyCode]) {
      this.currentCurrency = currencyCode;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_CURRENCY_KEY, currencyCode);
      }
    }
    this.listeners.forEach((cb) => cb(this.currentCurrency));
  }

  public subscribe(cb: (currency: string) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Generates localized paywall plan options with exact pricing, discount badges, and billing subtexts.
   */
  public getLocalizedPlans(): PaywallPlanOption[] {
    const config = this.getCurrencyConfig();

    return [
      {
        id: 'monthly',
        title: 'Monthly Pass',
        price: config.monthlyPrice,
        period: '/ month',
        subtext: 'Billed monthly. Cancel anytime.'
      },
      {
        id: 'annual',
        title: 'Annual Pro',
        price: config.annualPrice,
        period: '/ year',
        subtext: `Just ${config.annualMonthlyEquivalent}/mo. Billed annually.`,
        badge: 'SAVE 50% • BEST VALUE',
        highlighted: true
      },
      {
        id: 'lifetime',
        title: 'Lifetime Athlete',
        price: config.lifetimePrice,
        period: 'one-time',
        subtext: 'Pay once, own all future updates forever.'
      }
    ];
  }
}

export const currencyService = new CurrencyService();
