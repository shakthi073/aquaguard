'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import {
  createComplaint,
  verifyEncroachmentImage,
  reverseGeocode,
} from '@/lib/complaints';
import type { EncroachmentType, AIVerificationResult } from '@/lib/complaints';
import type * as LeafletType from 'leaflet';
import styles from './page.module.css';

type Step = 'capture' | 'details' | 'verify' | 'submit' | 'done';

export default function ReportPage() {
  const [step, setStep] = useState<Step>('capture');
  const [photo, setPhoto] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string; city?: string; state?: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [encroachmentType, setEncroachmentType] = useState<EncroachmentType>('construction');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [aiResult, setAiResult] = useState<AIVerificationResult | null>(null);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mapRef = useRef<LeafletType.Map | null>(null);
  const markerRef = useRef<LeafletType.Marker | null>(null);
  const submittingRef = useRef(false);

  // Compress image helper
  const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 768, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Unable to access camera. Please use the upload option or grant camera permissions.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    stopCamera();
  }, [stopCamera]);

  // Upload photo from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawBase64 = ev.target?.result as string;
      const compressed = await compressImage(rawBase64);
      setPhoto(compressed);
    };
    reader.readAsDataURL(file);
  };

  const getLocation = () => {
    setGpsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const data = await reverseGeocode(lat, lng);
          setLocation({
            lat: data.lat,
            lng: data.lng,
            address: data.address,
            city: data.city,
            state: data.state,
          });
        } catch {
          setLocation({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
        }
        setGpsLoading(false);
      },
      () => {
        setError('Unable to get location. Please enable GPS and try again.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Initialize and manage Leaflet map for location adjustment
  useEffect(() => {
    if (typeof window === 'undefined' || !location || step !== 'capture') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    import('leaflet').then((leafletModule) => {
      if (!isMounted) return;
      const L = leafletModule.default || leafletModule;
      const mapEl = document.getElementById('report-map');
      if (!mapEl) return;

      if (!mapRef.current) {
        const map = L.map('report-map', {
          center: [location.lat, location.lng],
          zoom: 15,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Custom SVG icon for marker to avoid path issues
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 32px; height: 32px;
              background: var(--primary);
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg) translate(2px, -2px);
              border: 2px solid white;
              box-shadow: 0 2px 12px rgba(0, 180, 216, 0.4);
              display: flex; align-items: center; justify-content: center;
            ">
              <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([location.lat, location.lng], {
          draggable: true,
          icon,
        }).addTo(map);

        // Drag event to update coordinates and reverse geocode
        marker.on('dragend', async () => {
          const newLatLng = marker.getLatLng();
          const newLat = newLatLng.lat;
          const newLng = newLatLng.lng;
          try {
            const data = await reverseGeocode(newLat, newLng);
            setLocation({
              lat: newLat,
              lng: newLng,
              address: data.address,
              city: data.city,
              state: data.state,
            });
          } catch {
            setLocation({
              lat: newLat,
              lng: newLng,
              address: `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`,
            });
          }
        });

        // Map click event to move marker and update coordinates
        map.on('click', async (e: LeafletType.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          try {
            const data = await reverseGeocode(lat, lng);
            setLocation({
              lat,
              lng,
              address: data.address,
              city: data.city,
              state: data.state,
            });
          } catch {
            setLocation({
              lat,
              lng,
              address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            });
          }
        });

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        const map = mapRef.current;
        const marker = markerRef.current;
        if (marker) {
          const currentLatLng = marker.getLatLng();

          // Update marker and center map if coordinates deviate slightly
          if (
            Math.abs(currentLatLng.lat - location.lat) > 0.00001 ||
            Math.abs(currentLatLng.lng - location.lng) > 0.00001
          ) {
            marker.setLatLng([location.lat, location.lng]);
            map.panTo([location.lat, location.lng]);
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [location, step]);

  // Run AI verification
  const runVerification = async () => {
    if (!location) return;
    setAiLoading(true);
    setError('');
    setStep('verify');
    try {
      const result = await verifyEncroachmentImage(
        photo,
        `${encroachmentType.replace(/_/g, ' ')} — ${description}`,
        location
      );
      setAiResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI verification failed';
      setError(`${message} You can still submit this report for manual review.`);
      setAiResult({
        verified: false,
        confidence: 0,
        reasoning: 'AI verification was unavailable. An administrator will review this report.',
        detectedFeatures: [],
        encroachmentType,
        severity: 'medium',
      });
      setStep('verify');
    } finally {
      setAiLoading(false);
    }
  };

  // Submit complaint
  const submitComplaint = async () => {
    if (!location || !aiResult || submitting || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const complaint = await createComplaint({
        photo,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        city: location.city,
        state: location.state,
        description,
        encroachmentType,
        reporterName,
        reporterEmail,
        reporterPhone,
        aiVerified: aiResult.verified,
        aiConfidence: aiResult.confidence,
        aiReasoning: aiResult.reasoning,
        aiDetectedFeatures: aiResult.detectedFeatures,
        severity: aiResult.severity,
        verificationProof: aiResult.verificationProof,
      });
      setComplaintId(complaint.id);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to file complaint');
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const canGoToDetails = photo && location;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail);
  const canVerify = description.length > 20 && reporterName.trim().length >= 2 && isValidEmail;

  return (
    <>
      <div className="bg-animated">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
      </div>
      <Navbar />

      <main className={styles.main}>
        <div className="container">
          {/* Header */}
          <div className={styles.header}>
            <span className="badge badge-primary">
              {step !== 'done' ? `Step ${['capture', 'details', 'verify', 'submit'].indexOf(step) + 1} of 4` : 'Completed'}
            </span>
            <h1 className={styles.title}>Report Encroachment</h1>
            <p className={styles.subtitle}>
              Capture evidence, get AI verification, and file your complaint — all in one flow.
            </p>
          </div>

          {/* Progress */}
          <div className={styles.progress}>
            {[
              { key: 'capture', label: 'Capture' },
              { key: 'details', label: 'Details' },
              { key: 'verify', label: 'AI Verify' },
              { key: 'submit', label: 'Submit' },
            ].map((s, i) => {
              const stepOrder = ['capture', 'details', 'verify', 'submit', 'done'];
              const current = stepOrder.indexOf(step);
              const idx = stepOrder.indexOf(s.key);
              return (
                <div key={s.key} className={styles.progressItem}>
                  <div
                    className={`${styles.progressDot} ${idx <= current ? styles.progressDotActive : ''} ${idx < current ? styles.progressDotDone : ''}`}
                  >
                    {idx < current ? '✓' : i + 1}
                  </div>
                  <span className={`${styles.progressLabel} ${idx <= current ? styles.progressLabelActive : ''}`}>
                    {s.label}
                  </span>
                  {i < 3 && <div className={`${styles.progressLine} ${idx < current ? styles.progressLineDone : ''}`}></div>}
                </div>
              );
            })}
          </div>

          {error && (
            <div className={styles.errorBanner}>{error}</div>
          )}

          <div className={styles.content}>

            {/* ===== STEP 1: CAPTURE ===== */}
            {step === 'capture' && (
              <div className={`glass-card ${styles.card}`}>
                <h2 className={styles.cardTitle}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M20.586 4H16l-2-3H10L8 4H3.414A1.414 1.414 0 002 5.414V19a2 2 0 002 2h16a2 2 0 002-2V5.414A1.414 1.414 0 0020.586 4z" />
                  </svg>
                  Capture Evidence
                </h2>

                {/* Camera / Preview */}
                <div className={styles.cameraArea}>
                  {!photo && !cameraActive && (
                    <div className={styles.cameraPlaceholder}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M20.586 4H16l-2-3H10L8 4H3.414A1.414 1.414 0 002 5.414V19a2 2 0 002 2h16a2 2 0 002-2V5.414A1.414 1.414 0 0020.586 4z" />
                      </svg>
                      <p>No photo yet</p>
                    </div>
                  )}
                  {cameraActive && (
                    <video ref={videoRef} className={styles.video} playsInline muted autoPlay />
                  )}
                  {photo && !cameraActive && (
                    <div className={styles.photoPreview}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt="Captured" className={styles.capturedImg} />
                      <div className={styles.photoOverlay}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setPhoto('')}>
                          Retake
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Camera controls */}
                <div className={styles.camControls}>
                  {!cameraActive && !photo && (
                    <>
                      <button id="btn-open-camera" className="btn btn-primary" onClick={startCamera}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M20.586 4H16l-2-3H10L8 4H3.414A1.414 1.414 0 002 5.414V19a2 2 0 002 2h16a2 2 0 002-2V5.414A1.414 1.414 0 0020.586 4z" />
                        </svg>
                        Open Camera
                      </button>
                      <button id="btn-upload-photo" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                        Upload Photo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                    </>
                  )}
                  {cameraActive && (
                    <>
                      <button id="btn-capture-photo" className={`btn btn-primary ${styles.captureBtn}`} onClick={capturePhoto}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                        Capture
                      </button>
                      <button className="btn btn-secondary" onClick={stopCamera}>Cancel</button>
                    </>
                  )}
                </div>

                {/* GPS */}
                <div className={styles.gpsSection}>
                  <div className={styles.gpsSectionHeader}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                    </svg>
                    Location Detection
                  </div>
                  {location ? (
                    <>
                      <div className={styles.locationFound}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <div>
                          <div className={styles.locationAddress}>{location.address}</div>
                          <div className={styles.locationCoords}>
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'left' }}>
                          📍 Drag the marker or click on the map to adjust the exact location.
                        </p>
                        <div
                          id="report-map"
                          style={{
                            height: '250px',
                            width: '100%',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            zIndex: 1,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <button id="btn-get-location" className="btn btn-secondary" onClick={getLocation} disabled={gpsLoading}>
                      {gpsLoading ? <div className="spinner"></div> : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      )}
                      {gpsLoading ? 'Getting Location...' : 'Get My Location'}
                    </button>
                  )}
                </div>

                <button
                  id="btn-next-details"
                  className="btn btn-primary"
                  disabled={!canGoToDetails}
                  onClick={() => setStep('details')}
                  style={{ width: '100%', marginTop: '24px' }}
                >
                  Next: Add Details →
                </button>
              </div>
            )}

            {/* ===== STEP 2: DETAILS ===== */}
            {step === 'details' && (
              <div className={`glass-card ${styles.card}`}>
                <h2 className={styles.cardTitle}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  Complaint Details
                </h2>

                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label">Type of Encroachment *</label>
                    <select
                      id="select-encroachment-type"
                      className="form-select"
                      value={encroachmentType}
                      onChange={(e) => setEncroachmentType(e.target.value as EncroachmentType)}
                    >
                      <option value="construction">🏗️ Illegal Construction</option>
                      <option value="waste_dumping">🗑️ Waste Dumping</option>
                      <option value="land_filling">🏔️ Land Filling</option>
                      <option value="sewage_discharge">💧 Sewage Discharge</option>
                      <option value="illegal_fishing">🎣 Illegal / Destructive Fishing</option>
                      <option value="other">🔴 Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Describe the Encroachment * (min. 20 chars)</label>
                    <textarea
                      id="textarea-description"
                      className="form-textarea"
                      placeholder="Describe what you see — water body type, encroachment activity, scale, any machinery or structures involved..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {description.length} characters
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input
                      id="input-reporter-name"
                      className="form-input"
                      type="text"
                      placeholder="Full name"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      id="input-reporter-email"
                      className="form-input"
                      type="email"
                      placeholder="you@example.com"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number (optional)</label>
                    <input
                      id="input-reporter-phone"
                      className="form-input"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.navBtns}>
                  <button className="btn btn-secondary" onClick={() => setStep('capture')}>← Back</button>
                  <button
                    id="btn-run-ai-verify"
                    className="btn btn-accent"
                    disabled={!canVerify}
                    onClick={runVerification}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Run AI Verification
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 3: AI VERIFY ===== */}
            {(step === 'verify' || (step === 'details' && aiLoading)) && (
              <div className={`glass-card ${styles.card}`}>
                <h2 className={styles.cardTitle}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Verification
                </h2>

                {aiLoading && (
                  <div className={styles.aiLoading}>
                    <div className={styles.aiRadar}>
                      <div className={styles.radarCircle}></div>
                      <div className={styles.radarCircle}></div>
                      <div className={styles.radarCircle}></div>
                      <div className={styles.radarSweep}></div>
                    </div>
                    <p className={styles.aiLoadingText}>Analyzing image with AI...</p>
                    <div className={styles.aiSteps}>
                      <div className={styles.aiStep}>🔍 Detecting water body features...</div>
                      <div className={styles.aiStep}>🏗️ Identifying encroachment patterns...</div>
                      <div className={styles.aiStep}>📍 Cross-referencing GPS coordinates...</div>
                    </div>
                  </div>
                )}

                {!aiLoading && aiResult && (
                  <div className={styles.aiResults}>
                    {/* Verdict */}
                    <div
                      className={`${styles.verdict} ${aiResult.verified ? styles.verdictGreen : styles.verdictRed}`}
                    >
                      <div className={styles.verdictIcon}>
                        {aiResult.verified ? '✅' : '❌'}
                      </div>
                      <div>
                        <div className={styles.verdictTitle}>
                          {aiResult.verified ? 'Encroachment Verified' : 'Verification Failed'}
                        </div>
                        <div className={styles.verdictSub}>{aiResult.reasoning}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className={styles.aiStats}>
                      <div className={styles.aiStat}>
                        <div className={styles.aiStatNum} style={{ color: 'var(--primary)' }}>
                          {aiResult.confidence}%
                        </div>
                        <div className={styles.aiStatLabel}>AI Confidence</div>
                      </div>
                      <div className={styles.aiStat}>
                        <div
                          className={styles.aiStatNum}
                          style={{ color: aiResult.severity === 'critical' ? 'var(--danger)' : aiResult.severity === 'high' ? 'var(--accent-orange)' : 'var(--warning)' }}
                        >
                          {aiResult.severity?.toUpperCase()}
                        </div>
                        <div className={styles.aiStatLabel}>Severity</div>
                      </div>
                      <div className={styles.aiStat}>
                        <div className={styles.aiStatNum} style={{ color: 'var(--accent)' }}>
                          {aiResult.detectedFeatures?.length || 0}
                        </div>
                        <div className={styles.aiStatLabel}>Features Detected</div>
                      </div>
                    </div>

                    {/* Detected Features */}
                    <div className={styles.featuresSection}>
                      <h4>Detected Evidence</h4>
                      <div className={styles.featuresList}>
                        {aiResult.detectedFeatures?.map((f: string, i: number) => (
                          <span key={i} className="badge badge-primary">{f}</span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.navBtns}>
                      <button className="btn btn-secondary" onClick={() => { setStep('details'); setAiResult(null); }}>
                        ← Re-submit Details
                      </button>
                      <button
                        id="btn-proceed-submit"
                        className={`btn ${aiResult.verified ? 'btn-accent' : 'btn-secondary'}`}
                        onClick={() => setStep('submit')}
                      >
                        {aiResult.verified ? '✓ Proceed to File Complaint' : 'Submit Anyway →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 4: SUBMIT ===== */}
            {step === 'submit' && (
              <div className={`glass-card ${styles.card}`}>
                <h2 className={styles.cardTitle}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.09 2.18 2 2 0 012.08 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.66 6.66l1.28-1.28a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
                  </svg>
                  Review & Submit
                </h2>

                <div className={styles.reviewGrid}>
                  {/* Photo */}
                  <div className={styles.reviewPhoto}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {photo && <img src={photo} alt="Evidence" />}
                    <div className={styles.reviewPhotoInfo}>
                      <span className="badge badge-primary">Photo Evidence</span>
                      <span className="badge" style={{ color: 'var(--accent)', background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.25)' }}>
                        AI: {aiResult?.confidence}% Confidence
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className={styles.reviewDetails}>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewKey}>Location</span>
                      <span className={styles.reviewVal}>{location?.address}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewKey}>GPS</span>
                      <span className={styles.reviewVal}>{location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewKey}>Type</span>
                      <span className={styles.reviewVal} style={{ textTransform: 'capitalize' }}>
                        {encroachmentType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewKey}>Description</span>
                      <span className={styles.reviewVal}>{description}</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewKey}>Reporter</span>
                      <span className={styles.reviewVal}>{reporterName} ({reporterEmail})</span>
                    </div>
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewKey}>AI Status</span>
                      <span className={styles.reviewVal} style={{ color: aiResult?.verified ? 'var(--accent)' : 'var(--warning)' }}>
                        {aiResult?.verified ? '✓ Verified' : '⚠ Unverified'} — {aiResult?.severity?.toUpperCase()} priority
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.disclaimer}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
                  </svg>
                  By submitting, you confirm this report is accurate to the best of your knowledge. Filing false complaints is a punishable offense.
                </div>

                <div className={styles.navBtns}>
                  <button className="btn btn-secondary" onClick={() => setStep('verify')}>← Back</button>
                  <button
                    id="btn-file-complaint"
                    className="btn btn-primary btn-lg"
                    onClick={submitComplaint}
                    disabled={submitting}
                  >
                    {submitting ? <div className="spinner"></div> : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    )}
                    {submitting ? 'Filing Complaint...' : 'File Complaint'}
                  </button>
                </div>
              </div>
            )}

            {/* ===== DONE ===== */}
            {step === 'done' && (
              <div className={`glass-card ${styles.card} ${styles.doneCard}`}>
                <div className={styles.doneIcon}>🌊</div>
                <h2 className={styles.doneTitle}>Complaint Filed!</h2>
                <p className={styles.doneDesc}>
                  Your complaint has been filed and the concerned authority has been notified.
                  Save your complaint ID below — you will receive email updates when your
                  status changes (if email is configured on the server).
                </p>

                <div className={styles.complaintIdBox}>
                  <span className={styles.complaintIdLabel}>Your Complaint ID</span>
                  <div className={styles.complaintIdValue}>{complaintId}</div>
                  <p className={styles.complaintIdNote}>Save this ID to track your complaint status</p>
                </div>

                <div className={styles.slaTimeline}>
                  <h4>Expected Timeline (SLA)</h4>
                  {[
                    { label: 'Complaint Filed', time: 'Now', done: true },
                    { label: 'Acknowledged by Authority', time: 'Within 72 hours', done: false },
                    { label: 'Field Investigation', time: 'Within 7 days', done: false },
                    { label: 'Action Initiated', time: 'Within 21 days', done: false },
                    { label: 'Case Resolved', time: 'Within 30 days', done: false },
                  ].map((item, i) => (
                    <div key={i} className={styles.slaItem}>
                      <div className={`${styles.slaDot} ${item.done ? styles.slaDotDone : ''}`}></div>
                      <div className={styles.slaContent}>
                        <span className={styles.slaLabel}>{item.label}</span>
                        <span className={styles.slaTime}>{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.doneBtns}>
                  <a href={`/status?id=${complaintId}`} className="btn btn-primary">
                    Track This Complaint
                  </a>
                  <a href="/report" className="btn btn-secondary">
                    File Another Report
                  </a>
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
