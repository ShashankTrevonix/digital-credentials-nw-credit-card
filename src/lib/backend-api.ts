// Frontend API service - calls our backend instead of PingOne directly
import type { 
  PingOneTokenResponse, 
  PresentationResponse, 
  QRCodeResponse, 
  VerificationStatusResponse, 
  CredentialDataResponse 
} from '@/types/api';

const BACKEND_BASE_URL = '/api/pingone/verify';

// Generic backend API call function
async function callBackendAPI<T>(action: string, data?: any): Promise<T> {
  try {
    console.log(`🔄 Frontend: Calling backend API with action: ${action}`, data);
    
    const response = await fetch(BACKEND_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    console.log(`📡 Frontend: Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Frontend: Backend API error:', errorData);
      throw new Error(errorData.error || `Backend API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Frontend: Backend API success for action: ${action}`);
    
    if (!result.success) {
      console.error('❌ Frontend: Backend API returned unsuccessful response:', result);
      throw new Error(result.error || 'Backend API returned unsuccessful response');
    }

    return result.data;
  } catch (error) {
    console.error('❌ Frontend: Backend API call failed:', error);
    if (error instanceof Error) {
      throw new Error(`Backend API call failed: ${error.message}`);
    }
    throw new Error('Backend API call failed: Unknown error');
  }
}

// Backend API functions (replacing direct PingOne calls)

export async function getPingOneAccessToken(): Promise<PingOneTokenResponse> {
  console.log('🔄 Frontend: Requesting access token from backend...');
  return await callBackendAPI<PingOneTokenResponse>('getToken');
}

export async function createPresentationRequest(accessToken: string, message?: string): Promise<PresentationResponse> {
  console.log('🔄 Frontend: Requesting presentation creation from backend...');
  return await callBackendAPI<PresentationResponse>('createPresentation', { accessToken, message });
}

export async function getQRCode(qrCodeUrl: string): Promise<QRCodeResponse> {
  console.log('🔄 Frontend: Requesting QR code from backend...');
  return await callBackendAPI<QRCodeResponse>('getQRCode', { qrCodeUrl });
}

export async function checkVerificationStatus(
  accessToken: string, 
  environmentId: string, 
  sessionId: string
): Promise<VerificationStatusResponse> {
  console.log('🔄 Frontend: Requesting status check from backend...');
  return await callBackendAPI<VerificationStatusResponse>('checkStatus', { 
    accessToken, 
    environmentId, 
    sessionId 
  });
}

export async function getCredentialData(
  accessToken: string, 
  environmentId: string, 
  sessionId: string
): Promise<CredentialDataResponse> {
  console.log('🔄 Frontend: Requesting credential data from backend...');
  return await callBackendAPI<CredentialDataResponse>('getCredentialData', { 
    accessToken, 
    environmentId, 
    sessionId 
  });
}

export async function issueCredential(accessToken: string, userId: string): Promise<any> {
  console.log('🔄 Frontend: Requesting credential issuance from backend...');
  return await callBackendAPI('issueCredential', { accessToken, userId });
}

// Combined function for QR code generation (matches existing API)
export async function generateQRCode(accessToken: string, message?: string) {
  console.log('🔄 Frontend: Generating QR code via backend...');
  
  // Step 1: Create presentation request
  const presentationResponse = await createPresentationRequest(accessToken, message);
  
  if (!presentationResponse._links?.qr?.href) {
    throw new Error('Invalid presentation response: missing QR code URL');
  }

  // No need for Step 2 - QR code URL is already available from presentation response
  return {
    sessionId: presentationResponse.id,
    qrCodeUrl: presentationResponse._links.qr.href, // Use the URL directly
    status: 'INITIAL', // QR code is ready for scanning
    rawResponse: presentationResponse
  };
}

// Credit assessment function (kept local for now)
export async function assessCreditEligibility(userInfo: any) {
  // This function can remain local or be moved to backend
  // For now, keeping it as is since it's business logic
  console.log('🔄 Frontend: Assessing credit eligibility locally...');
  
  // Simulate credit assessment logic
  const creditScore = Math.floor(Math.random() * 300) + 500; // 500-800
  const eligibility = creditScore >= 600;
  const recommendedLimit = eligibility ? Math.floor(creditScore * 10) : 0;
  const riskLevel: 'low' | 'medium' | 'high' = creditScore >= 750 ? 'low' : creditScore >= 650 ? 'medium' : 'high';
  const decision: 'approve' | 'reject' | 'review' = eligibility ? 'approve' : 'reject';
  
  return {
    applicationId: `ASSESS-${Date.now()}`,
    creditScore,
    eligibility,
    recommendedLimit,
    riskLevel,
    decision,
    reasons: eligibility ? ['Good credit history'] : ['Insufficient credit score']
  };
}

// Credit card application submission (kept local for now)
export async function submitCreditCardApplication(userInfo: any, creditCardType: string) {
  // This function can remain local or be moved to backend
  // For now, keeping it as is since it's business logic
  console.log('🔄 Frontend: Submitting credit card application locally...');
  
  // Simulate application submission
  const now = new Date().toISOString();
  return {
    id: `APP-${Date.now()}`,
    userId: userInfo?.id || 'user-123',
    status: 'approved' as const,
    creditLimit: 5000,
    cardType: creditCardType as 'classic' | 'gold' | 'platinum' | 'signature',
    annualFee: creditCardType === 'classic' ? 0 : creditCardType === 'gold' ? 50 : 100,
    interestRate: 19.9,
    createdAt: now,
    updatedAt: now
  };
}
