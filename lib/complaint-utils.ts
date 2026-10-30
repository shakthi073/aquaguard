import type { Complaint, ComplaintStatus } from './types';

export function getStatusLabel(status: ComplaintStatus): string {
  const labels: Record<ComplaintStatus, string> = {
    filed: 'Filed',
    acknowledged: 'Acknowledged',
    investigating: 'Under Investigation',
    action_taken: 'Action Taken',
    resolved: 'Resolved',
  };
  return labels[status];
}

export function getStatusColor(status: ComplaintStatus): string {
  const colors: Record<ComplaintStatus, string> = {
    filed: 'var(--text-secondary)',
    acknowledged: 'var(--primary)',
    investigating: 'var(--warning)',
    action_taken: 'var(--accent-orange)',
    resolved: 'var(--accent)',
  };
  return colors[status];
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'var(--accent)',
    medium: 'var(--warning)',
    high: 'var(--accent-orange)',
    critical: 'var(--danger)',
  };
  return colors[severity] || 'var(--text-secondary)';
}

export function serializeComplaint(record: {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  photoPath: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  description: string;
  encroachmentType: string;
  severity: string;
  aiVerified: boolean;
  aiConfidence: number;
  aiReasoning: string;
  aiDetectedFeatures: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  reviewStatus: string;
  reviewNote: string;
  reviewedAt: Date | null;
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    note: string;
  }>;
}, includeReporter = false): Complaint {
  let detectedFeatures: string[] = [];
  try {
    detectedFeatures = JSON.parse(record.aiDetectedFeatures);
  } catch {
    detectedFeatures = [];
  }

  return {
    id: record.id,
    status: record.status as ComplaintStatus,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    review: {
      status: record.reviewStatus as Complaint['review']['status'],
      note: record.reviewNote,
      reviewedAt: record.reviewedAt?.toISOString() ?? null,
    },
    photo: record.photoPath.startsWith('/uploads/')
      ? record.photoPath.replace('/uploads/', '/api/uploads/')
      : record.photoPath,
    location: {
      lat: record.lat,
      lng: record.lng,
      address: record.address,
      city: record.city,
      state: record.state,
    },
    description: record.description,
    encroachmentType: record.encroachmentType as Complaint['encroachmentType'],
    severity: record.severity as Complaint['severity'],
    aiVerification: {
      verified: record.aiVerified,
      confidence: record.aiConfidence,
      reasoning: record.aiReasoning,
      detectedFeatures,
    },
    reporter: {
      name: includeReporter ? record.reporterName : '',
      email: includeReporter ? record.reporterEmail : '',
      phone: includeReporter ? record.reporterPhone : '',
    },
    statusHistory: record.statusHistory.map((h) => ({
      status: h.status as ComplaintStatus,
      timestamp: h.timestamp.toISOString(),
      note: h.note,
    })),
  };
}


export function parseLocationFromAddress(
  address: string,
  lat: number,
  lng: number
): { city: string; state: string } {
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const state = parts[parts.length - 1] || 'Unknown';
    const city = parts[parts.length - 2] || 'Unknown';
    return { city, state };
  }
  return { city: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, state: 'Unknown' };
}
