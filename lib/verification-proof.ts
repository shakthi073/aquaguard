import { createHash, createHmac, timingSafeEqual } from 'crypto';
import type { AIVerificationResult } from './types';

type VerificationInput = {
  photo: string;
  description: string;
  lat: number;
  lng: number;
};

type ProofPayload = VerificationInput & {
  photoHash: string;
  result: AIVerificationResult;
  issuedAt: number;
};

function getSecret(): string | null {
  return process.env.AI_VERIFICATION_SECRET || process.env.ADMIN_API_KEY || null;
}

function hashPhoto(photo: string): string {
  return createHash('sha256').update(photo).digest('hex');
}

export function createVerificationProof(input: VerificationInput, result: AIVerificationResult): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const payload: ProofPayload = {
    ...input,
    photoHash: hashPhoto(input.photo),
    result,
    issuedAt: Date.now(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyVerificationProof(
  proof: string,
  input: VerificationInput
): AIVerificationResult | null {
  const secret = getSecret();
  if (!secret) return null;

  const [encodedPayload, signature, extra] = proof.split('.');
  if (!encodedPayload || !signature || extra) return null;

  const expectedSignature = createHmac('sha256', secret).update(encodedPayload).digest();
  let receivedSignature: Buffer;
  try {
    receivedSignature = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as ProofPayload;
    const proofAge = Date.now() - payload.issuedAt;
    if (
      proofAge < 0 ||
      proofAge > 30 * 60 * 1000 ||
      payload.photoHash !== hashPhoto(input.photo) ||
      payload.description !== input.description ||
      payload.lat !== input.lat ||
      payload.lng !== input.lng
    ) {
      return null;
    }
    return payload.result;
  } catch {
    return null;
  }
}