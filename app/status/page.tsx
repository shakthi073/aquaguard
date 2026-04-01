'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  getComplaintById,
  getStatusLabel,
  getStatusColor,
  getSeverityColor,
} from '@/lib/complaints';
import type { Complaint, ComplaintStatus } from '@/lib/complaints';
import styles from './page.module.css';

const STATUS_ORDER: ComplaintStatus[] = [
  'filed',
  'acknowledged',
  'investigating',
  'action_taken',
  'resolved',
];

const SLA_DAYS: Record<ComplaintStatus, number> = {
  filed: 0,
  acknowledged: 3,
  investigating: 7,
  action_taken: 21,
  resolved: 30,
};

function StatusContent() {
  const params = useSearchParams();
  const [inputId, setInputId] = useState(params.get('id') || '');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params.get('id');
    if (id) {
      handleSearch(id);
    }
  }, []);

  const handleSearch = (id?: string) => {
    const searchId = id || inputId;
    setNotFound(false);
    setComplaint(null);
    const found = getComplaintById(searchId.trim().toUpperCase());
    if (found) {
      setComplaint(found);
    } else {
      setNotFound(true);
    }
  };

  const currentStatusIdx = complaint ? STATUS_ORDER.indexOf(complaint.status) : -1;

  const getExpectedDate = (status: ComplaintStatus, filedDate: string) => {
    const filed = new Date(filedDate);
    const days = SLA_DAYS[status];
    const expected = new Date(filed);
    expected.setDate(expected.getDate() + days);
    return expected;
  };

  const getSLAStatus = (status: ComplaintStatus, complaint: Complaint) => {
    const idx = STATUS_ORDER.indexOf(status);
    const currentIdx = STATUS_ORDER.indexOf(complaint.status);
    const expected = getExpectedDate(status, complaint.createdAt);
    const now = new Date();

    if (idx < currentIdx) return 'done'; // completed
    if (idx === currentIdx) return 'current'; // in progress
    if (now > expected) return 'overdue';
    return 'pending';
  };

  const daysElapsed = complaint
    ? Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const progressPercent = complaint
    ? ((STATUS_ORDER.indexOf(complaint.status) + 1) / STATUS_ORDER.length) * 100
    : 0;

  return (
    <>
      {/* Search */}
      <div className={`glass-card ${styles.searchCard}`}>
        <h2 className={styles.searchTitle}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          Track Your Complaint
        </h2>
        <p className={styles.searchDesc}>
          Enter your complaint ID (e.g., WBE-2024-AB123) to view the current status and SLA timeline.
        </p>
        <div className={styles.searchRow}>
          <input
            id="input-complaint-id"
            type="text"
            className="form-input"
            placeholder="WBE-2024-XXXXX"
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            id="btn-track-complaint"
            className="btn btn-primary"
            onClick={() => handleSearch()}
          >
            Track
          </button>
        </div>

        {/* Quick examples */}
        <div className={styles.examples}>
          <span>Try: </span>
          {['WBE-2024-AB123', 'WBE-2024-CD456', 'WBE-2024-EF789'].map((id) => (
            <button
              key={id}
              className={styles.exampleBtn}
              onClick={() => {
                setInputId(id);
                handleSearch(id);
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Not Found */}
      {notFound && (
        <div className={`glass-card ${styles.notFound}`}>
          <span>🔍</span>
          <h3>Complaint Not Found</h3>
          <p>No complaint found with ID <strong>{inputId}</strong>. Please check the ID and try again.</p>
          <a href="/report" className="btn btn-primary">File a New Complaint</a>
        </div>
      )}

      {/* Complaint Details */}
      {complaint && (
        <div className={styles.complaintDetails}>
          {/* Header */}
          <div className={`glass-card ${styles.complaintHeader}`}>
            <div className={styles.headerLeft}>
              <div className={styles.complaintId}>{complaint.id}</div>
              <div className={styles.complaintMeta}>
                📍 {complaint.location.city}, {complaint.location.state}
                &nbsp; • &nbsp;
                Filed on {new Date(complaint.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                &nbsp; • &nbsp;
                {daysElapsed} day{daysElapsed !== 1 ? 's' : ''} ago
              </div>
            </div>
            <div className={styles.headerRight}>
              <span
                className="badge"
                style={{
                  color: getStatusColor(complaint.status),
                  background: getStatusColor(complaint.status) + '18',
                  border: `1px solid ${getStatusColor(complaint.status)}30`,
                  fontSize: '14px',
                  padding: '8px 16px',
                }}
              >
                {getStatusLabel(complaint.status)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`glass-card ${styles.progressCard}`}>
            <div className={styles.progressHeader}>
              <span>Overall Progress</span>
              <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className={styles.progressBarWrap}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* SLA Timeline */}
            <div className={styles.slaTimeline}>
              {STATUS_ORDER.map((status, i) => {
                const slaStatus = getSLAStatus(status, complaint);
                const expected = getExpectedDate(status, complaint.createdAt);
                const historyEntry = complaint.statusHistory.find((h) => h.status === status);

                return (
                  <div key={status} className={styles.slaStep}>
                    {/* Connector line */}
                    {i > 0 && (
                      <div
                        className={`${styles.slaLine} ${
                          STATUS_ORDER.indexOf(complaint.status) >= i ? styles.slaLineDone : ''
                        }`}
                      ></div>
                    )}
                    <div
                      className={`${styles.slaDot} ${
                        slaStatus === 'done'
                          ? styles.slaDotDone
                          : slaStatus === 'current'
                          ? styles.slaDotCurrent
                          : slaStatus === 'overdue'
                          ? styles.slaDotOverdue
                          : ''
                      }`}
                    >
                      {slaStatus === 'done' ? '✓' : i + 1}
                    </div>
                    <div className={styles.slaInfo}>
                      <div
                        className={styles.slaLabel}
                        style={{
                          color:
                            slaStatus === 'done'
                              ? 'var(--accent)'
                              : slaStatus === 'current'
                              ? 'var(--primary)'
                              : slaStatus === 'overdue'
                              ? 'var(--danger)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {getStatusLabel(status)}
                        {slaStatus === 'current' && (
                          <span className={styles.currentBadge}>In Progress</span>
                        )}
                        {slaStatus === 'overdue' && (
                          <span className={styles.overdueBadge}>Overdue</span>
                        )}
                      </div>
                      <div className={styles.slaDate}>
                        {slaStatus === 'done' && historyEntry
                          ? `Completed: ${new Date(historyEntry.timestamp).toLocaleDateString('en-IN')}`
                          : `Expected: ${expected.toLocaleDateString('en-IN')} (Day ${SLA_DAYS[status]})`}
                      </div>
                      {historyEntry && (
                        <div className={styles.slaNote}>{historyEntry.note}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complaint Info Grid */}
          <div className={styles.infoGrid}>
            {/* Description */}
            <div className={`glass-card ${styles.infoCard}`}>
              <h3>Complaint Details</h3>
              <p className={styles.infoDesc}>{complaint.description}</p>
              <div className={styles.infoMeta}>
                <div className={styles.infoMetaItem}>
                  <span>Type</span>
                  <strong>{complaint.encroachmentType.replace(/_/g, ' ')}</strong>
                </div>
                <div className={styles.infoMetaItem}>
                  <span>Severity</span>
                  <strong style={{ color: getSeverityColor(complaint.severity) }}>
                    {complaint.severity.toUpperCase()}
                  </strong>
                </div>
              </div>
            </div>

            {/* AI Verification */}
            <div className={`glass-card ${styles.infoCard}`}>
              <h3>AI Verification</h3>
              <div className={styles.aiVerify}>
                <div className={styles.aiVerifyScore}>
                  <div className={styles.scoreRing}>
                    <svg viewBox="0 0 100 100" width="80" height="80">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,180,216,0.1)" strokeWidth="8"/>
                      <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="url(#scoreGrad)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40 * complaint.aiVerification.confidence / 100} ${2 * Math.PI * 40}`}
                        strokeDashoffset={2 * Math.PI * 40 * 0.25}
                        transform="rotate(-90 50 50)"
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%">
                          <stop offset="0%" stopColor="#00b4d8"/>
                          <stop offset="100%" stopColor="#06d6a0"/>
                        </linearGradient>
                      </defs>
                      <text x="50" y="56" textAnchor="middle" fill="#e8f4fd" fontSize="18" fontWeight="700">
                        {complaint.aiVerification.confidence}%
                      </text>
                    </svg>
                  </div>
                  <div className={styles.aiVerifyDetails}>
                    <div className={styles.aiVerifyStatus}>
                      {complaint.aiVerification.verified ? (
                        <span style={{ color: 'var(--accent)' }}>✅ Verified</span>
                      ) : (
                        <span style={{ color: 'var(--warning)' }}>⚠ Unverified</span>
                      )}
                    </div>
                    <div className={styles.aiVerifyReasoning}>{complaint.aiVerification.reasoning}</div>
                    <div className={styles.aiFeaturesList}>
                      {complaint.aiVerification.detectedFeatures.map((f, i) => (
                        <span key={i} className="badge badge-primary" style={{ fontSize: '11px' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className={`glass-card ${styles.infoCard}`}>
              <h3>Location</h3>
              <p className={styles.locationText}>{complaint.location.address}</p>
              <div className={styles.coords}>
                <span>Lat: {complaint.location.lat.toFixed(6)}</span>
                <span>Lng: {complaint.location.lng.toFixed(6)}</span>
              </div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${complaint.location.lat}&mlon=${complaint.location.lng}#map=15/${complaint.location.lat}/${complaint.location.lng}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px' }}
              >
                View on Map →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function StatusPage() {
  return (
    <>
      <div className="bg-animated">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <span className="badge badge-primary">SLA Tracker</span>
            <h1 className={styles.title}>Complaint Status</h1>
            <p className={styles.subtitle}>
              Track the real-time status of your filed complaint with our SLA timeline.
            </p>
          </div>
          <Suspense fallback={<div className={styles.loading}><div className="spinner"></div></div>}>
            <StatusContent />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
