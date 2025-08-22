// API utilities for PingOne integration - NatWest Credit Card Application
import type { 
  PingOneTokenResponse, 
  PresentationRequest, 
  PresentationResponse, 
  QRCodeResponse, 
  VerificationStatusResponse, 
  CredentialDataResponse, 
  FlattenedCredentialData,
  CreditCardApplication,
  CreditAssessmentResult
} from '@/types/api';
import { API_CONFIG, API_TIMEOUTS } from '@/lib/config';

// Generic typed fetch utility
export async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`);
    }
    throw new Error('API request failed: Unknown error');
  }
}

// PingOne API functions
export async function getPingOneAccessToken(): Promise<PingOneTokenResponse> {
  const tokenUrl = `${API_CONFIG.pingOne.baseUrl}/${API_CONFIG.pingOne.environmentId}/as/token`;
  const formData = new URLSearchParams();
  formData.append('client_id', API_CONFIG.pingOne.clientId);
  formData.append('client_secret', API_CONFIG.pingOne.clientSecret);
  formData.append('grant_type', 'client_credentials');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PingOne token request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.access_token) {
      throw new Error('Invalid token response: missing access_token');
    }

    return data as PingOneTokenResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('PingOne token request timed out');
      }
      throw new Error(`Failed to get PingOne access token: ${error.message}`);
    }
    throw new Error('Failed to get PingOne access token: Unknown error');
  }
}

// Create presentation request to generate QR code
export async function createPresentationRequest(
  accessToken: string,
  message: string = "Please present your Digital ID for credit card application"
): Promise<QRCodeResponse> {
  const presentationUrl = `${API_CONFIG.pingOne.apiPath}/environments/${API_CONFIG.pingOne.environmentId}/presentationSessions`;
  
  const presentationRequest: PresentationRequest = {
    message,
    protocol: 'NATIVE',
    digitalWalletApplication: {
      id: '428b26a1-8833-43de-824b-f1ed336c6245'
    },
    requestedCredentials: [
      {
        type: 'Your Digital ID from NatWest',
        keys: []
      }
    ]
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(presentationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(presentationRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Presentation request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: PresentationResponse = await response.json();
    
    // Validate response structure
    if (!data._links?.qr?.href) {
      throw new Error('Invalid presentation response: missing QR code URL');
    }
    if (!data.id) {
      throw new Error('Invalid presentation response: missing session ID');
    }
    if (!data.environment?.id) {
      throw new Error('Invalid presentation response: missing environment ID');
    }
    if (!data.expiresAt) {
      throw new Error('Invalid presentation response: missing expiry time');
    }

    console.log('Validated presentation response:', {
      id: data.id,
      environmentId: data.environment.id,
      expiresAt: data.expiresAt,
      status: data.status
    });

    return {
      qrCodeUrl: data._links.qr.href,
      sessionId: data.id,
      status: data.status,
      rawResponse: data // Store the full response for polling
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Presentation request timed out');
      }
      throw new Error(`Failed to create presentation request: ${error.message}`);
    }
    throw new Error('Failed to create presentation request: Unknown error');
  }
}

// QR Code generation using PingOne presentation request
export async function generateQRCode(accessToken: string): Promise<QRCodeResponse> {
  try {
    console.log('Creating presentation request to generate QR code...');
    const qrResponse = await createPresentationRequest(accessToken);
    console.log('Successfully generated QR code:', {
      sessionId: qrResponse.sessionId,
      status: qrResponse.status,
      qrCodeUrl: qrResponse.qrCodeUrl
    });
    return qrResponse;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Get credential data when verification is successful
export async function getCredentialData(
  accessToken: string,
  environmentId: string,
  credentialVerificationId: string
): Promise<CredentialDataResponse> {
  const credentialUrl = `${API_CONFIG.pingOne.apiPath}/environments/${environmentId}/presentationSessions/${credentialVerificationId}/credentialData`;

  // Log the request details for debugging
  console.log('🔍 Fetching credential data with:', {
    url: credentialUrl,
    environmentId,
    credentialVerificationId,
    accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'undefined'
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(credentialUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Credential data request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: credentialUrl,
        responseText: errorText
      });
      throw new Error(`Credential data request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Log the raw response for debugging
    console.log('📥 Raw credential data response:', JSON.stringify(data, null, 2));
    
    // More flexible validation - check for different possible response structures
    const hasValidStructure = (
      (data.sessionData?.credentialsDataList) ||
      (data.status === 'VERIFICATION_SUCCESSFUL') ||
      (data.credentials) ||
      (data.payload?.credentials) ||
      (data.output?.credentials)
    );

    if (!hasValidStructure) {
      console.error('❌ Invalid credential data response structure:', {
        receivedData: data,
        expectedPaths: [
          'sessionData.credentialsDataList',
          'status === VERIFICATION_SUCCESSFUL',
          'credentials',
          'payload.credentials',
          'output.credentials'
        ],
        actualKeys: Object.keys(data),
        sessionDataKeys: data.sessionData ? Object.keys(data.sessionData) : 'undefined',
        hasValidStatus: data.status === 'VERIFICATION_SUCCESSFUL'
      });
      throw new Error('Invalid credential data response: missing required fields. Check console for response structure details.');
    }

    console.log('✅ Credential data response validation passed');
    return data as CredentialDataResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Credential data request timed out after', API_TIMEOUTS.pingOne, 'ms');
        throw new Error('Credential data request timed out');
      }
      console.error('❌ Error in getCredentialData:', error.message);
      throw new Error(`Failed to get credential data: ${error.message}`);
    }
    console.error('❌ Unknown error in getCredentialData:', error);
    throw new Error('Failed to get credential data: Unknown error');
  }
}

