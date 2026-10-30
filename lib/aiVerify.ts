import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIVerificationResult, Severity } from './types';

const PROMPT = `You are an environmental compliance AI analyzing citizen-submitted photos of potential water body encroachment in India.

Analyze the image and the citizen's description. Determine whether the photo shows:
1. A visible water body (river, lake, pond, canal, wetland, stream, reservoir, etc.)
2. Evidence of encroachment (illegal construction, waste dumping, land filling, sewage discharge, destructive fishing, etc.)

Respond with ONLY valid JSON (no markdown fences) in this exact shape:
{
  "verified": boolean,
  "confidence": number,
  "reasoning": string,
  "detectedFeatures": string[],
  "encroachmentType": string,
  "severity": "low" | "medium" | "high" | "critical"
}

Rules:
- verified is true only if BOTH a water body AND encroachment activity are visible or strongly indicated
- confidence is 0-100
- detectedFeatures lists specific visual evidence (e.g. "construction debris on riverbank")
- severity reflects environmental impact and urgency
- Be conservative: reject unclear, unrelated, or indoor photos`;

function parseSeverity(value: unknown): Severity {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') {
    return value;
  }
  return 'medium';
}

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  // Strip markdown code fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  // Find the outermost JSON object in case there is surrounding text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in AI response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Escapes a string for safe use inside HTML email bodies.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function analyzeEncroachmentImage(
  imageBase64: string,
  description: string,
  coordinates: { lat: number; lng: number }
): Promise<AIVerificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key' || apiKey === '') {
    // IMPORTANT: return unverified when no API key — never auto-verify
    console.warn('[AI] GEMINI_API_KEY not set — returning unverified simulation result.');
    return {
      verified: false,
      confidence: 0,
      reasoning:
        'AI verification is unavailable (GEMINI_API_KEY not configured). ' +
        'This report cannot be automatically verified. An administrator will review it manually.',
      detectedFeatures: [],
      encroachmentType: 'other',
      severity: 'medium',
    };
  }

  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  if (!base64Data || base64Data.length < 100) {
    throw new Error('A valid photo is required for AI verification.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3.8-flash' });

  const context = [
    `Citizen description: ${description}`,
    `GPS coordinates: ${coordinates.lat}, ${coordinates.lng}`,
  ].join('\n');

  const result = await model.generateContent([
    PROMPT,
    context,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data,
      },
    },
  ]);

  const text = result.response.text();
  const parsed = extractJson(text);

  const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0));
  const detectedFeatures = Array.isArray(parsed.detectedFeatures)
    ? parsed.detectedFeatures.map(String)
    : [];

  return {
    verified: Boolean(parsed.verified),
    confidence,
    reasoning: String(parsed.reasoning || 'Analysis complete.'),
    detectedFeatures,
    encroachmentType: String(parsed.encroachmentType || 'general encroachment'),
    severity: parseSeverity(parsed.severity),
  };
}
