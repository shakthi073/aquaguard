import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

const LOCAL_UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
const TMP_UPLOAD_DIR = path.join(
  /*turbopackIgnore: true*/ process.platform === 'win32' ? process.env.TEMP || process.cwd() : '/tmp',
  'uploads'
);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Allowed image magic bytes (file signatures)
const IMAGE_SIGNATURES: Record<string, string[]> = {
  'image/jpeg': ['FFD8FF'],
  'image/png': ['89504E47'],
  'image/webp': ['52494646'],
};

function detectMimeType(buffer: Buffer): string | null {
  const hex = buffer.slice(0, 4).toString('hex').toUpperCase();
  for (const [mime, sigs] of Object.entries(IMAGE_SIGNATURES)) {
    if (sigs.some((sig) => hex.startsWith(sig))) {
      return mime;
    }
  }
  return null;
}

/**
 * Validates and saves a base64 image to disk.
 * Falls back to /tmp or data URI if the target filesystem is read-only (e.g. Vercel serverless).
 * Throws if the data is not a valid image or exceeds size limits.
 */
export async function savePhotoFromBase64(base64: string): Promise<string> {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!base64Data) throw new Error('Invalid image data');

  const buffer = Buffer.from(base64Data, 'base64');

  // Size guard
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`);
  }

  // File type validation via magic bytes
  const mime = detectMimeType(buffer);
  if (!mime) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are accepted.');
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${randomBytes(16).toString('hex')}.${ext}`;

  // Try writing to public/uploads first; if read-only (like Vercel serverless), write to TMP_UPLOAD_DIR
  try {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
    return `/uploads/${filename}`;
  } catch {
    try {
      await mkdir(TMP_UPLOAD_DIR, { recursive: true });
      await writeFile(path.join(TMP_UPLOAD_DIR, filename), buffer);
      return `/uploads/${filename}`;
    } catch {
      // Fallback: embed as data URL if filesystem is fully inaccessible
      return `data:${mime};base64,${base64Data}`;
    }
  }
}

export function verifyAdminKey(request: Request): boolean {
  const adminKey = process.env.ADMIN_API_KEY?.trim();
  if (!adminKey) return false;
  const headerKey = request.headers.get('x-admin-key')?.trim();
  return Boolean(headerKey) && headerKey === adminKey;
}

/**
 * Generates a cryptographically random complaint ID.
 * Format: WBE-YYYY-XXXXX (5 alphanumeric chars, uppercase)
 */
export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  // 3 random bytes → 6 hex chars → trim to 5 uppercase alphanumeric
  const random = randomBytes(4).toString('base64url').slice(0, 5).toUpperCase();
  return `WBE-${year}-${random}`;
}
