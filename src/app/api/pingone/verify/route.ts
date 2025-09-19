import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, API_TIMEOUTS } from '@/lib/config';

// Comprehensive PingOne verification endpoint
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'getToken':
        return await handleGetToken();
      
      case 'createPresentation':
        return await handleCreatePresentation(data);
      
      case 'getQRCode':
        return await handleGetQRCode(data);
      
      case 'checkStatus':
        return await handleCheckStatus(data);
      
      case 'getCredentialData':
        return await handleGetCredentialData(data);
      
      case 'issueCredential':
        return await handleIssueCredential(data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('PingOne API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get PingOne access token
async function handleGetToken() {
  try {
    console.log('🔑 Backend: Getting PingOne access token...');
    
    const tokenUrl = `https://auth.pingone.eu/${API_CONFIG.pingOne.environmentId}/as/token`;
    const formData = new URLSearchParams();
    formData.append('client_id', API_CONFIG.pingOne.clientId);
    formData.append('client_secret', API_CONFIG.pingOne.clientSecret);
    formData.append('grant_type', 'client_credentials');

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
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();
    console.log('✅ Backend: Access token received successfully');
    
    return NextResponse.json({
      success: true,
      data: tokenData
    });
  } catch (error) {
    console.error('❌ Backend: Token request failed:', error);
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
}

// Create presentation request
async function handleCreatePresentation(data: { accessToken: string; message?: string }) {
  try {
    console.log('📋 Backend: Creating presentation request...');
    
    const { accessToken, message } = data;
    const presentationUrl = `${API_CONFIG.pingOne.apiPath}/environments/${API_CONFIG.pingOne.environmentId}/presentationSessions`;
    
    console.log('🌐 Presentation URL:', presentationUrl);
    console.log('🔐 Access Token (first 20 chars):', accessToken.substring(0, 20) + '...');
    
    const presentationRequest = {
      message: message || "Please present your NatWest Current Account credentials for credit card application",
      protocol: 'OPENID4VP',
      digitalWalletApplication: {
        id: '428b26a1-8833-43de-824b-f1ed336c6245'
      },
      requestedCredentials: [
        {
          type: 'NatWest Current Account',
          keys: [
            'DOB',
            'CardType', 
            'Area',
            'First Name',
            'UserID',
            'Sort Code',
            'Street',
            'Postcode',
            'Country',
            'City',
            'Last Name',
            'Account Number'
          ]
        }
      ]
    };

    console.log('📤 Request Body:', JSON.stringify(presentationRequest, null, 2));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(presentationUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(presentationRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PingOne API Error Response:', errorText);
      throw new Error(`Presentation request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const presentationData = await response.json();
    console.log('✅ Backend: Presentation request created successfully');
    
    return NextResponse.json({
      success: true,
      data: presentationData
    });
  } catch (error) {
    console.error('❌ Backend: Presentation request failed:', error);
    return NextResponse.json(
      { error: 'Failed to create presentation request' },
      { status: 500 }
    );
  }
}

// Get QR code
async function handleGetQRCode(data: { qrCodeUrl: string }) {
  try {
    console.log('🔲 Backend: Getting QR code...');
    
    const { qrCodeUrl } = data;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(qrCodeUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`QR code request failed: ${response.status} ${response.statusText}`);
    }

    // QR code is an image (PNG), not JSON - just return the URL
    console.log('✅ Backend: QR code URL retrieved successfully');
    
    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: qrCodeUrl // Return the URL directly, frontend will use it as image src
      }
    });
  } catch (error) {
    console.error('❌ Backend: QR code request failed:', error);
    return NextResponse.json(
      { error: 'Failed to get QR code' },
      { status: 500 }
    );
  }
}

// Check verification status
async function handleCheckStatus(data: { accessToken: string; environmentId: string; sessionId: string }) {
  try {
    console.log('🔍 Backend: Checking verification status...');
    
    const { accessToken, environmentId, sessionId } = data;
    const statusUrl = `${API_CONFIG.pingOne.apiPath}/environments/${environmentId}/presentationSessions/${sessionId}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
    }

    const statusData = await response.json();
    console.log('✅ Backend: Status checked successfully');
    console.log('📊 Status Response Structure:', JSON.stringify(statusData, null, 2));
    
    // If verification is successful, fetch and log credential data
    if (statusData.status === 'VERIFICATION_SUCCESSFUL') {
      console.log('🎉 VERIFICATION SUCCESSFUL! Fetching credential data...');
      
      try {
        const credentialUrl = `${API_CONFIG.pingOne.apiPath}/environments/${environmentId}/presentationSessions/${sessionId}/credentialData`;
        console.log('🔍 Fetching credential data from:', credentialUrl);
        
        const credentialResponse = await fetch(credentialUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (credentialResponse.ok) {
          const credentialData = await credentialResponse.json();
          console.log('📋 ===== RECEIVED CREDENTIAL DATA =====');
          console.log('📋 Full Credential Response:', JSON.stringify(credentialData, null, 2));
          
          // Log individual attributes if they exist
          if (credentialData.credentials && Array.isArray(credentialData.credentials)) {
            console.log('📋 ===== INDIVIDUAL CREDENTIALS =====');
            credentialData.credentials.forEach((cred: any, index: number) => {
              console.log(`📋 Credential ${index + 1}:`, JSON.stringify(cred, null, 2));
            });
          }
          
          // Log specific requested attributes
          const requestedAttributes = [
            'DOB', 'CardType', 'Area', 'First Name', 'UserID',
            'Sort Code', 'Street', 'Postcode', 'Country', 'City',
            'Last Name', 'Account Number'
          ];
          
          console.log('📋 ===== REQUESTED ATTRIBUTES STATUS =====');
          requestedAttributes.forEach(attr => {
            const found = JSON.stringify(credentialData).includes(attr);
            console.log(`📋 ${attr}: ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
          });
          
          console.log('📋 ===== END CREDENTIAL DATA =====');
          
          // Extract and flatten the credential data for frontend
          let flattenedUserInfo: { [key: string]: any } = {};
          
          // Extract and flatten the credential data for frontend
          if (credentialData.sessionData && credentialData.sessionData.credentialsDataList && credentialData.sessionData.credentialsDataList.length > 0) {
            const credentials = credentialData.sessionData.credentialsDataList[0];
            if (credentials.data && Array.isArray(credentials.data)) {
              credentials.data.forEach((item: any) => {
                flattenedUserInfo[item.key] = item.value;
              });
            }
          }
          // Fallback: check if data is directly in credentialsDataList
          else if (credentialData.credentialsDataList && credentialData.credentialsDataList.length > 0) {
            const credentials = credentialData.credentialsDataList[0];
            if (credentials.data && Array.isArray(credentials.data)) {
              credentials.data.forEach((item: any) => {
                flattenedUserInfo[item.key] = item.value;
              });
            }
          }
          // Fallback: check if data is directly in data array
          else if (credentialData.data && Array.isArray(credentialData.data)) {
            credentialData.data.forEach((item: any) => {
              flattenedUserInfo[item.key] = item.value;
            });
          }
          
          console.log('📋 ===== FLATTENED USER INFO =====');
          console.log('📋 Flattened Data:', JSON.stringify(flattenedUserInfo, null, 2));
          console.log('📋 ===== END FLATTENED USER INFO =====');
          
          return NextResponse.json({
            success: true,
            data: {
              verificationStatus: statusData,
              userInfo: flattenedUserInfo // Send flattened data to frontend
            }
          });
        } else {
          console.error('❌ Failed to fetch credential data:', credentialResponse.status, credentialResponse.statusText);
        }
      } catch (credError) {
        console.error('❌ Error fetching credential data:', credError);
      }
    }
    
    // Return the response in the expected format for the frontend
    return NextResponse.json({
      success: true,
      data: {
        verificationStatus: statusData, // Wrap the response in verificationStatus
        userInfo: null // Will be populated if verification is successful
      }
    });
  } catch (error) {
    console.error('❌ Backend: Status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}

// Get credential data
async function handleGetCredentialData(data: { accessToken: string; environmentId: string; sessionId: string }) {
  try {
    console.log('📄 Backend: Getting credential data...');
    
    const { accessToken, environmentId, sessionId } = data;
    const credentialUrl = `${API_CONFIG.pingOne.apiPath}/environments/${environmentId}/presentationSessions/${sessionId}/credentialData`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(credentialUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Credential data request failed: ${response.status} ${response.statusText}`);
    }

    const credentialData = await response.json();
    console.log('✅ Backend: Credential data retrieved successfully');
    
    return NextResponse.json({
      success: true,
      data: credentialData
    });
  } catch (error) {
    console.error('❌ Backend: Credential data request failed:', error);
    return NextResponse.json(
      { error: 'Failed to get credential data' },
      { status: 500 }
    );
  }
}

// Issue credential to user after successful verification
async function handleIssueCredential(data: { accessToken: string; userId: string }) {
  try {
    console.log('🎫 Backend: Issuing credential to user...');
    
    const { accessToken, userId } = data;
    const issueUrl = `${API_CONFIG.pingOne.apiPath}/environments/${API_CONFIG.pingOne.environmentId}/users/${userId}/credentials`;
    
    console.log('🎫 Issue URL:', issueUrl);
    console.log('🎫 User ID:', userId);
    
    const credentialRequest = {
      credentialType: {
        id: "f5bf1763-50f6-474b-8d8e-b6c65e5e816f"
      },
      data: {}
    };
    
    console.log('🎫 Request Body:', JSON.stringify(credentialRequest, null, 2));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    const response = await fetch(issueUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentialRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PingOne Credential Issue Error Response:', errorText);
      throw new Error(`Credential issuance failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const credentialData = await response.json();
    console.log('✅ Backend: Credential issued successfully');
    console.log('🎫 Credential Response:', JSON.stringify(credentialData, null, 2));
    
    return NextResponse.json({
      success: true,
      data: credentialData
    });
  } catch (error) {
    console.error('❌ Backend: Credential issuance failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue credential' },
      { status: 500 }
    );
  }
}