// Flatten credential data into the required format
export function flattenCredentialData(credentialData: CredentialDataResponse): FlattenedCredentialData {
  const flattenedData: FlattenedCredentialData = {};
  
  try {
    console.log('🔄 Flattening credential data from structure:', {
      hasSessionData: !!credentialData.sessionData,
      hasCredentialsDataList: !!credentialData.sessionData?.credentialsDataList,
      credentialsCount: credentialData.sessionData?.credentialsDataList?.length || 0
    });

    // Extract credentials from the actual response structure
    const credentials = credentialData.sessionData?.credentialsDataList || [];
    
    if (credentials.length === 0) {
      console.warn('⚠️ No credentials found in sessionData.credentialsDataList');
      console.log('🔍 Available keys in credentialData:', Object.keys(credentialData));
      return {};
    }

    console.log(`📊 Processing ${credentials.length} credentials:`, credentials);
    
    credentials.forEach((credential, index) => {
      console.log(`🔍 Processing credential ${index + 1}:`, credential);
      
      // Use the credential type as the key
      const credentialName = credential.type || `credential_${index}`;
      
      if (credentialName) {
        // Convert the data array to a key-value object
        const dataObject: Record<string, string> = {};
        credential.data.forEach(item => {
          if (item.key && item.value !== undefined) {
            dataObject[item.key] = item.value;
          }
        });

        // Extract user information from the data
        const userInfo = extractUserInfo(dataObject);
        
        flattenedData[credentialName] = {
          id: credential.issuerApplicationInstanceId || '',
          type: credential.type || '',
          verificationStatus: credential.verificationStatus || '',
          issuerName: credential.issuerName || '',
          issuerId: credential.issuerId || '',
          data: dataObject,
          userInfo
        };

        console.log(`✅ Flattened credential "${credentialName}":`, flattenedData[credentialName]);
        console.log(`👤 Extracted user info:`, userInfo);
      } else {
        console.warn(`⚠️ Skipping credential ${index + 1} - no type found:`, credential);
      }
    });

    console.log('🎯 Final flattened credential data:', flattenedData);
    return flattenedData;
  } catch (error) {
    console.error('❌ Error flattening credential data:', error);
    console.error('🔍 Credential data that caused error:', credentialData);
    return {};
  }
}

