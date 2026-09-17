# Overload AI - Cloudflare Worker Proxy

This folder contains the production serverless security proxy for Google Gemini AI.

## Free Tier Benefits:
- **100,000 free requests per day** (~3,000,000 per month).
- **0ms cold-start latency** (instant AI responses).
- **No credit card required** to sign up.

---

## 3-Minute Deployment Instructions

### Step 1: Login to Cloudflare
Run in your terminal:
```bash
npm run proxy:login
```
*A browser window will open. If you don't have a Cloudflare account, click "Sign Up" (free email registration, no credit card required).*

### Step 2: Store your Gemini Secret Key
Run:
```bash
npm run proxy:secret
```
*When prompted, paste your Google Gemini API key and press Enter. Cloudflare will encrypt and store it securely.*

### Step 3: Deploy the Worker
Run:
```bash
npm run proxy:deploy
```

Cloudflare will deploy your worker globally and display your live URL, for example:
```text
Published overload-ai-proxy (0.21 sec)
  https://overload-ai-proxy.<your-subdomain>.workers.dev
```

---

## Step 4: Link with Overload AI

Copy your published worker URL and paste it in either:

1. **In your local `.env` file**:
   ```env
   VITE_AI_PROXY_URL="https://overload-ai-proxy.<your-subdomain>.workers.dev"
   ```
2. **Or directly inside the running app**:
   Go to **Settings > AI Intelligence Cloud Engine > Advanced Developer Options > Custom Proxy URL**, paste your URL, and tap **Save Preferences**.
