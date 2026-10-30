import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { serializeComplaint } from '@/lib/complaint-utils';
import { verifyAdminKey } from '@/lib/server-utils';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!verifyAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const status = body.status;
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (status !== 'verified' && status !== 'rejected') {
      return NextResponse.json({ error: 'Choose verified or rejected' }, { status: 400 });
    }
    if (note.length < 5 || note.length > 1000) {
      return NextResponse.json({ error: 'Review note must be 5 to 1000 characters' }, { status: 400 });
    }

    const complaintId = id.toUpperCase();
    const existing = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const record = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        reviewStatus: status,
        reviewNote: note,
        reviewedAt: new Date(),
        statusHistory: {
          create: {
            status: existing.status,
            note: `Official review recorded as ${status}: ${note}`,
          },
        },
      },
      include: { statusHistory: { orderBy: { timestamp: 'asc' } } },
    });

    return NextResponse.json(serializeComplaint(record, true));
  } catch (error) {
    console.error('[complaint review PATCH]', error);
    return NextResponse.json({ error: 'Failed to save official review' }, { status: 500 });
  }
}