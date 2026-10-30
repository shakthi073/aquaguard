import { NextResponse } from 'next/server';
import { verifyAdminKey } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!process.env.ADMIN_API_KEY?.trim()) {
    return NextResponse.json(
      { error: 'Admin sign-in is not configured on this deployment. Set ADMIN_API_KEY in the hosting environment and redeploy.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!verifyAdminKey(request)) {
    return NextResponse.json(
      { error: 'The admin key does not match this deployment.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
}