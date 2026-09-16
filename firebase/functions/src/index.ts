// Firebase Cloud Function v2: Gemini AI Security Proxy for Overload AI
// Deploy with: firebase deploy --only functions:geminiProxy
// Set secret: firebase functions:secrets:set GEMINI_API_KEY

import { onRequest } from "firebase-functions/v2/https";
import cors from "cors";

const corsHandler = cors({ origin: true });

export const geminiProxy = onRequest(
  {
    secrets: ["GEMINI_API_KEY"],
    cors: true,
    maxInstances: 10
  },
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: "GEMINI_API_KEY secret is not configured in Firebase secrets."
        });
        return;
      }

      const { prompt, systemInstruction, generationConfig } = req.body || {};
      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Missing or invalid prompt." });
        return;
      }

      const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
      let lastError = "Unknown error";

      for (const model of models) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const requestBody: Record<string, any> = {
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: generationConfig || {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2500
          }
        };

        if (systemInstruction) {
          requestBody.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData?.error?.message || `HTTP ${response.status} from ${model}`;
            continue;
          }

          const data: any = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (text) {
            res.status(200).json({ text });
            return;
          }
        } catch (err: any) {
          lastError = err.message;
        }
      }

      res.status(502).json({ error: `All Gemini models failed: ${lastError}` });
    });
  }
);