// Extract user information from credential data
function extractUserInfo(data: Record<string, string>) {
  const userInfo: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    street?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    birthdate?: string;
    age?: number;
    accountNumber?: string;
    sortCode?: string;
    creditScore?: number;
    annualIncome?: number;
  } = {};

  try {
    // Extract name information
    userInfo.firstName = data['First Name'] || data['firstName'] || '';
    userInfo.lastName = data['Last Name'] || data['lastName'] || '';
    
    // Create full name
    if (userInfo.firstName && userInfo.lastName) {
      userInfo.fullName = `${userInfo.firstName} ${userInfo.lastName}`;
    } else if (userInfo.firstName) {
      userInfo.fullName = userInfo.firstName;
    } else if (userInfo.lastName) {
      userInfo.fullName = userInfo.lastName;
    }

    // Extract address information
    userInfo.street = data['Street'] || data['street'] || '';
    userInfo.city = data['City'] || data['city'] || '';
    userInfo.postalCode = data['Postal Code'] || data['postalCode'] || '';
    
    // Create full address
    const addressParts = [userInfo.street, userInfo.city, userInfo.postalCode].filter(Boolean);
    if (addressParts.length > 0) {
      userInfo.address = addressParts.join(', ');
    }

    // Extract birthdate and calculate age
    const birthdateStr = data['Birthdate'] || data['birthdate'] || '';
    if (birthdateStr) {
      userInfo.birthdate = birthdateStr;
      try {
        const birthDate = new Date(birthdateStr);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          userInfo.age = age - 1;
        } else {
          userInfo.age = age;
        }
      } catch {
        console.warn('⚠️ Could not parse birthdate:', birthdateStr);
      }
    }

    // Extract financial information
    userInfo.accountNumber = data['Account Number'] || data['accountNumber'] || '';
    userInfo.sortCode = data['Sort Code'] || data['sortCode'] || '';
    
    const creditScoreStr = data['Credit Score'] || data['creditScore'] || '';
    if (creditScoreStr) {
      userInfo.creditScore = parseInt(creditScoreStr, 10);
    }
    
    const annualIncomeStr = data['Annual Income'] || data['annualIncome'] || '';
    if (annualIncomeStr) {
      userInfo.annualIncome = parseInt(annualIncomeStr, 10);
    }

    console.log('👤 Extracted user information:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('❌ Error extracting user info:', error);
    return userInfo;
  }
}

