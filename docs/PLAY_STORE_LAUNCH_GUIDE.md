# Google Play Store Launch Guide for Overload AI

This guide takes you through the step-by-step process of preparing, building, and publishing **Overload AI** to the Google Play Store using your production Android App Bundle (`.aab`).

---

## 1. Google Play Console Account Setup

1. **Sign Up**: Go to the [Google Play Console](https://play.google.com/console/signup).
2. **Account Fee**: Pay the one-time **$25 USD registration fee**.
3. **Account Type**:
   - **Personal Account**: Note that Google requires all new personal developer accounts created after November 2023 to run a **14-day closed beta with at least 12 opted-in testers** before public production release access is enabled.
   - **Organization Account** (if you have an LLC or Ltd and D-U-N-S number): Exempt from the 12-tester closed test rule.

---

## 2. Generating & Protecting Your Release Keystore

The release keystore (`.jks`) is your app's permanent cryptographic certificate. Google Play validates every update against this key.

### Generating the Keystore
Open PowerShell in the `android/` directory and run:

```powershell
keytool -genkey -v -keystore overload-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias overload
```

You will be prompted for:
- A secure password (e.g. `MySuperSecretPassword123`)
- Your name, organization, and country code (`GB` / `US`).

### Configuring Local Signing (Optional)
Copy `android/keystore.properties.example` to `android/keystore.properties`:

```properties
storeFile=overload-release-key.jks
storePassword=MySuperSecretPassword123
keyAlias=overload
keyPassword=MySuperSecretPassword123
```

> [!CAUTION]
> **Backup Warning**: Save your `overload-release-key.jks` and passwords in a secure password manager (e.g. 1Password, Bitwarden, or encrypted USB). If you lose this file, you will permanently lose the ability to update the app on Google Play!

---

## 3. Building the Production `.AAB` (Two Methods)

Google Play strictly requires the **Android App Bundle (`.aab`)** format, which optimizes downloads per device.

### Method A: Automated Cloud Build via GitHub Actions (Recommended — Zero Local Setup)

Because your repository includes `.github/workflows/android-release.yml`, GitHub builds the bundle in the cloud for free:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure Android release assets and build pipeline"
   git push origin main
   ```
2. *(Optional - To auto-sign on GitHub)*:
   - Convert your keystore to base64:
     ```powershell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("android/overload-release-key.jks")) | Set-Clipboard
     ```
   - In GitHub, go to **Settings > Secrets and variables > Actions** and add:
     - `ANDROID_KEYSTORE_BASE64` (paste from clipboard)
     - `KEYSTORE_PASSWORD`
     - `KEY_ALIAS` (e.g. `overload`)
     - `KEY_PASSWORD`
3. Go to **Actions > Build Android Release (.AAB & .APK) > Run workflow**.
4. In ~2 minutes, download `overload-ai-release-bundle-aab` directly from GitHub Artifacts!

---

### Method B: Local Build via Android Studio

1. Open Android Studio:
   ```bash
   npm run cap:open
   ```
2. Wait for Gradle sync to finish.
3. In the top menu, select **Build > Generate Signed Bundle / APK...**
4. Choose **Android App Bundle**, select your `overload-release-key.jks`, enter your passwords, and choose **release**.
5. The generated `.aab` will be located at:
   `android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. Google Play Store Listing & Graphics

Your marketing assets are pre-generated in `play-store-assets/`:

| Asset | File Location | Specifications |
| :--- | :--- | :--- |
| **App Icon** | `play-store-assets/icon-512.png` | 512 × 512 px, 32-bit PNG, solid background |
| **Feature Graphic** | `play-store-assets/feature-graphic-1024x500.png` | 1024 × 500 px banner |
| **App Title** | `Overload AI` | Max 30 characters |
| **Short Description** | `The smart hypertrophy, volume landmarks & progressive overload gym tracker.` | Max 80 characters |
| **Full Description** | Highlight AI Coach, 1,500+ clean visuals, volume tracking, and offline logging. | Max 4,000 characters |

---

## 5. Completing the Google Play Data Safety Questionnaire

Google requires you to declare your data practices. For Overload AI:

1. **Does your app collect or share user data?**:
   - Audio: Select **Yes** (solely for the hands-free voice logger).
   - Under Audio usage:
     - Purpose: **App functionality**
     - Ephemeral processing: **Yes** (Audio is transcribed in real-time and immediately discarded, never stored).
     - Data shared with third parties: **No**
2. **Local Storage / Workout Logs**:
   - Workout logs, sets, and weights are stored locally on the user's device (IndexedDB).
   - Not collected to external developer servers.

---

## 6. Closed Testing Track (The 14-Day 12-Tester Mandate)

1. In Google Play Console, go to **Testing > Closed testing**.
2. Click **Create track** (e.g. *Closed Beta*).
3. Click **Create release** and upload your `app-release.aab`.
4. Create an email list of at least **12 testers** (friends, workout partners, or gym community).
5. Share the opt-in link provided by Google Play Console.
6. Once 12 testers have opted in, keep the closed test active for **14 consecutive days**.
7. After 14 days, click **Apply for production** in the Google Play Console dashboard to go live to the public!
