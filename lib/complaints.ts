import type { Complaint, ComplaintStatus, ComplaintReviewStatus, AIVerificationResult } from './types';

const API_BASE = '';

export async function fetchAllComplaints(adminKey?: string): Promise<Complaint[]> {
  const res = await fetch(`${API_BASE}/api/complaints`, {
    cache: 'no-store',
    headers: adminKey ? { 'x-admin-key': adminKey } : undefined,
  });
  if (res.status === 401) throw new Error('Invalid admin key');
  if (!res.ok) throw new Error('Failed to load complaints');
  return res.json();
}

export async function fetchOfficerEmail(adminKey: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/admin/settings`, {
    cache: 'no-store',
    headers: { 'x-admin-key': adminKey },
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'Failed to load officer email');
  return payload.officerEmail;
}

export async function saveOfficerEmail(adminKey: string, officerEmail: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/admin/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
    body: JSON.stringify({ officerEmail }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'Failed to save officer email');
  return payload.officerEmail;
}

export async function fetchComplaintById(id: string): Promise<Complaint | null> {
  const res = await fetch(`${API_BASE}/api/complaints/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load complaint');
  return res.json();
}

export async function createComplaint(data: {
  photo: string;
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
  description: string;
  encroachmentType: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  aiVerified: boolean;
  aiConfidence: number;
  aiReasoning: string;
  aiDetectedFeatures: string[];
  severity: string;
  verificationProof?: string;
}): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'Failed to file complaint');
  return payload;
}

export async function verifyEncroachmentImage(
  photo: string,
  description: string,
  coordinates: { lat: number; lng: number }
): Promise<AIVerificationResult> {
  const res = await fetch(`${API_BASE}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo, description, lat: coordinates.lat, lng: coordinates.lng }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'AI verification failed');
  return payload;
}

export async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(`${API_BASE}/api/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'Failed to resolve location');
  return payload as { address: string; city: string; state: string; lat: number; lng: number };
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  note: string,
  adminKey: string
): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/api/complaints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ status, note }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'Failed to update status');
  return payload;
}

export async function reviewComplaint(
  id: string,
  status: Exclude<ComplaintReviewStatus, 'pending'>,
  note: string,
  adminKey: string
): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/api/complaints/${encodeURIComponent(id)}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
    body: JSON.stringify({ status, note }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'Failed to record official review');
  return payload;
}

export async function deleteComplaint(id: string, adminKey: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/complaints/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': adminKey },
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'Failed to delete complaint');
}

export {
  getStatusLabel,
  getStatusColor,
  getSeverityColor,
} from './complaint-utils';


export type { Complaint, ComplaintStatus, ComplaintReviewStatus, EncroachmentType, Severity, AIVerificationResult } from './types';
