# Privacy Policy for Overload AI

**Effective Date:** September 16, 2026  
**Last Updated:** September 16, 2026  

Welcome to **Overload AI** ("the App"), operated and developed by Praise Ojay ("we," "us," or "our"). This Privacy Policy explains how information is collected, used, and protected when you use our mobile application and associated services.

By downloading, installing, or using Overload AI, you agree to the collection and use of information in accordance with this Privacy Policy.

---

## 1. Summary of Core Privacy Principles

- **Offline-First Storage**: Your workout logs, personal records, body measurements, and customized routines are stored **locally on your device** using IndexedDB. We do not collect, store, or sell your personal fitness history on our own servers.
- **Ephemeral Voice Data**: If you use our optional hands-free Voice Logger, audio is processed **ephemerally in real-time** solely to transcribe set weights, reps, and RPE. Audio is immediately discarded and is **never recorded, stored, or shared**.
- **No Selling of Personal Data**: We do not sell, rent, or monetize your personal information or training logs to advertisers or data brokers.

---

## 2. Information We Process and How It Is Used

### A. Local Device Data (Offline Storage)
The following information is created during your use of the App and stored strictly on your local device:
- **Workout Logs**: Exercise names, weights lifted, repetitions performed, RPE (Rate of Perceived Exertion), rest intervals, and workout timestamps.
- **User Settings & Preferences**: Selected unit system (Metric `kg/cm` or Imperial `lbs/ft`), body weight, target weight, height, and rest timer defaults.
- **Custom Routines**: User-created workout templates and split structures.

*How we use it*: This data is used exclusively to power in-app features such as progressive overload tracking, volume landmark calculations (MEV/MAV/MRV), 1RM estimations, and rest timers.

### B. Microphone & Audio Data (Voice Logger)
Overload AI features an optional hands-free voice logger to enable athletes to speak set entries (e.g., *"100 kg for 8 reps at RPE 8"*).
- **Permission**: The App requests access to the device microphone (`android.permission.RECORD_AUDIO`) only when you explicitly activate the voice logger feature.
- **Ephemeral Processing**: Spoken words are converted to text in real-time using on-device or operating system speech recognition APIs.
- **Zero Audio Storage**: Audio recordings are never saved to disk, never transmitted to developer servers, and never retained once transcription is completed.

### C. Artificial Intelligence & Automated Coaching (Google Gemini)
When you interact with **Coach Overload** (such as asking for workout advice, periodization adjustments, or smart exercise substitutions):
- The App sends your specific text question along with relevant, non-identifying workout context (e.g., target muscle group or current exercise name) through our secure serverless proxy to the Google Gemini API.
- We do not transmit personally identifiable information (such as your full name, email address, or physical address) to the AI engine.
- Google’s processing of API queries is governed by the [Google Privacy Policy](https://policies.google.com/privacy) and Google AI terms of service.

### D. Subscriptions & In-App Purchases (Google Play Billing)
If you purchase an **Overload Pro** subscription:
- Financial transactions and payment processing are handled directly by the **Google Play Store** via Google Play Billing.
- We do not receive, process, or store your credit card numbers or banking information.
- Purchase entitlement status (e.g., whether you have an active monthly, annual, or lifetime license) is validated to unlock Pro features.

---

## 3. Data Retention and Deletion

Because your workout data is stored locally on your device:
- **You Retain Full Control**: You can delete individual workouts, reset routines, or clear your entire training history at any time via **Settings > Factory Reset / Clear Data**.
- **Uninstalling the App**: Deleting or uninstalling the App from your device permanently removes all locally stored workout history, preferences, and database records.

---

## 4. Children’s Privacy

Overload AI is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately so we can take appropriate steps.

---

## 5. Security of Your Information

We implement reasonable administrative and technical security measures to protect your information:
- All external communications with AI and cloud services occur over encrypted **HTTPS / TLS 1.3** protocols.
- Master API secrets are secured behind serverless proxy architectures and are never exposed inside client bundles.

---

## 6. Health & Fitness Advisory Disclaimer

Overload AI is designed for informational, educational, and fitness tracking purposes only. The training guidelines, volume landmark targets, and AI coaching debriefs do not constitute medical advice, diagnosis, or treatment. Always consult a qualified physician or healthcare provider before beginning any strenuous weightlifting or exercise program.

---

## 7. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices, app features, or legal requirements. Any updates will be posted on this page with an updated "Last Updated" date. We encourage you to review this policy periodically.

---

## 8. Contact Us

If you have questions, feedback, or privacy-related concerns regarding Overload AI, please contact us at:

- **Developer**: Praise Ojay
- **Email**: ojerinolapraise@gmail.com
- **Website**: https://github.com/praiseOjay/Gym_app
