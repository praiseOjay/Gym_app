export interface GeminiCallOptions {
  apiKey?: string;
  responseMimeType?: string;
  maxOutputTokens?: number;
  temperature?: number;
  systemInstruction?: string;
}

export interface AIProxyStatus {
  mode: 'managed_proxy' | 'custom_key' | 'dev_fallback';
  providerName: string;
  proxyUrl?: string;
  isReady: boolean;
}

// Development fallback key for local verification before production proxy deployment
const DEV_FALLBACK_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_GEMINI_API_KEY) ||
  'AIzaSyAfyy7j_3Vc9eJ4ds7RxOOmvHzUnjskosQ';

const ACTIVE_GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

const STORAGE_CUSTOM_PROXY_KEY = 'overload_custom_ai_proxy_url_v1';
const STORAGE_CUSTOM_KEY_KEY = 'overload_custom_gemini_key_v1';

class AIProxyService {
  private proxyUrl: string = '';
  private customKey: string = '';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.proxyUrl = this.loadProxyUrl();
    this.customKey = this.loadCustomKey();
  }

  private loadProxyUrl(): string {
    if (typeof window === 'undefined') return '';
    const envProxy =
      (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_AI_PROXY_URL) || '';
    const envKey =
      (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_GEMINI_API_KEY) || '';
    const fallbackUrl = envKey.startsWith('http') ? envKey.trim() : '';
    const stored = localStorage.getItem(STORAGE_CUSTOM_PROXY_KEY) || '';
    return stored || envProxy || fallbackUrl;
  }

  private loadCustomKey(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_CUSTOM_KEY_KEY) || '';
  }

  public getProxyUrl(): string {
    return this.proxyUrl;
  }

  public setProxyUrl(url: string): void {
    this.proxyUrl = url.trim();
    if (typeof window !== 'undefined') {
      if (this.proxyUrl) {
        localStorage.setItem(STORAGE_CUSTOM_PROXY_KEY, this.proxyUrl);
      } else {
        localStorage.removeItem(STORAGE_CUSTOM_PROXY_KEY);
      }
    }
    this.notifyListeners();
  }

  public getCustomKey(): string {
    return this.customKey;
  }

  public setCustomKey(key: string): void {
    this.customKey = key.trim();
    if (typeof window !== 'undefined') {
      if (this.customKey) {
        localStorage.setItem(STORAGE_CUSTOM_KEY_KEY, this.customKey);
      } else {
        localStorage.removeItem(STORAGE_CUSTOM_KEY_KEY);
      }
    }
    this.notifyListeners();
  }

  public getStatus(): AIProxyStatus {
    if (this.customKey) {
      return {
        mode: 'custom_key',
        providerName: 'Custom Developer Key (BYOK)',
        isReady: true
      };
    }
    if (this.proxyUrl) {
      return {
        mode: 'managed_proxy',
        providerName: 'Overload AI Secure Proxy',
        proxyUrl: this.proxyUrl,
        isReady: true
      };
    }
    return {
      mode: 'dev_fallback',
      providerName: 'Overload AI Cloud Engine',
      isReady: true
    };
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb());
  }

  /**
   * Unified AI caller routing through the secure proxy when configured,
   * with graceful fallback to developer key or direct Gemini calling.
   */
  public async callAI(prompt: string, options?: GeminiCallOptions): Promise<string> {
    const activeKey = options?.apiKey || this.customKey;

    // 1. If user or developer explicitly provided a custom key, use direct call
    if (activeKey) {
      return this.callDirectGemini(prompt, activeKey, options);
    }

    // 2. If a proxy URL is configured (Production Supabase / Firebase / Cloudflare), call proxy
    if (this.proxyUrl) {
      try {
        return await this.callProxyEndpoint(prompt, options);
      } catch (err: any) {
        console.warn('AI Proxy call failed, trying fallback:', err.message);
        // If proxy errors, gracefully fall back to developer key so the app never hangs
      }
    }

    // 3. Fallback to direct Gemini API with developer key
    return this.callDirectGemini(prompt, DEV_FALLBACK_KEY, options);
  }

  /**
   * Dispatches request to the serverless proxy endpoint (Supabase/Firebase/Cloudflare)
   */
  private async callProxyEndpoint(prompt: string, options?: GeminiCallOptions): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-App': 'Overload-AI',
          'X-Client-Version': '1.0.0'
        },
        signal: controller.signal,
        body: JSON.stringify({
          prompt,
          systemInstruction: options?.systemInstruction,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            topP: 0.95,
            maxOutputTokens: options?.maxOutputTokens ?? 2500,
            responseMimeType: options?.responseMimeType
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          errJson.error?.message || errJson.message || `Proxy returned HTTP ${response.status}`
        );
      }

      const data = await response.json();
      // Handle standard response wrappers ({ text: string } or Gemini candidates structure)
      if (typeof data.text === 'string') {
        return data.text;
      }
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText) {
        return candidateText;
      }

      throw new Error('Proxy returned empty AI text response');
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Resilient direct call to Google Gemini with multi-model fallback
   */
  private async callDirectGemini(
    prompt: string,
    key: string,
    options?: GeminiCallOptions
  ): Promise<string> {
    const generationConfig: Record<string, any> = {
      temperature: options?.temperature ?? 0.7,
      topP: 0.95,
      maxOutputTokens: options?.maxOutputTokens ?? 2500
    };

    if (options?.responseMimeType) {
      generationConfig.responseMimeType = options.responseMimeType;
    }

    let lastError: string = 'Unknown error';

    for (const model of ACTIVE_GEMINI_MODELS) {
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
          const errMsg = errorData?.error?.message || response.statusText;
          lastError = `Model ${model} (${response.status}): ${errMsg}`;
          console.warn(lastError);
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = `Model ${model} exception: ${err.message}`;
        console.warn(lastError);
      }
    }

    throw new Error(`AI generation failed: ${lastError}`);
  }
}

export const aiProxyService = new AIProxyService();
