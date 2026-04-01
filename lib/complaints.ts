// Complaint data types and localStorage utilities

export type ComplaintStatus = 
  | 'filed'
  | 'acknowledged'
  | 'investigating'
  | 'action_taken'
  | 'resolved';

export type EncroachmentType =
  | 'construction'
  | 'waste_dumping'
  | 'land_filling'
  | 'sewage_discharge'
  | 'illegal_fishing'
  | 'other';

export interface Complaint {
  id: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  photo: string; // base64
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
  };
  description: string;
  encroachmentType: EncroachmentType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  aiVerification: {
    verified: boolean;
    confidence: number;
    reasoning: string;
    detectedFeatures: string[];
  };
  reporter: {
    name: string;
    email: string;
    phone: string;
  };
  statusHistory: Array<{
    status: ComplaintStatus;
    timestamp: string;
    note: string;
  }>;
}

const STORAGE_KEY = 'aquaguard_complaints';

export function saveComplaint(complaint: Complaint): void {
  const existing = getAllComplaints();
  existing.push(complaint);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getAllComplaints(): Complaint[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getSeedComplaints();
  } catch {
    return getSeedComplaints();
  }
}

export function getComplaintById(id: string): Complaint | null {
  const all = getAllComplaints();
  return all.find((c) => c.id === id) || null;
}

export function updateComplaintStatus(id: string, status: ComplaintStatus, note: string): void {
  const all = getAllComplaints();
  const idx = all.findIndex((c) => c.id === id);
  if (idx !== -1) {
    all[idx].status = status;
    all[idx].updatedAt = new Date().toISOString();
    all[idx].statusHistory.push({ status, timestamp: new Date().toISOString(), note });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `WBE-${year}-${random}`;
}

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

// Seed data for demo purposes
function getSeedComplaints(): Complaint[] {
  return [
    {
      id: 'WBE-2024-AB123',
      status: 'investigating',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      photo: '',
      location: {
        lat: 28.6139,
        lng: 77.2090,
        address: 'Yamuna River Bank, near ITO Bridge',
        city: 'New Delhi',
        state: 'Delhi',
      },
      description: 'Illegal construction activity observed on the Yamuna floodplain. Multiple trucks dumping construction debris directly into the river.',
      encroachmentType: 'construction',
      severity: 'critical',
      aiVerification: {
        verified: true,
        confidence: 94,
        reasoning: 'Image shows water body with construction machinery. Clear violation of floodplain regulations.',
        detectedFeatures: ['water body visible', 'construction machinery', 'debris dumping'],
      },
      reporter: { name: 'Rahul Verma', email: 'rahul@example.com', phone: '9876543210' },
      statusHistory: [
        { status: 'filed', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), note: 'Complaint filed by citizen.' },
        { status: 'acknowledged', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), note: 'Complaint acknowledged by Delhi PCB.' },
        { status: 'investigating', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Field team dispatched to location.' },
      ],
    },
    {
      id: 'WBE-2024-CD456',
      status: 'resolved',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      photo: '',
      location: {
        lat: 19.0760,
        lng: 72.8777,
        address: 'Powai Lake, Hiranandani Gardens',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
      description: 'Solid waste being dumped near Powai lake shore. Plastic waste accumulation affecting water quality.',
      encroachmentType: 'waste_dumping',
      severity: 'high',
      aiVerification: {
        verified: true,
        confidence: 88,
        reasoning: 'Detected lake shore with visible waste accumulation. Environmental violation confirmed.',
        detectedFeatures: ['lake shore', 'solid waste', 'plastic debris'],
      },
      reporter: { name: 'Priya Sharma', email: 'priya@example.com', phone: '9876543211' },
      statusHistory: [
        { status: 'filed', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), note: 'Complaint filed.' },
        { status: 'acknowledged', timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), note: 'Acknowledged by MCGM.' },
        { status: 'investigating', timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), note: 'Investigation underway.' },
        { status: 'action_taken', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), note: 'Cleanup drive initiated.' },
        { status: 'resolved', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), note: 'Area cleaned. Surveillance camera installed.' },
      ],
    },
    {
      id: 'WBE-2024-EF789',
      status: 'filed',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      photo: '',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: 'Bellandur Lake, Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
      },
      description: 'Sewage discharge pipes from nearby apartment complex directly discharging into Bellandur lake.',
      encroachmentType: 'sewage_discharge',
      severity: 'critical',
      aiVerification: {
        verified: true,
        confidence: 91,
        reasoning: 'Detected active discharge pipe near lake. Discoloration of water visible.',
        detectedFeatures: ['lake', 'discharge pipe', 'water discoloration'],
      },
      reporter: { name: 'Arjun Kumar', email: 'arjun@example.com', phone: '9876543212' },
      statusHistory: [
        { status: 'filed', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: 'Complaint filed. AI verification passed.' },
      ],
    },
    {
      id: 'WBE-2024-GH012',
      status: 'acknowledged',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      photo: '',
      location: {
        lat: 22.5726,
        lng: 88.3639,
        address: 'East Calcutta Wetlands, EM Bypass',
        city: 'Kolkata',
        state: 'West Bengal',
      },
      description: 'Land filling activity on the East Calcutta wetlands. Heavy machinery spotted converting wetland to built-up area.',
      encroachmentType: 'land_filling',
      severity: 'high',
      aiVerification: {
        verified: true,
        confidence: 87,
        reasoning: 'Wetland area with land-filling machinery visible. Ramsar site protection violation.',
        detectedFeatures: ['wetland', 'heavy machinery', 'earth filling'],
      },
      reporter: { name: 'Monika Das', email: 'monika@example.com', phone: '9876543213' },
      statusHistory: [
        { status: 'filed', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), note: 'Complaint filed.' },
        { status: 'acknowledged', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), note: 'West Bengal PCB has acknowledged the complaint.' },
      ],
    },
  ];
}
