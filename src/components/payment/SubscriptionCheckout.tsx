import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import PaymentMethodSelector from './PaymentMethodSelector';
import StripePaymentForm from './StripePaymentForm';
import MoMoPaymentForm from './MoMoPaymentForm';
import { paymentService } from '../../services/paymentService';
import { SubscriptionPlan } from '../../types/payment';
import { useSupabase } from '../../contexts/SupabaseContext';

interface SubscriptionCheckoutProps {
  planId: string;
  onSuccess?: (subscription: { id: string; status: string; currentPeriodEnd: string }) => void;
  onCancel?: () => void;
  className?: string;
}

const SubscriptionCheckout: React.FC<SubscriptionCheckoutProps> = ({
  planId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { user } = useUser();
  const supabase = useSupabase();
  const [step, setStep] = useState<'plan' | 'payment-method' | 'payment'>('plan');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'momo'>('stripe');
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState<{
    clientSecret?: string;
    paymentIntentId?: string;
  }>({});

  useEffect(() => {
    const loadPlan = async () => {
      try {
        setLoading(true);
        if (!supabase) throw new Error('Supabase client is not initialized');
        const plans = await paymentService.getSubscriptionPlans(supabase);
        const selectedPlan = plans.find(p => p.id === planId);
        
        if (!selectedPlan) {
          setError('Subscription plan not found');
          return;
        }
        
        setPlan(selectedPlan);
      } catch (error) {
        console.error('Error loading plan:', error);
        setError('Failed to load subscription plan');
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [planId]);

  const handlePaymentMethodNext = async () => {
    if (!user || !plan || !supabase) {
      setError('User authentication or system initialization required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify user is properly authenticated
      if (!user.id) {
        throw new Error('User ID not available. Please sign in again.');
      }

      const userPhone = user.phoneNumbers?.[0]?.phoneNumber;
      const userEmail = user.emailAddresses?.[0]?.emailAddress || '';
      
      if (!userEmail) {
        throw new Error('Email address is required for subscription');
      }
      
      // For MoMo payments, we'll handle phone number collection in the payment form
      if (selectedPaymentMethod === 'momo') {
        // Just create a payment intent without phone number for now
        // The MoMo form will collect the phone number
        setPaymentData({
          paymentIntentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        setStep('payment');
        return;
      }
      
      // For Stripe payments, proceed as normal
      const result = await paymentService.createSubscriptionPayment(
        supabase,
        plan.id,
        selectedPaymentMethod,
        user.id,
        userEmail,
        userPhone
      );

      setPaymentData({
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId
      });

      setStep('payment');
    } catch (error) {
      console.error('Error creating payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
      
      // Provide more specific error messages for common authentication issues
      if (errorMessage.includes('User not authenticated') || errorMessage.includes('authentication')) {
        setError('Authentication error. Please sign out and sign in again, then try your subscription.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      if (!paymentData.paymentIntentId) {
        throw new Error('Payment intent ID not found');
      }

      if (!supabase) {
        throw new Error('System not properly initialized. Please refresh the page.');
      }

      const subscription = await paymentService.confirmPayment(
        supabase,
        paymentData.paymentIntentId
      );

      onSuccess?.(subscription);
    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
      
      // Provide more specific error messages for common authentication issues
      if (errorMessage.includes('User not authenticated') || errorMessage.includes('authentication')) {
        setError('Authentication error during payment confirmation. Please contact support.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleBack = () => {
    if (step === 'payment') {
      setStep('payment-method');
    } else if (step === 'payment-method') {
      setStep('plan');
    }
  };

  if (loading && !plan) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          {step !== 'plan' && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subscribe to {plan.name}
          </h1>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            step === 'plan' ? 'bg-blue-500' : 'bg-green-500'
          }`} />
          <div className={`w-8 h-0.5 ${
            ['payment-method', 'payment'].includes(step) ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <div className={`w-3 h-3 rounded-full ${
            step === 'payment-method' ? 'bg-blue-500' : 
            step === 'payment' ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <div className={`w-8 h-0.5 ${
            step === 'payment' ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <div className={`w-3 h-3 rounded-full ${
            step === 'payment' ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Step 1: Plan Review */}
      {step === 'plan' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Plan Details
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{plan.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    per {plan.interval}
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Features included:</h5>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => setStep('payment-method')}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment Method Selection */}
      {step === 'payment-method' && (
        <div className="space-y-6">
          <PaymentMethodSelector
            selectedMethod={selectedPaymentMethod}
            onMethodChange={(method) => setSelectedPaymentMethod(method as 'stripe' | 'momo')}
            currency={plan.currency}
          />
          
          <div className="flex space-x-3">
            <button
              onClick={handleBack}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={handlePaymentMethodNext}
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Continue to Payment</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && (
        <div className="space-y-6">
          {selectedPaymentMethod === 'stripe' && paymentData.clientSecret && (
            <StripePaymentForm
              amount={plan.price || 0}
              currency={plan.currency}
              clientSecret={paymentData.clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handleBack}
            />
          )}
          
          {selectedPaymentMethod === 'momo' && paymentData.paymentIntentId && (
            <MoMoPaymentForm
              amount={plan.price || 0}
              currency={plan.currency}
              orderId={paymentData.paymentIntentId}
              onSuccess={() => {
                handlePaymentSuccess();
              }}
              onError={handlePaymentError}
              onCancel={handleBack}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionCheckout;