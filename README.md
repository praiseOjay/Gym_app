# Overload AI — Mobile Gym & Hypertrophy Tracker

An elite personal bodybuilding and progressive overload web app built for lifters. Overload AI combines mechanical tension tracking, automated overload suggestions, smart gym equipment swaps, an interactive monthly workout calendar, and progression graphing powered by Google Gemini.

---

## Key Features

- **⚡ Progressive Overload Engine**: Automatically calculates target weights and rep ranges based on previous set performance and target RPE (Rate of Perceived Exertion).
- **🤖 Gemini AI Gym Coach**:
  - Chat with Overload AI to restructure routines, swap exercises, or adjust volume with 1-tap updates.
  - Multi-model fallback architecture (`gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`).
  - **Smart Exercise Swap**: Biomechanics-based alternative generator when gym machines or equipment are occupied.
  - **Post-Workout Debrief**: AI analysis summarizing mechanical volume, PR achievements, overload targets, and recovery/nutrition guidance.
- **📈 Progression Graphs & Charts**:
  - **Volume Over Time**: Smooth Bézier curves tracking total mechanical volume with interactive tooltips and growth percentage metrics.
  - **Exercise Strength Tracker**: Track top working set weights and estimated 1RMs for individual exercises across sessions.
  - **Consistency**: Weekly session accumulation tracker.
  - Timeframe filtering (30 Days, 90 Days, All Time).
- **📅 Monthly Workout Calendar**:
  - Full-month calendar grid with glowing workout indicators and PR stars.
  - Monthly KPI summary bar (Total Workouts, Mechanical Volume, PRs Hit, Consistency Streak).
  - Selected Day Workout Inspector showing full exercise breakdowns, sets, weights, and notes.
- **🔥 Muscle Recovery Heatmap**: Real-time recovery state tracking across all muscle groups calculated from recent volume and rest duration.
- **🏆 PR Hall of Fame**: Automatic 1RM and working set PR detection and celebration with audio and confetti.
- **⏱️ Floating Rest Timer & Plate Calculator**: Seamless rest intervals with customizable audio cues and barbell plate loading calculations.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS (Cyberpunk dark aesthetic with volt green & cyan accents, glassmorphism)
- **Icons**: Lucide React
- **AI**: Google Gemini API (`generativelanguage.googleapis.com`)
- **Animation**: Canvas Confetti

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/praiseOjay/Gym_app.git
cd Gym_app
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your Gemini API key:

```bash
cp .env.example .env
```

Add your key in `.env`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production

```bash
npm run build
```

---

## 📱 Running on Your Phone (Android)

### Option 1: Automated APK Download via GitHub Actions (Zero Local Setup)

This repository includes a GitHub Actions workflow that automatically compiles and packages `OverloadAI-debug.apk`:

1. Push your changes to GitHub:

   ```bash
   git add .
   git commit -m "Add Android Capacitor support"
   git push origin main
   ```

2. Navigate to your repository on GitHub and click the **Actions** tab.
3. Click the latest **Build Android APK** workflow run.
4. Under **Artifacts**, download `OverloadAI-debug-apk`.
5. Transfer or download the `.apk` directly onto your Android phone, tap to install, and enjoy Overload AI natively on your device!

### Option 2: Local Android Studio Build

If you have Android Studio installed on your computer:

```bash
# Sync web assets to Android
npm run cap:sync

# Open project in Android Studio
npm run cap:open
```

In Android Studio, connect your phone via USB (with USB Debugging enabled) and click **Run**, or select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

### Option 3: Instant Local Wi-Fi Testing

To test immediately on your phone without installing an APK:

```bash
npm run dev -- --host
```

Open `http://<your-computer-ip>:5173` on Chrome on your Android phone connected to the same Wi-Fi. Tap the browser menu (3 dots) and select **"Add to Home screen"** or **"Install app"**.

---

## License

MIT
