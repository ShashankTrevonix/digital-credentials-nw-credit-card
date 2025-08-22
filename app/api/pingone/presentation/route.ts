import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, API_TIMEOUTS } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    console.log('🌐 API Route: Creating PingOne presentation request...');
    
    // Get the access token from the request body
    const { accessToken, message } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Use the exact same URL construction as the working app
    const presentationUrl = `${API_CONFIG.pingOne.apiPath}/environments/${API_CONFIG.pingOne.environmentId}/presentationSessions`;
    
    console.log('🌐 Presentation URL:', presentationUrl);
    console.log('🔐 Access Token (first 20 chars):', accessToken.substring(0, 20) + '...');
    
    // Use exact same structure as working app
    const presentationRequest = {
      message: message || "Please present your Digital ID for credit card application",
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

    console.log('📤 Request payload:', JSON.stringify(presentationRequest, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.pingOne);

    console.log('🚀 Making API call to PingOne primary endpoint...');
    
    // Use exact same headers as working app
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

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return NextResponse.json(
        { error: `Presentation request failed: ${response.status} ${response.statusText} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📥 Raw API response:', JSON.stringify(data, null, 2));
    
    // Use the exact same validation as working app
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

    console.log('✅ Validated presentation response:', {
      id: data.id,
      environmentId: data.environment.id,
      expiresAt: data.expiresAt,
      status: data.status
    });

    const result = {
      qrCodeUrl: data._links.qr.href,
      sessionId: data.id,
      status: data.status,
      rawResponse: data
    };

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Full error details:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Presentation request timed out' },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: `Failed to create presentation request: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create presentation request: Unknown error' },
      { status: 500 }
    );
  }
}
