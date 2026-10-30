import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found — AquaGuard',
};

export default function NotFoundPage() {
  return (
    <>
      <div className="bg-animated">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌊</div>
          <h1 style={{ fontSize: '48px', fontFamily: "'Outfit', sans-serif", marginBottom: '8px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            404
          </h1>
          <h2 style={{ fontSize: '22px', fontFamily: "'Outfit', sans-serif", marginBottom: '12px', color: 'var(--text-primary)' }}>
            Page Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-primary">
              Go Home
            </Link>
            <Link href="/report" className="btn btn-secondary">
              File a Report
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
