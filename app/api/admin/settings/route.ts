import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminKey } from '@/lib/server-utils';

const OFFICER_EMAIL_KEY = 'officer_email';

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(request: Request) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: OFFICER_EMAIL_KEY } });
    return NextResponse.json({ officerEmail: setting?.value || process.env.AUTHORITY_EMAIL || '' });
  } catch (error) {
    console.error('[admin settings GET]', error);
    return NextResponse.json({ error: 'Failed to load officer email' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body.officerEmail !== 'string') {
      return NextResponse.json({ error: 'Officer email must be text' }, { status: 400 });
    }

    const officerEmail = body.officerEmail.trim().toLowerCase();
    if (officerEmail && !isValidEmail(officerEmail)) {
      return NextResponse.json({ error: 'Enter a valid officer email address' }, { status: 400 });
    }

    await prisma.appSetting.upsert({
      where: { key: OFFICER_EMAIL_KEY },
      update: { value: officerEmail },
      create: { key: OFFICER_EMAIL_KEY, value: officerEmail },
    });

    return NextResponse.json({ officerEmail: officerEmail || process.env.AUTHORITY_EMAIL || '' });
  } catch (error) {
    console.error('[admin settings PUT]', error);
    return NextResponse.json({ error: 'Failed to save officer email' }, { status: 500 });
  }
}