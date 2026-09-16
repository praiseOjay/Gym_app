# Deploying Your Secure Gemini AI Proxy (Stage 2)

To publish **Overload AI** to the Google Play Store without asking users for their own Gemini API key (and without exposing your secret key inside the APK bundle), deploy one of these 3 serverless options.

---

## Option A: Supabase Edge Functions (Recommended — 3 Minutes)

Supabase offers **500,000 free Edge Function calls per month**, zero server maintenance, and built-in global CDN edge routing.

### Step 1: Install or Login with Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref your-supabase-project-id
```

### Step 2: Store your Gemini Secret Key

```bash
npx supabase secrets set GEMINI_API_KEY="AIzaSyYourSecretGeminiApiKeyHere"
```

### Step 3: Deploy the Edge Function

The function is pre-written in `supabase/functions/gemini-proxy/index.ts`:

```bash
npx supabase functions deploy gemini-proxy --no-verify-jwt
```

### Step 4: Link with Overload AI

Supabase outputs your function endpoint:
`https://<your-project-ref>.supabase.co/functions/v1/gemini-proxy`

Add it to your `.env` file:

```env
VITE_AI_PROXY_URL="https://<your-project-ref>.supabase.co/functions/v1/gemini-proxy"
```

Or paste it directly into **Settings > AI Cloud Engine > Custom Proxy URL** in the app!

---

## Option B: Cloudflare Workers (Fastest — 2 Minutes)

Cloudflare offers **100,000 free requests per day** and **0ms cold start latency**.

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### Step 2: Set your Secret Key

```bash
cd cloudflare
wrangler secret put GEMINI_API_KEY
# Enter your secret Gemini API key when prompted
```

### Step 3: Deploy

```bash
wrangler deploy
```

Add your worker URL (`https://overload-ai-proxy.<your-subdomain>.workers.dev`) to `VITE_AI_PROXY_URL`.

---

## Option C: Firebase Cloud Functions

If your project already uses Firebase:

### Step 1: Set Secret in Firebase Secret Manager

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

### Step 2: Deploy Function

```bash
firebase deploy --only functions:geminiProxy
```

Add the generated Cloud Function URL to `VITE_AI_PROXY_URL`.

---

## How It Works in Overload AI

- **Everyday Users**: Never see an API key field. All AI requests route through your proxy seamlessly.
- **Power Users / Developers**: Can still enter their own custom API key in **Settings > AI Cloud Engine > Custom Key (BYOK)** to test personal models.
- **Offline / Local Dev**: If `VITE_AI_PROXY_URL` is empty, the app automatically uses the developer fallback key.
