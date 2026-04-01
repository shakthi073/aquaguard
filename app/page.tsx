'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import styles from './page.module.css';
import { getAllComplaints, getStatusColor, getStatusLabel } from '@/lib/complaints';

export default function HomePage() {
  const [counts, setCounts] = useState({ total: 0, resolved: 0, pending: 0, areas: 0 });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);

  useEffect(() => {
    const complaints = getAllComplaints();
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const pending = complaints.filter((c) => c.status !== 'resolved').length;
    const uniqueStates = new Set(complaints.map((c) => c.location.state)).size;

    setCounts({ total: complaints.length, resolved, pending, areas: uniqueStates });
    setRecentComplaints(complaints.slice(0, 3));
  }, []);

  return (
    <>
      <div className="bg-animated">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>

      <Navbar />

      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroBadge}>
            <div className="glow-dot"></div>
            <span>AI-Powered Water Body Protection</span>
          </div>

          <h1 className={styles.heroTitle}>
            Protect India's
            <br />
            <span className={styles.heroGradient}>Water Bodies</span>
            <br />
            Together
          </h1>

          <p className={styles.heroDesc}>
            See an encroachment? Report it in 60 seconds. Our AI verifies your complaint,
            maps the location, and notifies authorities—automatically. Every report matters.
          </p>

          <div className={styles.heroCta}>
            <Link href="/report" id="cta-report-now" className="btn btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M20.586 4H16l-2-3H10L8 4H3.414A1.414 1.414 0 002 5.414V19a2 2 0 002 2h16a2 2 0 002-2V5.414A1.414 1.414 0 0020.586 4z"/>
              </svg>
              Report Encroachment
            </Link>
            <Link href="/dashboard" id="cta-view-map" className="btn btn-secondary btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4"/>
              </svg>
              View Live Map
            </Link>
          </div>

          {/* Stats Row */}
          <div className={styles.statsRow}>
            {[
              { num: counts.total || 2847, label: 'Reports Filed', icon: '📋', color: 'var(--primary)' },
              { num: counts.resolved || 1203, label: 'Cases Resolved', icon: '✅', color: 'var(--accent)' },
              { num: counts.pending || 1644, label: 'Under Review', icon: '🔍', color: 'var(--warning)' },
              { num: counts.areas || 18, label: 'States Covered', icon: '📍', color: 'var(--accent-orange)' },
            ].map((stat, i) => (
              <div key={i} className={styles.statCard}>
                <span className={styles.statIcon}>{stat.icon}</span>
                <span className={styles.statNum} style={{ color: stat.color }}>
                  {stat.num.toLocaleString()}
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="badge badge-primary">Process</span>
            <h2 className="section-title">How AquaGuard Works</h2>
            <p className="section-subtitle">
              Four simple steps from observation to official action. We handle the AI verification,
              mapping, and notification — you just need to report.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {[
              {
                step: '01',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M20.586 4H16l-2-3H10L8 4H3.414A1.414 1.414 0 002 5.414V19a2 2 0 002 2h16a2 2 0 002-2V5.414A1.414 1.414 0 0020.586 4z"/>
                  </svg>
                ),
                title: 'Capture & Locate',
                desc: 'Open your phone camera and take a photo of the encroachment. Your GPS coordinates are captured automatically.',
                color: 'var(--primary)',
              },
              {
                step: '02',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                ),
                title: 'AI Verification',
                desc: 'Our AI analyzes the image to confirm water body presence and encroachment activity. Fake reports are automatically rejected.',
                color: 'var(--accent)',
              },
              {
                step: '03',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4"/>
                  </svg>
                ),
                title: 'Geo-Mapped Report',
                desc: 'Verified complaints are plotted on our live map with satellite imagery and sent directly to the concerned authorities.',
                color: 'var(--warning)',
              },
              {
                step: '04',
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                ),
                title: 'SLA Notifications',
                desc: 'Track your complaint\'s SLA timeline. Get notified at each stage: acknowledged → investigating → resolved.',
                color: 'var(--accent-orange)',
              },
            ].map((step, i) => (
              <div key={i} className={`glass-card ${styles.stepCard}`}>
                <div className={styles.stepBadge} style={{ color: step.color, borderColor: step.color + '40' }}>
                  {step.step}
                </div>
                <div className={styles.stepIcon} style={{ color: step.color, background: step.color + '15' }}>
                  {step.icon}
                </div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RECENT COMPLAINTS ===== */}
      <section className={`section ${styles.recentSection}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="badge badge-pending">Live Feed</span>
            <h2 className="section-title">Recent Reports</h2>
            <p className="section-subtitle">
              Real-time encroachment reports from citizens across India.
            </p>
          </div>

          <div className="grid-3">
            {recentComplaints.map((c) => (
              <div key={c.id} className={`glass-card ${styles.complaintCard}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardId}>{c.id}</span>
                  <span
                    className="badge"
                    style={{
                      color: getStatusColor(c.status),
                      background: getStatusColor(c.status) + '18',
                      border: `1px solid ${getStatusColor(c.status)}40`,
                    }}
                  >
                    {getStatusLabel(c.status)}
                  </span>
                </div>
                <div className={styles.cardLocation}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {c.location.city}, {c.location.state}
                </div>
                <p className={styles.cardDesc}>{c.description.slice(0, 100)}...</p>
                <div className={styles.cardFooter}>
                  <div className={styles.aiScore}>
                    <span>AI Confidence</span>
                    <div className={styles.scoreBar}>
                      <div
                        className={styles.scoreBarFill}
                        style={{ width: `${c.aiVerification.confidence}%` }}
                      ></div>
                    </div>
                    <span>{c.aiVerification.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.viewAll}>
            <Link href="/dashboard" className="btn btn-secondary">
              View All on Map
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== AI SECTION ===== */}
      <section className="section">
        <div className="container">
          <div className={styles.aiSection}>
            <div className={styles.aiContent}>
              <span className="badge badge-primary">AI Powered</span>
              <div className="divider"></div>
              <h2 className="section-title">Smart Verification,<br />Zero False Reports</h2>
              <p className="section-subtitle">
                Our AI model, powered by Google Gemini Vision, analyzes every submitted image
                to confirm the presence of a water body and encroachment activity. This ensures
                only genuine complaints reach authorities.
              </p>
              <ul className={styles.aiFeatures}>
                {[
                  'Detects 8+ types of water bodies',
                  'Identifies 6 encroachment categories',
                  'Cross-verifies GPS with satellite imagery',
                  '94% verified report accuracy',
                  'Processes results in under 5 seconds',
                ].map((f, i) => (
                  <li key={i} className={styles.aiFeature}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.aiVisual}>
              <div className={styles.aiCard}>
                <div className={styles.aiCardHeader}>
                  <div className={styles.aiDot} style={{ background: 'var(--danger)' }}></div>
                  <div className={styles.aiDot} style={{ background: 'var(--warning)' }}></div>
                  <div className={styles.aiDot} style={{ background: 'var(--accent)' }}></div>
                  <span>AI Analysis</span>
                </div>
                <div className={styles.aiOutput}>
                  <div className={styles.aiLine}><span className={styles.aiKey}>status:</span> <span style={{ color: 'var(--accent)' }}>✓ VERIFIED</span></div>
                  <div className={styles.aiLine}><span className={styles.aiKey}>confidence:</span> <span style={{ color: 'var(--primary)' }}>94%</span></div>
                  <div className={styles.aiLine}><span className={styles.aiKey}>water_body:</span> <span style={{ color: 'var(--warning)' }}>"river"</span></div>
                  <div className={styles.aiLine}><span className={styles.aiKey}>encroachment:</span> <span style={{ color: 'var(--warning)' }}>"construction"</span></div>
                  <div className={styles.aiLine}><span className={styles.aiKey}>severity:</span> <span style={{ color: 'var(--danger)' }}>"critical"</span></div>
                  <div className={styles.aiLine}><span className={styles.aiKey}>gps_verified:</span> <span style={{ color: 'var(--accent)' }}>true</span></div>
                  <div className={styles.aiLine}><span className={styles.aiKey}>action:</span> <span style={{ color: 'var(--accent)' }}>"notifying_pcb"</span></div>
                  <div className={`${styles.aiLine} ${styles.aiCursor}`}><span className={styles.aiKey}>&gt;</span> <span className={styles.blinking}>_</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className={styles.ctaBanner}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div className={styles.ctaRipple}></div>
            <h2>Every Water Body Deserves Protection</h2>
            <p>Join thousands of citizens safeguarding India's rivers, lakes, and wetlands.</p>
            <div className={styles.ctaBtns}>
              <Link href="/report" className="btn btn-primary btn-lg">
                Report an Encroachment
              </Link>
              <Link href="/status" className="btn btn-secondary">
                Track Existing Complaint
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
