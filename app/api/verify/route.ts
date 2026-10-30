import { NextResponse } from 'next/server';
import { analyzeEncroachmentImage } from '@/lib/aiVerify';
import { createVerificationProof } from '@/lib/verification-proof';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { photo, description, lat, lng } = body;

    if (!photo || typeof photo !== 'string') {
      return NextResponse.json({ error: 'Photo is required' }, { status: 400 });
    }
    if (typeof description !== 'string' || description.trim().length < 10 || description.length > 2000) {
      return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'Valid GPS coordinates are required' }, { status: 400 });
    }

    const result = await analyzeEncroachmentImage(photo, description, {
      lat: latitude,
      lng: longitude,
    });

    const verificationProof = createVerificationProof(
      { photo, description, lat: latitude, lng: longitude },
      result
    );
    return NextResponse.json({
      ...result,
      ...(verificationProof
        ? {}
        : {
            verified: false,
            confidence: 0,
            reasoning: 'AI verification could not be securely certified. An administrator will review this report.',
          }),
      verificationProof,
    });
  } catch (error) {
    console.error('[verify]', error);
    const message = error instanceof Error ? error.message : 'AI verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
