import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { serializeComplaint } from '@/lib/complaint-utils';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const record = await prisma.complaint.findUnique({
      where: { id: id.toUpperCase() },
      include: { statusHistory: { orderBy: { timestamp: 'asc' } } },
    });

    if (!record) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json(serializeComplaint(record));
  } catch (error) {
    console.error('[complaint GET]', error);
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { verifyAdminKey } = await import('@/lib/server-utils');
    if (!verifyAdminKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, note } = body;

    const validStatuses = ['filed', 'acknowledged', 'investigating', 'action_taken', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (!note || typeof note !== 'string') {
      return NextResponse.json({ error: 'A status note is required' }, { status: 400 });
    }

    const existing = await prisma.complaint.findUnique({
      where: { id: id.toUpperCase() },
      include: { statusHistory: { orderBy: { timestamp: 'asc' } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    if (existing.status === status) {
      return NextResponse.json({ error: 'Complaint already has this status' }, { status: 409 });
    }

    const record = await prisma.complaint.update({
      where: { id: id.toUpperCase() },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            note,
          },
        },
      },
      include: { statusHistory: { orderBy: { timestamp: 'asc' } } },
    });

    const complaint = serializeComplaint(record, true);
    const { sendStatusUpdateEmail } = await import('@/lib/email');
    await sendStatusUpdateEmail(complaint, status, note);

    return NextResponse.json(complaint);
  } catch (error) {
    console.error('[complaint PATCH]', error);
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { verifyAdminKey } = await import('@/lib/server-utils');
    if (!verifyAdminKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const complaintId = id.toUpperCase();
    const existing = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!existing) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    await prisma.complaint.delete({ where: { id: complaintId } });

    if (existing.photoPath.startsWith('/uploads/')) {
      const filename = path.basename(existing.photoPath.slice('/uploads/'.length));
      const uploadPaths = [
        path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', filename),
        path.join(
          /*turbopackIgnore: true*/ process.platform === 'win32' ? process.env.TEMP || process.cwd() : '/tmp',
          'uploads',
          filename
        ),
      ];
      await Promise.all(uploadPaths.map(async (filePath) => {
        try {
          await unlink(filePath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('[complaint DELETE] Could not remove evidence file', error);
          }
        }
      }));
    }

    return NextResponse.json({ deleted: true, id: complaintId });
  } catch (error) {
    console.error('[complaint DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 });
  }
}
