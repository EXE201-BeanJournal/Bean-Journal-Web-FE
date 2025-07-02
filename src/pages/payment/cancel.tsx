import { useNavigate, useSearch } from '@tanstack/react-router';
import { X, ArrowLeft, Home, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false });
  const { reason, payment_method } = searchParams as { reason?: string; payment_method?: string };

  const handleRetryPayment = () => {
    navigate({ to: '/pricing' });
  };

  const handleGoHome = () => {
    navigate({ to: '/' });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const getErrorMessage = () => {
    if (reason === 'user_cancelled') {
      return 'You cancelled the payment process.';
    }
    if (reason === 'payment_failed') {
      return 'Your payment could not be processed. Please try again.';
    }
    if (reason === 'expired') {
      return 'The payment session has expired. Please start over.';
    }
    return 'The payment was not completed.';
  };

  const getPaymentMethodName = () => {
    if (payment_method === 'momo') {
      return 'MoMo Wallet';
    }
    if (payment_method === 'stripe') {
      return 'Credit/Debit Card';
    }
    return 'the selected payment method';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {getErrorMessage()}
        </p>
        {payment_method && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Payment method: {getPaymentMethodName()}
          </p>
        )}

        {/* Help Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            What can you do next?
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Try a different payment method</li>
            <li>• Check your card details and try again</li>
            <li>• Contact your bank if the payment was declined</li>
            <li>• Reach out to our support team for assistance</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={handleRetryPayment} className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            Try Payment Again
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Homepage
            </Button>
          </div>
        </div>

        {/* Support Information */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Need Help?
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            If you're experiencing issues with payment, our support team is here to help.
          </p>
          <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/contact' })} className="w-full">
              Contact Support
            </Button>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Email: support@beanjournal.com</p>
              <p>Response time: Usually within 24 hours</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          <p>Your account remains unchanged. No charges were made.</p>
          <p className="mt-1">
            You can continue using the free features while you resolve the payment issue.
          </p>
        </div>
      </div>
    </div>
  );
}