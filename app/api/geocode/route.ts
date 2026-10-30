import { NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geocode';

export async function GET() {
  return NextResponse.json({ error: 'Use POST with lat and lng' }, { status: 405 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 });
    }

    const location = await reverseGeocode(lat, lng);
    return NextResponse.json(location);
  } catch (error) {
    console.error('[geocode]', error);
    return NextResponse.json({ error: 'Failed to resolve location' }, { status: 500 });
  }
}
