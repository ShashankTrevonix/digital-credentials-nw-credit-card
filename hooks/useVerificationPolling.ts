import { useState, useEffect, useRef, useCallback } from 'react';
import { checkVerificationStatus } from '@/lib/api';
import type { VerificationStatus, NormalizedStatus, VerificationStatusResponse } from '@/types/api';

// Map PingOne statuses to normalized frontend statuses
const STATUS_MAP: Record<VerificationStatus, NormalizedStatus> = {
  'INITIAL': 'pending',
  'WAITING': 'scanned',
  'VERIFICATION_SUCCESSFUL': 'approved',
  'VERIFICATION_FAILED': 'failed',
  'VERIFICATION_EXPIRED': 'expired'
};

interface UseVerificationPollingOptions {
  accessToken: string;
  environmentId: string;
  sessionId: string;
  expiresAt: string;
  onStatusChange?: (status: NormalizedStatus, data: VerificationStatusResponse, userInfo?: any) => void;
  onError?: (error: Error) => void;
}

interface UseVerificationPollingReturn {
  status: NormalizedStatus;
  isLoading: boolean;
  error: Error | null;
  startPolling: () => void;
  stopPolling: () => void;
  reset: () => void;
}

export function useVerificationPolling({
  accessToken,
  environmentId,
  sessionId,
  expiresAt,
  onStatusChange,
  onError
}: UseVerificationPollingOptions): UseVerificationPollingReturn {
  const [status, setStatus] = useState<NormalizedStatus>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backoffTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());

  // Check if session has expired
  const isExpired = useCallback(() => {
    const now = Date.now();
    const expiryTime = new Date(expiresAt).getTime();
    return now >= expiryTime;
  }, [expiresAt]);

  // Check if overall timeout has been reached (2 minutes)
  const isTimedOut = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    const TWO_MINUTES = 2 * 60 * 1000; // 2 minutes in milliseconds
    return elapsed >= TWO_MINUTES;
  }, []);

  // Determine polling interval based on error count
  const getPollingInterval = useCallback(() => {
    if (consecutiveErrorsRef.current === 0) {
      return 2000; // 2 seconds initially
    } else if (consecutiveErrorsRef.current <= 3) {
      return 5000; // 5 seconds after transient errors
    } else {
      return 10000; // 10 seconds after multiple errors
    }
  }, []);

  // Check verification status
  const checkStatus = useCallback(async () => {
    // First check: ensure polling is still active
    if (!isPollingRef.current) {
      console.log('🛑 checkStatus called but polling is stopped, ignoring');
      return;
    }

    // Safety check: ensure we have all required parameters
    if (!accessToken || !environmentId || !sessionId) {
      console.error('Missing required parameters for polling:', { accessToken: !!accessToken, environmentId, sessionId });
      setError(new Error('Missing required parameters for verification check'));
      stopPolling();
      return;
    }

    if (isExpired() || isTimedOut()) {
      console.log('🛑 Session expired or timed out, stopping polling');
      stopPolling();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await checkVerificationStatus(accessToken, environmentId, sessionId);
      const rawStatus = response.verificationStatus.status;
      const normalizedStatus = STATUS_MAP[rawStatus];
      const userInfo = response.userInfo;

      // Reset error count on success
      consecutiveErrorsRef.current = 0;

      setStatus(normalizedStatus);
      onStatusChange?.(normalizedStatus, response.verificationStatus, userInfo);

      // Stop polling immediately on any terminal status (success or failure)
      if (['VERIFICATION_SUCCESSFUL', 'VERIFICATION_FAILED', 'VERIFICATION_EXPIRED'].includes(rawStatus)) {
        console.log('🛑 Terminal status reached, stopping polling:', rawStatus);
        stopPolling();
        return;
      }

      // Only continue polling for pending states
      if (['INITIAL', 'WAITING'].includes(rawStatus)) {
        console.log('⏳ Non-terminal status, continuing polling:', rawStatus);
        scheduleNextPoll();
      } else {
        console.log('⚠️ Unknown status, stopping polling:', rawStatus);
        stopPolling();
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);

      // Increment error count for backoff
      consecutiveErrorsRef.current++;

      // Check if we should stop polling due to too many errors
      if (consecutiveErrorsRef.current > 5) {
        setStatus('failed');
        stopPolling();
        return;
      }

      // Schedule next poll with backoff
      scheduleNextPoll();
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, environmentId, sessionId, onStatusChange, onError, isExpired, isTimedOut]);

  // Schedule next poll
  const scheduleNextPoll = useCallback(() => {
    if (!isPollingRef.current) {
      console.log('🛑 scheduleNextPoll called but polling is stopped, ignoring');
      return;
    }

    const interval = getPollingInterval();
    console.log('⏰ Scheduling next poll in', interval, 'ms');

    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setTimeout(() => {
      console.log('⏰ Scheduled poll timeout triggered');
      checkStatus();
    }, interval);
  }, [checkStatus, getPollingInterval]);

  // Start polling
  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      console.log('🔄 startPolling called but already polling, ignoring');
      return;
    }

    // Safety check: ensure we have all required parameters before starting
    if (!accessToken || !environmentId || !sessionId) {
      console.error('Cannot start polling: missing required parameters', { accessToken: !!accessToken, environmentId, sessionId });
      setError(new Error('Cannot start polling: missing required parameters'));
      return;
    }

    console.log('🚀 Starting polling with parameters:', { 
      hasAccessToken: !!accessToken, 
      environmentId, 
      sessionId 
    });
    
    isPollingRef.current = true;
    startTimeRef.current = Date.now();
    consecutiveErrorsRef.current = 0;
    setStatus('pending');
    setError(null);

    // Start immediately
    checkStatus();
  }, [checkStatus, accessToken, environmentId, sessionId]);

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log('🛑 stopPolling called, current polling state:', isPollingRef.current);
    isPollingRef.current = false;

    if (pollingIntervalRef.current) {
      console.log('🛑 Clearing polling interval timeout');
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (backoffTimeoutRef.current) {
      console.log('🛑 Clearing backoff timeout');
      clearTimeout(backoffTimeoutRef.current);
      backoffTimeoutRef.current = null;
    }
    
    console.log('🛑 Polling stopped successfully');
  }, []);

  // Reset hook state
  const reset = useCallback(() => {
    stopPolling();
    setStatus('pending');
    setError(null);
    setIsLoading(false);
    consecutiveErrorsRef.current = 0;
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Auto-stop on expiry or timeout
  useEffect(() => {
    if (isExpired() || isTimedOut()) {
      if (isExpired()) {
        setStatus('expired');
      } else {
        setStatus('timeout');
      }
      stopPolling();
    }
  }, [isExpired, isTimedOut, stopPolling]);

  // Reset hook when parameters change (but not on initial set)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (accessToken && environmentId && sessionId) {
      if (!hasInitializedRef.current) {
        // First time parameters are set, don't reset
        hasInitializedRef.current = true;
        console.log('Polling hook parameters first set:', { accessToken: !!accessToken, environmentId, sessionId });
      } else {
        // Parameters changed after initialization, reset
        console.log('Polling hook parameters updated, resetting state:', { accessToken: !!accessToken, environmentId, sessionId });
        reset();
      }
    }
  }, [accessToken, environmentId, sessionId, reset]);

  return {
    status,
    isLoading,
    error,
    startPolling,
    stopPolling,
    reset
  };
}
