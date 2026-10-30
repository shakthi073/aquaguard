'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AquaGuard Error]', error);
  }, [error]);

  return (
    <>
      <div className="bg-animated">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
      </div>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '28px', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', color: 'var(--text-primary)' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            An unexpected error occurred. Our team has been notified.
            {error.message && (
              <span style={{ display: 'block', marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {error.message}
              </span>
            )}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={reset}>
              Try Again
            </button>
            <Link href="/" className="btn btn-secondary">
              Go Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
