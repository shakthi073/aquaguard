import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

type RouteContext = { params: Promise<{ filename: string }> };

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: RouteContext) {
  try {
    const { filename } = await context.params;

    // Simple path traversal prevention
    const safeFilename = path.basename(filename);
    const candidatePaths = [
      path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads', safeFilename),
      path.join(
        /*turbopackIgnore: true*/ process.platform === 'win32' ? process.env.TEMP || process.cwd() : '/tmp',
        'uploads',
        safeFilename
      ),
    ];

    let buffer: Buffer | null = null;
    for (const p of candidatePaths) {
      try {
        buffer = await readFile(p);
        break;
      } catch {
        // try next candidate path
      }
    }

    if (!buffer) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    let mimeType = 'image/jpeg';
    if (safeFilename.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (safeFilename.endsWith('.svg')) {
      mimeType = 'image/svg+xml';
    } else if (safeFilename.endsWith('.webp')) {
      mimeType = 'image/webp';
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[uploads GET]', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
