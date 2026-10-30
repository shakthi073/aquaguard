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

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintReviewStatus = 'pending' | 'verified' | 'rejected';

export interface Complaint {
  id: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  review: {
    status: ComplaintReviewStatus;
    note: string;
    reviewedAt: string | null;
  };
  photo: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
  };
  description: string;
  encroachmentType: EncroachmentType;
  severity: Severity;
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

export interface AIVerificationResult {
  verified: boolean;
  confidence: number;
  reasoning: string;
  detectedFeatures: string[];
  encroachmentType: string;
  severity: Severity;
  verificationProof?: string;
}
