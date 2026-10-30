import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/stats
 * Returns lightweight aggregate counts instead of fetching all complaints.
 * Used by the Footer and Home page to avoid redundant full-data fetches.
 */
export async function GET() {
  try {
    const [total, resolved, pending, statesRaw] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'resolved' } }),
      prisma.complaint.count({ where: { status: { not: 'resolved' } } }),
      prisma.complaint.findMany({ select: { state: true }, distinct: ['state'] }),
    ]);

    return NextResponse.json({
      total,
      resolved,
      pending,
      areas: statesRaw.length,
    });
  } catch (error) {
    console.error('[stats GET]', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
