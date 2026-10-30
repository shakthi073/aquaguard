import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { serializeComplaint, parseLocationFromAddress } from '@/lib/complaint-utils';
import { savePhotoFromBase64, generateComplaintId } from '@/lib/server-utils';
import { sendComplaintFiledEmail, sendAuthorityNotification } from '@/lib/email';
import { verifyVerificationProof } from '@/lib/verification-proof';
import { verifyAdminKey } from '@/lib/server-utils';
import type { EncroachmentType, Severity } from '@/lib/types';


export async function GET(request: Request) {
  try {
    const suppliedAdminKey = request.headers.get('x-admin-key');
    if (suppliedAdminKey && !verifyAdminKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const includeReporter = Boolean(suppliedAdminKey);
    const records = await prisma.complaint.findMany({
      include: { statusHistory: { orderBy: { timestamp: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(records.map((record) => serializeComplaint(record, includeReporter)));
  } catch (error) {
    console.error('[complaints GET]', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      photo,
      lat,
      lng,
      address,
      city,
      state,
      description,
      encroachmentType,
      reporterName,
      reporterEmail,
      reporterPhone,
      verificationProof,
    } = body;

    if (typeof photo !== 'string' || photo.length > 7_000_000) {
      return NextResponse.json({ error: 'A valid photo under 5MB is required' }, { status: 400 });
    }
    if (
      typeof description !== 'string' ||
      description.trim().length < 20 ||
      description.length > 2000 ||
      typeof reporterName !== 'string' ||
      reporterName.trim().length < 2 ||
      reporterName.length > 120 ||
      typeof reporterEmail !== 'string' ||
      reporterEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    ) {
      return NextResponse.json({ error: 'Valid GPS coordinates are required' }, { status: 400 });
    }

    const validTypes: EncroachmentType[] = [
      'construction', 'waste_dumping', 'land_filling', 'sewage_discharge', 'illegal_fishing', 'other',
    ];
    const reportType = validTypes.includes(encroachmentType) ? encroachmentType : 'other';
    const verifiedResult = typeof verificationProof === 'string'
      ? verifyVerificationProof(
          verificationProof,
          {
            photo,
            description: `${reportType.replace(/_/g, ' ')} — ${description}`,
            lat: latitude,
            lng: longitude,
          }
        )
      : null;

    // Duplicate check: same reporter, description, and close coordinates in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingDuplicate = await prisma.complaint.findFirst({
      where: {
        reporterEmail,
        description,
        lat: {
          gte: latitude - 0.0001,
          lte: latitude + 0.0001,
        },
        lng: {
          gte: longitude - 0.0001,
          lte: longitude + 0.0001,
        },
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      include: { statusHistory: { orderBy: { timestamp: 'asc' } } },
    });

    if (existingDuplicate) {
      console.log(`[complaints POST] Duplicate found: ${existingDuplicate.id}, returning existing.`);
      return NextResponse.json(serializeComplaint(existingDuplicate), { status: 200 });
    }

    const photoPath = await savePhotoFromBase64(photo);
    const resolvedAddress = typeof address === 'string' && address.length <= 500
      ? address
      : `${latitude}, ${longitude}`;
    const locationParts =
      city && state && city !== 'Unknown'
        ? { city, state }
        : parseLocationFromAddress(resolvedAddress, latitude, longitude);

    const id = generateComplaintId();
    const now = new Date();

    const record = await prisma.complaint.create({
      data: {
        id,
        status: 'filed',
        photoPath,
        lat: latitude,
        lng: longitude,
        address: resolvedAddress,
        city: locationParts.city,
        state: locationParts.state,
        description: description.trim(),
        encroachmentType: reportType,
        severity: (verifiedResult?.severity as Severity) || 'medium',
        aiVerified: verifiedResult?.verified ?? false,
        aiConfidence: verifiedResult?.confidence ?? 0,
        aiReasoning: verifiedResult?.reasoning || 'AI verification was not confirmed. An administrator will review this report.',
        aiDetectedFeatures: JSON.stringify(verifiedResult?.detectedFeatures || []),
        reporterName: reporterName.trim(),
        reporterEmail: reporterEmail.trim().toLowerCase(),
        reporterPhone: typeof reporterPhone === 'string' ? reporterPhone.slice(0, 40) : '',
        statusHistory: {
          create: {
            status: 'filed',
            timestamp: now,
            note: `Complaint filed by ${reporterName.trim()}. AI verification: ${verifiedResult?.confidence ?? 0}% confidence.`,
          },
        },
      },
      include: { statusHistory: { orderBy: { timestamp: 'asc' } } },
    });

    const complaint = serializeComplaint(record, true);
    let officerEmail = process.env.AUTHORITY_EMAIL;
    try {
      const officerSetting = await prisma.appSetting.findUnique({ where: { key: 'officer_email' } });
      officerEmail = officerSetting?.value || officerEmail;
    } catch (error) {
      console.error('[complaints POST] Could not load officer recipient setting', error);
    }

    await Promise.allSettled([
      sendComplaintFiledEmail(complaint),
      sendAuthorityNotification(complaint, officerEmail),
    ]);

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error('[complaints POST]', error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}
