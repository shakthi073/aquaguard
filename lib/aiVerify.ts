// AI Verification simulation
// In production: replace this with actual Gemini Vision API call

export interface AIVerificationResult {
  verified: boolean;
  confidence: number;
  reasoning: string;
  detectedFeatures: string[];
  encroachmentType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const WATER_FEATURES = ['lake', 'river', 'pond', 'canal', 'stream', 'wetland', 'reservoir', 'water body'];
const ENCROACHMENT_FEATURES = ['construction', 'waste', 'debris', 'filling', 'sewage', 'pipe', 'garbage', 'building'];

/**
 * Simulates Gemini Vision API call for water body encroachment detection.
 * In production, this would call:
 * fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent', ...)
 */
export async function analyzeEncroachmentImage(
  imageBase64: string,
  description: string,
  _coordinates: { lat: number; lng: number }
): Promise<AIVerificationResult> {
  // Simulate API processing delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // In production, you'd send the image to Gemini Vision API with this prompt:
  // "Analyze this image for water body encroachment. 
  //  Check if there's a visible water body (river, lake, pond, canal, wetland).
  //  Check if there's evidence of encroachment (construction, waste dumping, land filling, sewage discharge).
  //  Return: verified (boolean), confidence (0-100), detectedFeatures (array), severity (low/medium/high/critical)"

  // Simulated analysis based on description keywords
  const descLower = description.toLowerCase();
  const hasWaterKeyword = WATER_FEATURES.some((w) => descLower.includes(w));
  const hasEncroachmentKeyword = ENCROACHMENT_FEATURES.some((e) => descLower.includes(e));

  // Image is provided and not empty = strong signal
  const hasImage = !!(imageBase64 && imageBase64.length > 1000);

  const detectedFeatures: string[] = [];
  let confidence = 60;

  if (hasImage) {
    detectedFeatures.push('image provided');
    confidence += 15;
  }
  if (hasWaterKeyword) {
    detectedFeatures.push('water body reference detected');
    confidence += 12;
  }
  if (hasEncroachmentKeyword) {
    detectedFeatures.push('encroachment indicators found');
    confidence += 10;
  }

  // Simulate GPS proximity to known water bodies (would use real geocoding in prod)
  const nearWaterBody = Math.random() > 0.2;
  if (nearWaterBody) {
    detectedFeatures.push('GPS proximity to water body confirmed');
    confidence += 8;
  }

  confidence = Math.min(confidence, 97);

  // Determine encroachment type from description
  let encroachmentType = 'general encroachment';
  if (descLower.includes('construction') || descLower.includes('building')) encroachmentType = 'illegal construction';
  else if (descLower.includes('waste') || descLower.includes('garbage') || descLower.includes('dump')) encroachmentType = 'waste dumping';
  else if (descLower.includes('fill') || descLower.includes('land')) encroachmentType = 'land filling';
  else if (descLower.includes('sewage') || descLower.includes('drain') || descLower.includes('pipe')) encroachmentType = 'sewage discharge';

  // Verify if evidence is strong enough
  const verified = hasImage && confidence >= 70;

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (confidence >= 90) severity = 'critical';
  else if (confidence >= 80) severity = 'high';
  else if (confidence >= 70) severity = 'medium';
  else severity = 'low';

  // Generate reasoning
  const reasons: string[] = [];
  if (hasImage) reasons.push('photographic evidence submitted');
  if (nearWaterBody) reasons.push('location confirmed near registered water body');
  if (hasEncroachmentKeyword) reasons.push('description matches encroachment patterns');
  if (confidence > 80) reasons.push('high confidence in AI analysis');

  const reasoning = verified
    ? `Encroachment verified with ${confidence}% confidence. Evidence: ${reasons.join(', ')}.`
    : `Insufficient evidence for verification. Please provide a clearer image showing both the water body and the encroachment activity. Confidence: ${confidence}%.`;

  return {
    verified,
    confidence,
    reasoning,
    detectedFeatures,
    encroachmentType,
    severity,
  };
}
