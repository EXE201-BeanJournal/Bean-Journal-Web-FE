import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { momoPaymentService } from '../../../services/momoPayment';

export default function MoMoCallback() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false });
  const [, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const {
          partnerCode,
          orderId,
          requestId,
          amount,
          orderInfo,
          orderType,
          transId,
          resultCode,
          message,
          payType,
          responseTime,
          extraData,
          signature
        } = searchParams as Record<string, string>;

        // Validate required parameters
        if (!orderId || !resultCode) {
          setError('Invalid callback parameters');
          setProcessing(false);
          return;
        }

        // Verify signature
        const isValidSignature = await momoPaymentService.verifyIPN({
          partnerCode,
          orderId,
          requestId,
          amount: parseInt(amount),
          orderInfo,
          orderType,
          transId,
          resultCode: parseInt(resultCode),
          message,
          payType,
          responseTime: parseInt(responseTime),
          extraData,
          signature
        });

        if (!isValidSignature) {
          setError('Invalid payment signature');
          setProcessing(false);
          return;
        }

        // Check payment result
        const resultCodeNum = parseInt(resultCode as string);
        
        if (resultCodeNum === 0) {
          // Payment successful
          navigate({
            to: '/payment/success',
            search: {
              payment_method: 'momo',
              order_id: orderId,
              trans_id: transId
            }
          });
        } else {
          // Payment failed
          let reason = 'payment_failed';
          
          // Map MoMo result codes to user-friendly reasons
          switch (resultCodeNum) {
            case 1006:
              reason = 'user_cancelled';
              break;
            case 1001:
            case 1002:
              reason = 'payment_failed';
              break;
            case 1004:
              reason = 'expired';
              break;
            default:
              reason = 'payment_failed';
          }

          navigate({
            to: '/payment/cancel',
            search: {
              payment_method: 'momo',
              reason,
              message: message || 'Payment failed'
            }
          });
        }
      } catch (err) {
        console.error('Error processing MoMo callback:', err);
        setError('Failed to process payment callback');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 dark:text-red-400 text-2xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Processing Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate({ to: '/pricing' })}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Processing Your Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we verify your MoMo payment...
        </p>
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>This may take a few seconds.</p>
          <p>Please do not close this window.</p>
        </div>
      </div>
    </div>
  );
}