// Check verification status for polling
export async function checkVerificationStatus(
  accessToken: string,
  environmentId: string,
  sessionId: string
): Promise<{
  verificationStatus: VerificationStatusResponse;
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
}> {
  const statusUrl = `${API_CONFIG.pingOne.apiPath}/environments/${environmentId}/presentationSessions/${sessionId}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status check failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: VerificationStatusResponse = await response.json();
    
    // Validate response structure
    if (!data.id || !data.status) {
      throw new Error('Invalid status response: missing required fields');
    }

    let extractedUserInfo: {
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
    } | undefined = undefined;

    // If verification is successful, fetch credential data in parallel
    if (data.status === 'VERIFICATION_SUCCESSFUL') {
      console.log('🎉 Verification successful! Fetching credential data...');
      console.log('📋 Session details:', {
        sessionId: data.id,
        environmentId: data.environment?.id,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt
      });

      // Make parallel call to get credential data
      getCredentialData(accessToken, environmentId, sessionId)
        .then((credentialResponse) => {
          console.log('✅ Credential data API call successful');
          console.log('📥 Credential data API response:', credentialResponse);
          
          // Check if we got VERIFICATION_SUCCESSFUL from the credential data
          const verificationStatus = credentialResponse.status || 'Status not found in expected location';
          console.log('🔍 Credential verification status:', verificationStatus);
          
          // Flatten the credential data
          const flattenedCredentialData = flattenCredentialData(credentialResponse);
          console.log('📊 Flattened credential data:', flattenedCredentialData);
          
          // Log the flattened data in the required format
          console.log('🎯 Credential data in required format:');
          if (Object.keys(flattenedCredentialData).length === 0) {
            console.warn('⚠️ No credentials were flattened - check the response structure above');
          } else {
            Object.entries(flattenedCredentialData).forEach(([credentialName, data]) => {
              console.log(`📋 ${credentialName}:`, {
                id: data.id,
                type: data.type,
                verificationStatus: data.verificationStatus,
                issuerName: data.issuerName,
                issuerId: data.issuerId,
                data: data.data
              });
            });
          }
        })
        .catch((error) => {
          console.error('❌ Error fetching credential data:', error);
          console.error('🔍 Error details:', {
            message: error.message,
            stack: error.stack,
            sessionId,
            environmentId,
            hasAccessToken: !!accessToken
          });
        });

      // Also fetch credential data synchronously to return user info
      try {
        const credentialResponse = await getCredentialData(accessToken, environmentId, sessionId);
        const flattenedCredentialData = flattenCredentialData(credentialResponse);
        
        // Extract user info from the first credential
        const firstCredential = Object.values(flattenedCredentialData)[0];
        if (firstCredential?.userInfo) {
          extractedUserInfo = firstCredential.userInfo;
          console.log('👤 Extracted user info for UI:', extractedUserInfo);
        }
      } catch (credentialError) {
        console.error('❌ Error fetching credential data for UI:', credentialError);
      }
    }

    return {
      verificationStatus: data,
      userInfo: extractedUserInfo
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Status check request timed out');
      }
      throw new Error(`Failed to check verification status: ${error.message}`);
    }
    throw new Error('Failed to check verification status: Unknown error');
  }
}

// Credit card application specific functions
export async function submitCreditCardApplication(
  userInfo: any,
  creditCardType: 'classic' | 'gold' | 'platinum' | 'signature'
): Promise<CreditCardApplication> {
  // Simulate credit card application submission
  const application: CreditCardApplication = {
    id: `app_${Date.now()}`,
    userId: userInfo.accountNumber || 'unknown',
    status: 'pending',
    creditLimit: getCreditLimit(creditCardType, userInfo.creditScore || 0),
    cardType: creditCardType,
    annualFee: getAnnualFee(creditCardType),
    interestRate: getInterestRate(creditCardType, userInfo.creditScore || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return application;
}

export async function assessCreditEligibility(
  userInfo: any
): Promise<CreditAssessmentResult> {
  // Simulate credit assessment
  const creditScore = userInfo.creditScore || 650;
  const annualIncome = userInfo.annualIncome || 30000;
  
  const eligibility = creditScore >= 600 && annualIncome >= 25000;
  const riskLevel = creditScore >= 750 ? 'low' : creditScore >= 650 ? 'medium' : 'high';
  const decision = eligibility ? 'approve' : 'reject';
  
  const result: CreditAssessmentResult = {
    applicationId: `assess_${Date.now()}`,
    creditScore,
    eligibility,
    recommendedLimit: eligibility ? Math.min(annualIncome * 0.3, 10000) : 0,
    riskLevel,
    decision,
    reasons: eligibility ? ['Good credit score', 'Sufficient income'] : ['Credit score below threshold', 'Insufficient income']
  };

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return result;
}

// Helper functions for credit card application
function getCreditLimit(cardType: string, creditScore: number): number {
  const baseLimits = {
    classic: 1000,
    gold: 5000,
    platinum: 15000,
    signature: 25000
  };
  
  const multiplier = creditScore >= 750 ? 1.5 : creditScore >= 650 ? 1.2 : 1.0;
  return Math.round(baseLimits[cardType as keyof typeof baseLimits] * multiplier);
}

function getAnnualFee(cardType: string): number {
  const fees = {
    classic: 0,
    gold: 50,
    platinum: 150,
    signature: 300
  };
  return fees[cardType as keyof typeof fees];
}

function getInterestRate(cardType: string, creditScore: number): number {
  const baseRates = {
    classic: 18.99,
    gold: 16.99,
    platinum: 14.99,
    signature: 12.99
  };
  
  const reduction = creditScore >= 750 ? 2.0 : creditScore >= 650 ? 1.0 : 0;
  return Math.max(baseRates[cardType as keyof typeof baseRates] - reduction, 8.99);
}
