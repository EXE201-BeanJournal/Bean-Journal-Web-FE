import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useUser } from '@clerk/clerk-react';
import { Check, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { paymentService } from '../../services/paymentService';
import { UserSubscription } from '../../types/payment';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false });
  const { user } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const payment_intent = (searchParams as { payment_intent?: string }).payment_intent;
  const payment_method = (searchParams as { payment_method?: string }).payment_method;
  const order_id = (searchParams as { order_id?: string }).order_id;

  useEffect(() => {
    const confirmPayment = async () => {
      if (!user || (!payment_intent && !order_id)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // For MoMo payments, we need to confirm using order_id
        if (payment_method === 'momo' && order_id) {
          // The webhook should have already processed this, just fetch the subscription
          const userSub = await paymentService.getUserSubscription(user.id);
          setSubscription(userSub);
        } else if (payment_intent) {
          // For Stripe payments, confirm the payment intent
          const result = await paymentService.confirmPayment(
            payment_intent as string,
            (payment_method as string) || 'stripe'
          );
          setSubscription(result);
        }
      } catch (err) {
        console.error('Error confirming payment:', err);
        setError('Failed to confirm payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [user, payment_intent, payment_method, order_id]);

  const handleContinue = () => {
    navigate({ to: '/journal' });
  };

  const handleGoHome = () => {
    navigate({ to: '/' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 dark:text-red-400 text-2xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Confirmation Failed
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/contact' })} className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Thank you for your subscription. Your account has been upgraded successfully.
        </p>

        {/* Subscription Details */}
        {subscription && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Subscription Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {subscription.planId === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium text-green-600 dark:text-green-400 capitalize">
                  {subscription.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {subscription.paymentMethod === 'momo' ? 'MoMo Wallet' : 'Credit Card'}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Next Billing:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={handleContinue} className="w-full">
            Continue to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={handleGoHome} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Go to Homepage
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          <p>You will receive a confirmation email shortly.</p>
          <p className="mt-1">
            Need help? <a href="/contact" className="text-blue-500 hover:underline">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
}