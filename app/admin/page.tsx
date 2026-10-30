'use client';
import { useCallback, useEffect, useState } from 'react';
import { Check, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  fetchAllComplaints,
  fetchOfficerEmail,
  saveOfficerEmail,
  validateAdminKey,
  updateComplaintStatus,
  reviewComplaint,
  deleteComplaint,
  getStatusLabel,
  getStatusColor,
  getSeverityColor,
} from '@/lib/complaints';
import type { Complaint, ComplaintStatus } from '@/lib/complaints';
import styles from './page.module.css';

const STATUS_OPTIONS: ComplaintStatus[] = [
  'filed',
  'acknowledged',
  'investigating',
  'action_taken',
  'resolved',
];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('acknowledged');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [officerEmail, setOfficerEmail] = useState('');
  const [savingOfficerEmail, setSavingOfficerEmail] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewFilter, setReviewFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('aquaguard_admin_key');
    if (saved) {
      setAdminKey(saved);
      setAuthenticated(true);
    }
  }, []);

  const loadComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    setError('');
    const [complaintResult, emailResult] = await Promise.allSettled([
      fetchAllComplaints(adminKey),
      fetchOfficerEmail(adminKey),
    ]);

    if (complaintResult.status === 'fulfilled') {
      setComplaints(complaintResult.value);
    } else {
      setError(complaintResult.reason instanceof Error
        ? complaintResult.reason.message
        : 'Could not load complaints. Check the deployment database configuration.');
    }

    if (emailResult.status === 'fulfilled') {
      setOfficerEmail(emailResult.value);
    } else {
      const settingsError = emailResult.reason instanceof Error
        ? emailResult.reason.message
        : 'Could not load officer settings.';
      setError((current) => current ? `${current} Officer settings: ${settingsError}` : `Officer settings: ${settingsError}`);
    }

    if ([complaintResult, emailResult].some((result) =>
      result.status === 'rejected' && result.reason instanceof Error && result.reason.message === 'Invalid admin key'
    )) {
      sessionStorage.removeItem('aquaguard_admin_key');
      setAdminKey('');
      setAuthenticated(false);
      setError('Your saved admin key is no longer valid. Please sign in again.');
    }

    setLoadingComplaints(false);
  }, [adminKey]);

  useEffect(() => {
    if (!authenticated) return;
    loadComplaints();
  }, [authenticated, loadComplaints]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = adminKey.trim();
    if (!candidate) return;
    setLoadingComplaints(true);
    setError('');
    try {
      await validateAdminKey(candidate);
      sessionStorage.setItem('aquaguard_admin_key', candidate);
      setAdminKey(candidate);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin sign-in failed. Check the deployment configuration.');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('aquaguard_admin_key');
    setAuthenticated(false);
    setAdminKey('');
    setSelected(null);
  };

  const handleSaveOfficerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOfficerEmail(true);
    setError('');
    setSuccess('');
    try {
      const savedEmail = await saveOfficerEmail(adminKey, officerEmail);
      setOfficerEmail(savedEmail);
      setSuccess(savedEmail
        ? `New complaints will be emailed to ${savedEmail}.`
        : 'Officer recipient cleared. New complaints will use the AUTHORITY_EMAIL environment setting.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save officer email.');
    } finally {
      setSavingOfficerEmail(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selected || !note.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateComplaintStatus(selected.id, newStatus, note.trim(), adminKey);
      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelected(updated);
      setNote('');
      setSuccess(`Status updated to ${getStatusLabel(newStatus)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed. Check your admin key.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'verified' | 'rejected') => {
    if (!selected || reviewNote.trim().length < 5) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updated = await reviewComplaint(selected.id, status, reviewNote.trim(), adminKey);
      setComplaints((previous) => previous.map((item) => item.id === updated.id ? updated : item));
      setSelected(updated);
      setReviewNote('');
      setSuccess(`Official review recorded: ${status === 'verified' ? 'Verified' : 'Not substantiated'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save official review.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const confirmed = window.confirm(`Permanently delete complaint ${selected.id} and its uploaded evidence? This cannot be undone.`);
    if (!confirmed) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteComplaint(selected.id, adminKey);
      setComplaints((previous) => previous.filter((item) => item.id !== selected.id));
      setSelected(null);
      setSuccess(`Complaint ${selected.id} deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete complaint.');
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((item) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [item.id, item.location.city, item.location.state, item.description]
      .some((value) => value.toLowerCase().includes(term));
    const matchesReview = reviewFilter === 'all' || item.review.status === reviewFilter;
    return matchesSearch && matchesReview;
  });

  if (!authenticated) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className="container">
            <div className={`glass-card ${styles.loginCard}`}>
              <h1>Authority Admin</h1>
              <p>Enter your admin API key to manage complaint statuses and notify reporters.</p>
              {error && <div className={styles.error} role="alert">{error}</div>}
              <form onSubmit={handleLogin}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Admin API key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={loadingComplaints || !adminKey.trim()} style={{ marginTop: '16px', width: '100%' }}>
                  {loadingComplaints ? 'Checking key...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <span className="badge badge-primary">Authority Portal</span>
              <h1>Complaint Management</h1>
              <p>Review reports, update status, and trigger email notifications to citizens.</p>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>Sign Out</button>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <section className={`glass-card ${styles.settings}`}>
            <div>
              <h2>Officer notifications</h2>
              <p>New complaints are saved to the dashboard and emailed to this officer.</p>
            </div>
            <form className={styles.settingsForm} onSubmit={handleSaveOfficerEmail}>
              <label className="form-label" htmlFor="officer-email">Officer email</label>
              <div className={styles.settingsRow}>
                <input
                  id="officer-email"
                  type="email"
                  className="form-input"
                  value={officerEmail}
                  onChange={(e) => setOfficerEmail(e.target.value)}
                  placeholder="officer@department.gov.in"
                  maxLength={254}
                />
                <button className="btn btn-primary" type="submit" disabled={savingOfficerEmail}>
                  {savingOfficerEmail ? 'Saving...' : 'Save recipient'}
                </button>
              </div>
              <span className={styles.settingsHint}>Leave blank to use the server&apos;s AUTHORITY_EMAIL setting.</span>
            </form>
          </section>

          <div className={styles.layout}>
            <div className={styles.list}>
              <div className={styles.queueControls}>
                <label className={styles.searchBox}>
                  <Search size={16} aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, city, or report" aria-label="Search complaints" />
                </label>
                <select className="form-select" aria-label="Filter by official review" value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}>
                  <option value="all">All reviews</option>
                  <option value="pending">Needs review</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Not substantiated</option>
                </select>
              </div>
              {loadingComplaints ? (
                <div className={styles.loadingList}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`${styles.skeleton} ${styles.skeletonItem}`} />
                  ))}
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className={`glass-card ${styles.empty}`}>
                  {complaints.length === 0 ? 'No complaints filed yet.' : 'No complaints match this search or review filter.'}
                </div>
              ) : (
                filteredComplaints.map((c) => (
                  <button
                    key={c.id}
                    className={`glass-card ${styles.item} ${selected?.id === c.id ? styles.itemActive : ''}`}
                    onClick={() => {
                      setSelected(c);
                      setNewStatus(c.status);
                      setSuccess('');
                      setError('');
                    }}
                  >
                    <div className={styles.itemTop}>
                      <strong>{c.id}</strong>
                      <span
                        className="badge"
                        style={{
                          color: getStatusColor(c.status),
                          background: getStatusColor(c.status) + '18',
                        }}
                      >
                        {getStatusLabel(c.status)}
                      </span>
                    </div>
                    <div className={styles.itemMeta}>
                      {c.location.city}, {c.location.state} · {c.severity.toUpperCase()}
                    </div>
                    <div className={`${styles.reviewBadge} ${styles[`review_${c.review.status}`]}`}>
                      {c.review.status === 'pending' ? 'Needs official review' : c.review.status === 'verified' ? 'Officially verified' : 'Not substantiated'}
                    </div>
                  </button>
                ))
              )}
            </div>

            {selected && (
              <div className={`glass-card ${styles.detail}`}>
                <h2>{selected.id}</h2>
                <p className={styles.address}>{selected.location.address}</p>
                {selected.photo && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selected.photo}
                    alt="Evidence"
                    className={styles.photo}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <p>{selected.description}</p>
                <div className={styles.meta}>
                  <span>Reporter: {selected.reporter.name} ({selected.reporter.email})</span>
                  <span style={{ color: getSeverityColor(selected.severity) }}>
                    Severity: {selected.severity.toUpperCase()}
                  </span>
                  <span>AI: {selected.aiVerification.confidence}% ({selected.aiVerification.verified ? 'verified' : 'unverified'})</span>
                  <span>Official review: {selected.review.status === 'pending' ? 'Pending' : selected.review.status === 'verified' ? 'Verified' : 'Not substantiated'}</span>
                  {selected.review.reviewedAt && <span>Reviewed: {new Date(selected.review.reviewedAt).toLocaleString()}</span>}
                  {selected.review.note && <span>Review note: {selected.review.note}</span>}
                </div>

                <section className={styles.reviewPanel}>
                  <h3><ShieldCheck size={18} aria-hidden="true" /> Official authenticity review</h3>
                  <p>This records an officer decision separately from the AI result.</p>
                  <label className="form-label" htmlFor="review-note">Review note</label>
                  <textarea id="review-note" className="form-textarea" rows={3} minLength={5} maxLength={1000} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Explain the evidence supporting your decision (at least 5 characters)" />
                  <div className={styles.reviewActions}>
                    <button className="btn btn-accent" onClick={() => void handleReview('verified')} disabled={loading || reviewNote.trim().length < 5}>
                      <Check size={17} aria-hidden="true" /> Mark verified
                    </button>
                    <button className="btn btn-secondary" onClick={() => void handleReview('rejected')} disabled={loading || reviewNote.trim().length < 5}>
                      <X size={17} aria-hidden="true" /> Not substantiated
                    </button>
                    <button className="btn btn-danger" onClick={() => void handleDelete()} disabled={loading}>
                      <Trash2 size={17} aria-hidden="true" /> Delete complaint
                    </button>
                  </div>
                </section>

                <div className={styles.form}>
                  <label className="form-label">New Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>

                  <label className="form-label">Status Note (sent to reporter)</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="e.g. Field team dispatched to location..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />

                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateStatus}
                    disabled={loading || !note.trim() || newStatus === selected.status}
                  >
                    {loading ? 'Updating...' : 'Update Status & Notify Reporter'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
