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
  assessCreditEligibility,
  issueCredential
} from '@/lib/backend-api';
import type { 
  QRCodeResponse, 
  CreditCardApplication, 
  CreditAssessmentResult 
} from '@/types/api';
import Link from 'next/link';

type VerificationStep = 'initial' | 'manual_form' | 'qr_display' | 'verifying' | 'completed' | 'failed';

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
  const [customerStatus, setCustomerStatus] = useState<'existing' | 'new' | null>(null);
  const [manualFormData, setManualFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    dateOfBirth: '',
    employmentStatus: '',
    annualIncome: ''
  });

  // Utility function to mask account number
  const maskAccountNumber = (accountNumber: string | undefined): string => {
    if (!accountNumber) return 'N/A';
    if (accountNumber.length <= 4) return '****';
    return `****${accountNumber.slice(-4)}`;
  };

  // Utility function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string | undefined): { age: number; isAdult: boolean } => {
    if (!dateOfBirth) return { age: 0, isAdult: false };
    
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      return {
        age: Math.max(0, age), // Ensure age is not negative
        isAdult: age >= 18
      };
    } catch (error) {
      console.error('Error calculating age:', error);
      return { age: 0, isAdult: false };
    }
  };
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
    
    // Enhanced logging for successful verification
    if (status === 'approved') {
      console.log('🎉 ===== COMPONENT: VERIFICATION SUCCESSFUL =====');
      console.log('🎉 Status:', status);
      console.log('🎉 Full Data Object:', JSON.stringify(data, null, 2));
      console.log('🎉 Extracted User Info:', JSON.stringify(extractedUserInfo, null, 2));
      
      // Log all available properties in the data object
      if (data) {
        console.log('🎉 ===== DATA OBJECT PROPERTIES =====');
        Object.keys(data).forEach(key => {
          console.log(`🎉 ${key}:`, data[key]);
        });
        console.log('🎉 ===== END DATA OBJECT PROPERTIES =====');
      }
      
      // Log all available properties in the user info
    if (extractedUserInfo) {
        console.log('🎉 ===== USER INFO PROPERTIES =====');
        Object.keys(extractedUserInfo).forEach(key => {
          console.log(`🎉 ${key}:`, (extractedUserInfo as any)[key]);
        });
        console.log('🎉 ===== END USER INFO PROPERTIES =====');
      }
      
      console.log('🎉 ===== END COMPONENT VERIFICATION SUCCESS =====');
    }
    
    if (extractedUserInfo) {
      console.log('🎉 ===== USER DATA RECEIVED IN COMPONENT =====');
      console.log('🎉 Raw User Info:', JSON.stringify(extractedUserInfo, null, 2));
      
      // Extract and log individual fields
      const userData = {
        firstName: (extractedUserInfo as any)['First Name'],
        lastName: (extractedUserInfo as any)['Last Name'],
        fullName: (extractedUserInfo as any)['First Name'] && (extractedUserInfo as any)['Last Name'] 
          ? `${(extractedUserInfo as any)['First Name']} ${(extractedUserInfo as any)['Last Name']}` 
          : null,
        address: (extractedUserInfo as any).Street && (extractedUserInfo as any).City && (extractedUserInfo as any).Postcode && (extractedUserInfo as any).Country
          ? `${(extractedUserInfo as any).Street}, ${(extractedUserInfo as any).City}, ${(extractedUserInfo as any).Postcode}, ${(extractedUserInfo as any).Country}`
          : null,
        accountNumber: maskAccountNumber((extractedUserInfo as any)['Account Number']),
        sortCode: (extractedUserInfo as any)['Sort Code'],
        dob: (extractedUserInfo as any).DOB,
        userId: (extractedUserInfo as any).UserID,
        cardType: (extractedUserInfo as any).CardType,
        area: (extractedUserInfo as any).Area
      };
      
      console.log('🎉 Processed User Data:', JSON.stringify(userData, null, 2));
      console.log('🎉 ===== END USER DATA =====');
      
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

  const handleCredentialIssuance = async () => {
    console.log('🎫 Frontend: Issuing credential after successful verification...');
    console.log('🎫 Frontend: User info:', userInfo);
    console.log('🎫 Frontend: Verification data:', verificationData);
    if (!userInfo || !verificationData?.accessToken) return;
    
    try {
      console.log('🎫 Frontend: Issuing credential after successful verification...');
      const userId = (userInfo as any).UserID;
      
      if (!userId) {
        console.error('❌ Frontend: No UserID found in user info');
        return;
      }
      
      const result = await issueCredential(verificationData.accessToken, userId);
      console.log('✅ Frontend: Credential issued successfully:', result);
    } catch (err) {
      console.error('❌ Frontend: Error issuing credential:', err);
      // Don't set error state for credential issuance failure - it's not critical
    }
  };

  const handleCreditAssessment = async () => {
    if (!userInfo) return;

    try {
      setIsLoading(true);
      
      // Check age eligibility for existing customers
      const ageInfo = calculateAge((userInfo as any).DOB);
      if (ageInfo.age > 0 && !ageInfo.isAdult) {
        setError('You must be 18 or older to apply for a credit card. Please contact customer service.');
        setIsLoading(false);
        return;
      }
      
      // Issue credential after successful verification (only for existing customers)
      if (customerStatus === 'existing') {
        await handleCredentialIssuance();
      }
      
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

  const handleManualFormSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Check age eligibility
      const ageInfo = calculateAge(manualFormData.dateOfBirth);
      if (ageInfo.age > 0 && !ageInfo.isAdult) {
        setError('You must be 18 or older to apply for a credit card. Please check your date of birth.');
        setIsLoading(false);
        return;
      }
      
      // Create user info from manual form data
      const formUserInfo = {
        firstName: manualFormData.firstName,
        lastName: manualFormData.lastName,
        fullName: `${manualFormData.firstName} ${manualFormData.lastName}`,
        address: `${manualFormData.address}, ${manualFormData.city}, ${manualFormData.postcode}`,
        city: manualFormData.city,
        postalCode: manualFormData.postcode,
        birthdate: manualFormData.dateOfBirth,
        email: manualFormData.email,
        phone: manualFormData.phone,
        employmentStatus: manualFormData.employmentStatus,
        annualIncome: manualFormData.annualIncome
      };
      
      // Assess credit eligibility for new customer
      const assessmentResult = await assessCreditEligibility(formUserInfo);
      setAssessment(assessmentResult);
      
      if (assessmentResult.eligibility) {
        // Submit credit card application
        const appResult = await submitCreditCardApplication(formUserInfo, creditCardType);
        setApplication(appResult);
      }
      
      setCurrentStep('completed');
    } catch (err) {
      console.error('Error submitting manual form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
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
    setCustomerStatus(null);
    setManualFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postcode: '',
      dateOfBirth: '',
      employmentStatus: '',
      annualIncome: ''
    });
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

  // Issue credential when userInfo becomes available after successful verification (only for existing customers)
  useEffect(() => {
    if (userInfo && currentStep === 'completed' && verificationData?.accessToken && customerStatus === 'existing') {
      console.log('🎫 Frontend: UserInfo available, issuing credential...');
      handleCredentialIssuance();
    }
  }, [userInfo, currentStep, verificationData?.accessToken, customerStatus]);

  const getStepContent = () => {
    switch (currentStep) {
      case 'manual_form':
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
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center"
            >
              <FileText className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold text-purple-900 mb-4"
            >
              Personal Information
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
            >
              Please provide your details to complete your credit card application
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-[90%] mx-auto">
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={manualFormData.firstName}
                    onChange={(e) => setManualFormData({...manualFormData, firstName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={manualFormData.lastName}
                    onChange={(e) => setManualFormData({...manualFormData, lastName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={manualFormData.email}
                    onChange={(e) => setManualFormData({...manualFormData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={manualFormData.phone}
                    onChange={(e) => setManualFormData({...manualFormData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={manualFormData.address}
                    onChange={(e) => setManualFormData({...manualFormData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={manualFormData.city}
                    onChange={(e) => setManualFormData({...manualFormData, city: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    value={manualFormData.postcode}
                    onChange={(e) => setManualFormData({...manualFormData, postcode: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={manualFormData.dateOfBirth}
                    onChange={(e) => setManualFormData({...manualFormData, dateOfBirth: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Status *
              </label>
              <select
                    value={manualFormData.employmentStatus}
                    onChange={(e) => setManualFormData({...manualFormData, employmentStatus: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select employment status</option>
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self-employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="student">Student</option>
                    <option value="retired">Retired</option>
              </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Income (£) *
                  </label>
                  <input
                    type="number"
                    value={manualFormData.annualIncome}
                    onChange={(e) => setManualFormData({...manualFormData, annualIncome: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your annual income"
                    required
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex justify-between items-center space-x-4 w-[80%] mx-auto"
            >
                             <Button
                variant="outline"
                onClick={() => setCurrentStep('initial')}
                className="border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-semibold"
              >
                Back
              </Button>
              
              <Button
                onClick={handleManualFormSubmit}
                 disabled={isLoading}
                 size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isLoading ? (
                   <motion.div
                     animate={{ rotate: 360 }}
                     transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  'Submit Application'
                )}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8"
            >
              <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Home
              </Link>
                   </motion.div>
          </motion.div>
        );

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
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center"
            >
              <CreditCard className="w-10 h-10 text-white" />
            </motion.div>
            

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-purple-900 mb-4">
                Do you bank with us already?
              </h2>
              <p className="text-gray-600 mb-6 w-[80%] mx-auto">
                Let us know if you already have a current account, savings account, credit card or mortgage with NatWest
              </p>
              
              <div className="space-y-4 w-[70%] mx-auto">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="customerStatus"
                    value="existing"
                    checked={customerStatus === 'existing'}
                    onChange={(e) => setCustomerStatus(e.target.value as 'existing' | 'new')}
                    className="w-5 h-5 text-purple-600 border-purple-300 focus:ring-purple-500"
                  />
                  <span className="text-gray-700 font-medium">I'm an existing NatWest customer</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="customerStatus"
                    value="new"
                    checked={customerStatus === 'new'}
                    onChange={(e) => setCustomerStatus(e.target.value as 'existing' | 'new')}
                    className="w-5 h-5 text-purple-600 border-purple-300 focus:ring-purple-500"
                  />
                  <span className="text-gray-700 font-medium">I'm new to NatWest</span>
                </label>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex justify-between items-center space-x-4 w-[80%] mx-auto"
            >
              <Button
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-semibold"
              >
                Previous
              </Button>
              
              <Button
                onClick={() => {
                  if (customerStatus === 'new') {
                    setCurrentStep('manual_form');
                  } else {
                    handleStartVerification();
                  }
                }}
                disabled={isLoading || !customerStatus}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  'Next'
                 )}
               </Button>
            </motion.div>


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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8"
            >
              <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
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
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center"
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
               className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center"
             >
               <Zap className="w-10 h-10 text-white" />
             </motion.div>

             <motion.h2
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: 0.2 }}
               className="text-2xl font-bold text-gray-900 mb-4"
             >
               Verifying Your Identity And Checking Eligibility
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
                     className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full"
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
              className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              Credit card has been issued!
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
                      <span className="font-medium">
                        {(userInfo as any)['First Name'] && (userInfo as any)['Last Name'] 
                          ? `${(userInfo as any)['First Name']} ${(userInfo as any)['Last Name']}` 
                          : userInfo.fullName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium">
                        {(userInfo as any).Street && (userInfo as any).City && (userInfo as any).Postcode && (userInfo as any).Country
                          ? `${(userInfo as any).Street}, ${(userInfo as any).City}, ${(userInfo as any).Postcode}, ${(userInfo as any).Country}`
                          : userInfo.address || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Account Number:</span>
                        <span className="font-medium">
                          {maskAccountNumber((userInfo as any)['Account Number'])}
                        </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sort Code:</span>
                      <span className="font-medium">{(userInfo as any)['Sort Code'] || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age Status:</span>
                      <span className={`font-medium ${(() => {
                        const ageInfo = calculateAge((userInfo as any).DOB);
                        return ageInfo.isAdult ? 'text-green-600' : 'text-red-600';
                      })()}`}>
                        {(() => {
                          const ageInfo = calculateAge((userInfo as any).DOB);
                          return ageInfo.age > 0 ? (ageInfo.isAdult ? '18+ (Eligible)' : 'Under 18 (Not Eligible)') : 'N/A';
                        })()}
                      </span>
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
                <Card className={`max-w-md mx-auto ${assessment.eligibility ? 'border-purple-200 bg-purple-50' : 'border-red-200 bg-red-50'}`}>
                  <CardHeader>
                    <CardTitle className={`text-lg ${assessment.eligibility ? 'text-purple-800' : 'text-red-800'}`}>
                      Credit Assessment Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Decision:</span>
                      <span className={`font-medium ${assessment.eligibility ? 'text-purple-600' : 'text-red-600'}`}>
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
                <Card className="max-w-md mx-auto border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-purple-800">Application Submitted</CardTitle>
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
              <div className="text-sm text-purple-600 font-medium">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Your credit card application has been successfully processed!
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {customerStatus === 'new' 
                  ? "Your credit card will be delivered to you in 3-5 business days. Activation details will be sent to your email shortly."
                  : "Your credit card will be issued to you with in 5-10 minutes."
                }
              </div>
              
              <Button
                onClick={handleRetry}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        

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
            <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Home
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
