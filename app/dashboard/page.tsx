'use client';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { fetchAllComplaints, getStatusColor, getStatusLabel, getSeverityColor } from '@/lib/complaints';
import type { Complaint, ComplaintStatus } from '@/lib/complaints';
import styles from './page.module.css';

interface MapViewProps {
  complaints: Complaint[];
  selected: Complaint | null;
  onSelect: (c: Complaint) => void;
}

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic<MapViewProps>(() => import('./MapView'), { ssr: false });

export default function DashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const refreshComplaints = useCallback(async () => {
    setRefreshing(true);
    setLoadError('');
    try {
      const data = await fetchAllComplaints();
      setComplaints(data);
      setSelected((current) => current ? data.find((item) => item.id === current.id) ?? null : null);
    } catch {
      setLoadError('Could not refresh reports. Showing the last loaded data.');
    } finally {
      setLoadingComplaints(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshComplaints();
    const intervalId = window.setInterval(() => void refreshComplaints(), 30_000);
    return () => window.clearInterval(intervalId);
  }, [refreshComplaints]);

  const filteredComplaints = complaints.filter((c) => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch =
      !search ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.location.city.toLowerCase().includes(search.toLowerCase()) ||
      c.location.state.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: complaints.length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    investigating: complaints.filter((c) => c.status === 'investigating').length,
    critical: complaints.filter((c) => c.severity === 'critical').length,
  };

  return (
    <>
      <div className="bg-animated">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
      </div>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <span className="badge badge-primary">Live Map</span>
              <h1 className={styles.title}>Encroachment Dashboard</h1>
              <p className={styles.subtitle}>
                Real-time map of all reported water body encroachments across India.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={() => void refreshComplaints()} disabled={refreshing} aria-label="Refresh reports" title="Refresh reports">
                <RefreshCw size={17} aria-hidden="true" />
              </button>
              <a href="/report" className="btn btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Report
              </a>
            </div>
          </div>

          {loadError && <p role="alert" style={{ color: 'var(--danger)', marginBottom: '16px' }}>{loadError}</p>}

          {/* Stats Bar */}
          <div className={styles.statsBar}>
            {[
              { label: 'Total Reports', value: stats.total, color: 'var(--primary)' },
              { label: 'Resolved', value: stats.resolved, color: 'var(--accent)' },
              { label: 'Investigating', value: stats.investigating, color: 'var(--warning)' },
              { label: 'Critical Priority', value: stats.critical, color: 'var(--danger)' },
            ].map((s, i) => (
              <div key={i} className={styles.statItem}>
                <span className={styles.statVal} style={{ color: s.color }}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Main Layout */}
          <div className={styles.layout}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
              {/* Filters */}
              <div className={styles.filters}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by ID, city, state..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="input-search-complaints"
                />
                <div className={styles.filterBtns}>
                  {['all', 'filed', 'acknowledged', 'investigating', 'action_taken', 'resolved'].map((f) => (
                    <button
                      key={f}
                      className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === 'all' ? 'All' : getStatusLabel(f as ComplaintStatus)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complaint List */}
              <div className={styles.complaintList}>
                {loadingComplaints ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{
                        height: '100px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(90deg, rgba(0,180,216,0.05) 25%, rgba(0,180,216,0.12) 50%, rgba(0,180,216,0.05) 75%)',
                        backgroundSize: '800px 100%',
                        animation: 'shimmer 1.4s infinite',
                      }} />
                    ))}
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className={styles.empty}>
                    <span>🔍</span>
                    <p>No complaints found</p>
                  </div>
                ) : (
                  filteredComplaints.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.complaintItem} ${selected?.id === c.id ? styles.complaintItemActive : ''}`}
                      onClick={() => setSelected(c)}
                    >
                      <div className={styles.itemHeader}>
                        <span className={styles.itemId}>{c.id}</span>
                        <span
                          className="badge"
                          style={{
                            fontSize: '10px',
                            color: getStatusColor(c.status),
                            background: getStatusColor(c.status) + '18',
                            border: `1px solid ${getStatusColor(c.status)}30`,
                          }}
                        >
                          {getStatusLabel(c.status)}
                        </span>
                      </div>
                      <div className={styles.itemLocation}>
                        📍 {c.location.city}, {c.location.state}
                      </div>
                      <div className={styles.itemDesc}>
                        {c.description.length > 80 ? `${c.description.slice(0, 80)}...` : c.description}
                      </div>
                      <div className={styles.itemMeta}>
                        <span style={{ color: getSeverityColor(c.severity), fontSize: '11px', fontWeight: '600' }}>
                          {c.severity.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(c.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Map */}
            <div className={styles.mapContainer}>
              <MapView
                complaints={filteredComplaints}
                selected={selected}
                onSelect={setSelected}
              />

              {/* Legend */}
              <div className={styles.legend}>
                <div className={styles.legendTitle}>Status Legend</div>
                {[
                  { color: '#8ba8c4', label: 'Filed' },
                  { color: '#00b4d8', label: 'Acknowledged' },
                  { color: '#ffd166', label: 'Investigating' },
                  { color: '#f4845f', label: 'Action Taken' },
                  { color: '#06d6a0', label: 'Resolved' },
                ].map((l) => (
                  <div key={l.label} className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: l.color }}></div>
                    <span>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Complaint Detail */}
          {selected && (
            <div className={`glass-card ${styles.detailPanel}`}>
              <div className={styles.detailHeader}>
                <div>
                  <div className={styles.detailId}>{selected.id}</div>
                  <div className={styles.detailLocation}>
                    📍 {selected.location.address}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span
                    className="badge"
                    style={{
                      color: getStatusColor(selected.status),
                      background: getStatusColor(selected.status) + '18',
                      border: `1px solid ${getStatusColor(selected.status)}30`,
                    }}
                  >
                    {getStatusLabel(selected.status)}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelected(null)}
                  >✕</button>
                </div>
              </div>

              <div className={styles.detailBody}>
                {selected.photo && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selected.photo}
                    alt="Evidence"
                    className={styles.detailPhoto}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className={styles.detailDesc}>{selected.description}</div>
                <div className={styles.detailMeta}>
                  <div className={styles.detailMetaItem}>
                    <span>Type</span>
                    <strong>{selected.encroachmentType.replace('_', ' ')}</strong>
                  </div>
                  <div className={styles.detailMetaItem}>
                    <span>Severity</span>
                    <strong style={{ color: getSeverityColor(selected.severity) }}>
                      {selected.severity.toUpperCase()}
                    </strong>
                  </div>
                  <div className={styles.detailMetaItem}>
                    <span>AI Confidence</span>
                    <strong style={{ color: 'var(--primary)' }}>
                      {selected.aiVerification.confidence}%
                    </strong>
                  </div>
                  <div className={styles.detailMetaItem}>
                    <span>Filed On</span>
                    <strong>{new Date(selected.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className={styles.miniTimeline}>
                  {selected.statusHistory.map((h, i) => (
                    <div key={i} className={styles.timelineItem}>
                      <div
                        className={styles.timelineDot}
                        style={{ background: getStatusColor(h.status) }}
                      ></div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineLabel}>{getStatusLabel(h.status)}</div>
                        <div className={styles.timelineNote}>{h.note}</div>
                        <div className={styles.timelineTime}>
                          {new Date(h.timestamp).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <a href={`/status?id=${selected.id}`} className="btn btn-primary btn-sm">
                  Full Tracking View →
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
