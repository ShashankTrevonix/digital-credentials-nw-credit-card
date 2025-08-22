// API types and interfaces for NatWest Credit Card Application

export interface PingOneTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export interface QRCodeData {
  id: string;
  data: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'used';
}

export interface CreditCardSession {
  id: string;
  qrCodeId: string;
  accessToken: string;
  createdAt: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

// PingOne Presentation Request types
export interface PresentationRequest {
  message: string;
  protocol: 'NATIVE';
  digitalWalletApplication: {
    id: string;
  };
  requestedCredentials: Array<{
    type: string;
    keys: string[];
  }>;
}

export interface PresentationResponse {
  id: string;
  status: string;
  _links: {
    qr: {
      href: string;
    };
    appOpenUrl: {
      href: string;
    };
    self: {
      href: string;
    };
    [key: string]: any;
  };
  createdAt: string;
  expiresAt: string;
  environment: {
    id: string;
  };
  applicationInstance: {
    id: string;
  };
  [key: string]: any;
}

export interface QRCodeResponse {
  qrCodeUrl: string;
  sessionId: string;
  status: string;
  rawResponse?: PresentationResponse; // Store the full response for polling
}

// Verification status types for polling
export type VerificationStatus =
  | 'INITIAL'           // QR displayed, waiting for scan
  | 'WAITING'           // QR scanned, waiting for approval
  | 'VERIFICATION_SUCCESSFUL'  // Verification completed successfully
  | 'VERIFICATION_FAILED'      // Verification failed
  | 'VERIFICATION_EXPIRED';    // Session expired

export interface VerificationStatusResponse {
  id: string;
  status: VerificationStatus;
  createdAt: string;
  expiresAt: string;
  environment: {
    id: string;
  };
  applicationInstance: {
    id: string;
  };
  _links: {
    self: {
      href: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

// Credential data types for successful verification
export interface CredentialDataResponse {
  _links?: {
    self: { href: string };
    qr: { href: string };
    appOpenUrl: { href: string };
  };
  id: string;
  environment: {
    id: string;
  };
  status: string;
  createdAt: string;
  expiresAt: string;
  sessionData: {
    id: string;
    credentialsDataList: Array<{
      issuerId: string;
      issuerName: string;
      issuerApplicationInstanceId: string;
      issuanceDate: string;
      type: string;
      types: string[];
      data: Array<{
        key: string;
        value: string;
      }>;
      verificationStatus: string;
    }>;
  };
  applicationInstance: {
    id: string;
  };
  [key: string]: any;
}

export interface FlattenedCredentialData {
  [credentialName: string]: {
    id: string;
    type: string;
    verificationStatus: string;
    issuerName: string;
    issuerId: string;
    data: Record<string, string>;
    // Extracted user information
    userInfo?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      birthdate?: string;
      age?: number;
      accountNumber?: string;
      sortCode?: string;
      creditScore?: number;
      annualIncome?: number;
    };
  };
}

// Normalized status for frontend
export type NormalizedStatus =
  | 'pending'           // Waiting for scan
  | 'scanned'           // QR scanned, approve in app
  | 'approved'          // Verification successful
  | 'declined'          // User rejected
  | 'expired'           // Session expired
  | 'failed'            // Terminal error
  | 'timeout';          // Polling timeout

// Credit card application specific types
export interface CreditCardApplication {
  id: string;
  userId: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  creditLimit: number;
  cardType: 'classic' | 'gold' | 'platinum' | 'signature';
  annualFee: number;
  interestRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditAssessmentResult {
  applicationId: string;
  creditScore: number;
  eligibility: boolean;
  recommendedLimit: number;
  riskLevel: 'low' | 'medium' | 'high';
  decision: 'approve' | 'reject' | 'review';
  reasons: string[];
}
