'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Zap, 
  Globe,
  ArrowLeft,
  Clock,
  UserCheck,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVerificationPolling } from '@/hooks/useVerificationPolling';
import { 
  getPingOneAccessToken, 
  generateQRCode, 
  submitCreditCardApplication, 
  assessCreditEligibility 
} from '@/lib/api';
import type { 
  QRCodeResponse, 
  CreditCardApplication, 
  CreditAssessmentResult 
} from '@/types/api';
import Link from 'next/link';

type VerificationStep = 'initial' | 'qr_display' | 'verifying' | 'completed' | 'failed';

interface UserInfo {
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
}

export default function CreditCardApplication() {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('initial');
  const [qrCodeData, setQrCodeData] = useState<QRCodeResponse | null>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [creditCardType, setCreditCardType] = useState<'classic' | 'gold' | 'platinum' | 'signature'>('classic');
  const [application, setApplication] = useState<CreditCardApplication | null>(null);
  const [assessment, setAssessment] = useState<CreditAssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verification polling hook
  const {
    status: verificationStatus,
    isLoading: isPolling,
    error: pollingError,
    startPolling,
    stopPolling,
    reset: resetPolling
  } = useVerificationPolling({
    accessToken: verificationData?.accessToken || '',
    environmentId: verificationData?.environmentId || '',
    sessionId: qrCodeData?.sessionId || '',
    expiresAt: qrCodeData?.rawResponse?.expiresAt || '',
    onStatusChange: handleVerificationStatusChange,
    onError: handlePollingError
  });

  // Update polling hook when verification data changes
  useEffect(() => {
    if (verificationData?.accessToken && verificationData?.environmentId && qrCodeData?.sessionId) {
      console.log('Verification data updated, ensuring polling is active...');
      // Only start polling if it's not already active and we're not in a terminal state
      if (!isPolling && !['completed', 'failed'].includes(currentStep)) {
        startPolling();
      }
    }
  }, [verificationData, qrCodeData, currentStep, startPolling]);

  function handleVerificationStatusChange(
    status: string, 
    data: any, 
    extractedUserInfo?: UserInfo
  ) {
    console.log('Verification status changed:', status, data, extractedUserInfo);
    
    if (extractedUserInfo) {
      setUserInfo(extractedUserInfo);
    }

    // Handle different verification statuses
    if (status === 'scanned') {
      setCurrentStep('verifying');
    } else if (status === 'approved') {
      setCurrentStep('completed');
      // Automatically assess credit eligibility
      handleCreditAssessment();
    } else if (status === 'failed' || status === 'expired') {
      setCurrentStep('failed');
    }
  }

  function handlePollingError(error: Error) {
    console.error('Polling error:', error);
    setError(error.message);
    setCurrentStep('failed');
  }

  const handleStartVerification = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    resetPolling();

    try {
      // Step 1: Get access token
      console.log('Getting PingOne access token...');
      const tokenResponse = await getPingOneAccessToken();
      console.log('Access token received');

      // Step 2: Create presentation request and generate QR code
      console.log('Generating QR code...');
      const qrResponse = await generateQRCode(tokenResponse.access_token);
      console.log('QR code generated:', qrResponse);

      setQrCodeData(qrResponse);
      setVerificationData({
        accessToken: tokenResponse.access_token,
        environmentId: qrResponse.rawResponse?.environment?.id
      });
      setCurrentStep('qr_display');

      // Start polling for verification status
      console.log('Starting polling with data:', {
        accessToken: tokenResponse.access_token ? 'Present' : 'Missing',
        environmentId: qrResponse.rawResponse?.environment?.id || 'Missing',
        sessionId: qrResponse.sessionId || 'Missing',
        expiresAt: qrResponse.rawResponse?.expiresAt || 'Missing'
      });
      startPolling();

    } catch (err) {
      console.error('Error starting verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to start verification');
      setCurrentStep('failed');
    } finally {
      setIsLoading(false);
    }
  }, [startPolling, resetPolling]);

  const handleCreditAssessment = async () => {
    if (!userInfo) return;

    try {
      setIsLoading(true);
      const assessmentResult = await assessCreditEligibility(userInfo);
      setAssessment(assessmentResult);
      
      if (assessmentResult.eligibility) {
        // Submit credit card application
        const appResult = await submitCreditCardApplication(userInfo, creditCardType);
        setApplication(appResult);
      }
    } catch (err) {
      console.error('Error assessing credit eligibility:', err);
      setError(err instanceof Error ? err.message : 'Failed to assess credit eligibility');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setCurrentStep('initial');
    setQrCodeData(null);
    setVerificationData(null);
    setUserInfo(null);
    setApplication(null);
    setAssessment(null);
    setError(null);
    resetPolling();
    stopPolling();
  };

  // Handle timeout and session expiration
  const handleTimeout = useCallback(() => {
    setError('Verification session timed out. Please try again.');
    setCurrentStep('failed');
    stopPolling();
  }, [stopPolling]);

  // Add timeout effect
  useEffect(() => {
    if (currentStep === 'qr_display' || currentStep === 'verifying') {
      const timeoutId = setTimeout(() => {
        handleTimeout();
      }, 120000); // 2 minutes timeout

      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, handleTimeout]);

  const getStepContent = () => {
    switch (currentStep) {
      case 'initial':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
            >
              <CreditCard className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              NatWest Credit Card Application
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Apply for your credit card using secure digital identity verification. 
              Share your verified credentials to streamline the application process.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Credit Card Type
              </label>
              <select
                value={creditCardType}
                onChange={(e) => setCreditCardType(e.target.value as any)}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="classic">Classic Card</option>
                <option value="gold">Gold Card</option>
                <option value="platinum">Platinum Card</option>
                <option value="signature">Signature Card</option>
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="space-y-4"
            >
                             <Button
                 onClick={handleStartVerification}
                 disabled={isLoading}
                 size="lg"
                 className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold"
               >
                 {isLoading ? (
                   <motion.div
                     animate={{ rotate: 360 }}
                     transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                   >
                     <Clock className="w-5 h-5 mr-2" />
                   </motion.div>
                 ) : (
                   <>
                     <Sparkles className="w-5 h-5 mr-2" />
                     Start Digital Verification
                   </>
                 )}
               </Button>

               {isLoading && (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-sm text-gray-500"
                 >
                   <Zap className="w-4 h-4 inline mr-1" />
                   Initializing verification system...
                 </motion.div>
               )}
              
              <div className="text-sm text-gray-500">
                <Lock className="w-4 h-4 inline mr-1" />
                Your data is encrypted and secure
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8"
            >
              <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Home
              </Link>
            </motion.div>
          </motion.div>
        );

      case 'qr_display':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
            >
              <Globe className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              Scan QR Code with Your NatWest App
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              Use your mobile camera to scan this QR code and complete the verification in your NatWest app.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-6"
            >
              {qrCodeData?.qrCodeUrl && (
                <div className="inline-block p-4 bg-white rounded-lg shadow-lg">
                  <img
                    src={qrCodeData.qrCodeUrl}
                    alt="QR Code for verification"
                    className="w-48 h-48"
                  />
                </div>
              )}
            </motion.div>

                         <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.6 }}
               className="space-y-4"
             >
               <div className="text-sm text-gray-500">
                 <Clock className="w-4 h-4 inline mr-1" />
                 {isPolling ? 'Waiting for verification...' : 'Ready to scan'}
               </div>
               
               {/* Debug info */}
               <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-50 rounded">
                 <div>Status: {verificationStatus}</div>
                 <div>Polling: {isPolling ? 'Active' : 'Inactive'}</div>
                 <div>Session ID: {qrCodeData?.sessionId ? 'Present' : 'Missing'}</div>
                 <div>Access Token: {verificationData?.accessToken ? 'Present' : 'Missing'}</div>
               </div>
               
               <div className="text-xs text-gray-400">
                 <Lock className="w-3 h-3 inline mr-1" />
                 Session expires in 2 minutes
               </div>
               
               <Button
                 onClick={handleRetry}
                 variant="outline"
                 className="border-gray-300 text-gray-700 hover:bg-gray-50"
               >
                 <ArrowLeft className="w-4 h-4 mr-2" />
                 Start Over
               </Button>
             </motion.div>
          </motion.div>
        );

             case 'verifying':
         return (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="text-center"
           >
             <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center"
             >
               <Zap className="w-10 h-10 text-white" />
             </motion.div>

             <motion.h2
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="text-2xl font-bold text-gray-900 mb-4"
             >
               Verifying Your Identity
             </motion.h2>

             <motion.p
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.3 }}
               className="text-gray-600 mb-6"
             >
               Please complete the verification in your NatWest app. We're processing your credentials securely.
             </motion.p>

             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5, delay: 0.4 }}
               className="space-y-4"
             >
               <div className="text-sm text-gray-500">
                 <UserCheck className="w-4 h-4 inline mr-1" />
                 {verificationStatus === 'scanned' ? 'QR Code scanned - Approve in app' : 'Waiting for scan...'}
               </div>
               
               <div className="text-sm text-gray-500">
                 <Clock className="w-4 h-4 inline mr-1" />
                 Processing verification...
               </div>

               {/* Progress indicator */}
               <div className="w-full max-w-xs mx-auto">
                 <div className="w-full bg-gray-200 rounded-full h-2">
                   <motion.div
                     className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
                     initial={{ width: "0%" }}
                     animate={{ width: "100%" }}
                     transition={{ duration: 30, ease: "linear" }}
                   />
                 </div>
                 <p className="text-xs text-gray-500 mt-2">Verification in progress...</p>
               </div>
             </motion.div>
           </motion.div>
         );

      case 'completed':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              Identity Verification Successful!
            </motion.h2>

            {userInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-6"
              >
                <Card className="max-w-md mx-auto text-left">
                  <CardHeader>
                    <CardTitle className="text-lg">Verified Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{userInfo.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium">{userInfo.address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Score:</span>
                      <span className="font-medium">{userInfo.creditScore || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Income:</span>
                      <span className="font-medium">£{userInfo.annualIncome?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {assessment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mb-6"
              >
                <Card className={`max-w-md mx-auto ${assessment.eligibility ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${assessment.eligibility ? 'text-green-800' : 'text-red-800'}`}>
                      Credit Assessment Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Decision:</span>
                      <span className={`font-medium ${assessment.eligibility ? 'text-green-600' : 'text-red-600'}`}>
                        {assessment.decision.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className="font-medium">{assessment.riskLevel}</span>
                    </div>
                    {assessment.eligibility && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recommended Limit:</span>
                        <span className="font-medium">£{assessment.recommendedLimit.toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {application && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mb-6"
              >
                <Card className="max-w-md mx-auto border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">Application Submitted</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Card Type:</span>
                      <span className="font-medium capitalize">{application.cardType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span className="font-medium">£{application.creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Fee:</span>
                      <span className="font-medium">£{application.annualFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium">{application.interestRate}%</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="space-y-4"
            >
              <div className="text-sm text-green-600 font-medium">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Your credit card application has been successfully processed!
              </div>
              
              <Button
                onClick={handleRetry}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Apply for Another Card
              </Button>
            </motion.div>
          </motion.div>
        );

      case 'failed':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center"
            >
              <XCircle className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              Verification Failed
            </motion.h2>

                         <motion.p
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.4 }}
               className="text-gray-600 mb-6"
             >
               {error || 'Something went wrong during the verification process. Please try again.'}
             </motion.p>

             {pollingError && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: 0.45 }}
                 className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
               >
                 <p className="text-sm text-red-700">
                   <strong>Technical Error:</strong> {pollingError.message}
                 </p>
               </motion.div>
             )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="space-y-4"
            >
              <Button
                onClick={handleRetry}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </motion.div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-3">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">NatWest</h1>
          </div>
          <p className="text-lg text-gray-600">Digital Credit Card Application</p>
        </motion.div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {getStepContent()}
            </AnimatePresence>
          </CardContent>
        </Card>

        {currentStep !== 'initial' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-8"
          >
            <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Home
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
