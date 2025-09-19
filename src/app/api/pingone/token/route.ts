import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, API_TIMEOUTS } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 API Route: Getting PingOne access token...');
    
    // Use the correct baseUrl for OAuth2 token endpoint
    const tokenUrl = `https://auth.pingone.eu/${API_CONFIG.pingOne.environmentId}/as/token`;
    
    const formData = new URLSearchParams();
    formData.append('client_id', API_CONFIG.pingOne.clientId);
    formData.append('client_secret', API_CONFIG.pingOne.clientSecret);
    formData.append('grant_type', 'client_credentials');

    console.log('🌐 Token URL:', tokenUrl);
    console.log('🔐 Client ID:', API_CONFIG.pingOne.clientId);

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

    console.log('📥 Token response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token request failed:', errorText);
      return NextResponse.json(
        { error: `Token request failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Token obtained successfully');
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error in token API route:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Token request timed out' },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: `Failed to get access token: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get access token: Unknown error' },
      { status: 500 }
    );
  }
}
