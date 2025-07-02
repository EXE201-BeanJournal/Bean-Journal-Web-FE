import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { momoPaymentService } from '../../../services/momoPayment';

export default function MoMoCallback() {
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
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
        } = router.query;

        // Validate required parameters
        if (!orderId || !resultCode) {
          setError('Invalid callback parameters');
          setProcessing(false);
          return;
        }

        // Verify signature
        const isValidSignature = momoPaymentService.verifyIPNSignature({
          partnerCode: partnerCode as string,
          orderId: orderId as string,
          requestId: requestId as string,
          amount: amount as string,
          orderInfo: orderInfo as string,
          orderType: orderType as string,
          transId: transId as string,
          resultCode: resultCode as string,
          message: message as string,
          payType: payType as string,
          responseTime: responseTime as string,
          extraData: extraData as string,
          signature: signature as string
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
          router.replace({
            pathname: '/payment/success',
            query: {
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

          router.replace({
            pathname: '/payment/cancel',
            query: {
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

    if (router.isReady) {
      handleCallback();
    }
  }, [router]);

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
            onClick={() => router.push('/pricing')}
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