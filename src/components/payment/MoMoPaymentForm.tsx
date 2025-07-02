import React, { useState } from 'react';
import { Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import { momoPaymentService } from '../../services/momoPayment';

interface MoMoPaymentFormProps {
  amount: number;
  currency: string;
  orderId: string;
  onSuccess: (paymentData: { resultCode: number; payUrl?: string; message?: string }) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

const MoMoPaymentForm: React.FC<MoMoPaymentFormProps> = ({
  amount,
  currency,
  orderId,
  onSuccess,
  onError,
  onCancel
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validatePhoneNumber = (phone: string): boolean => {
    // Vietnamese phone number validation
    const phoneRegex = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as Vietnamese phone number
    if (cleaned.startsWith('84')) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      return '+84' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      return '+84' + cleaned;
    }
    
    return phone;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    // Clear phone number error when user starts typing
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: { [key: string]: string } = {};
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Vietnamese phone number';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsProcessing(true);
    setErrors({});
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Convert amount to VND if needed
      const amountInVND = currency === 'USD' ? amount * 23000 : amount;
      
      const paymentResponse = await momoPaymentService.createPayment({
        orderId,
        amount: amountInVND,
        orderInfo: `Bean Journal Subscription Payment`,
        redirectUrl: `${window.location.origin}/payment/success?payment_intent=${orderId}`,
        ipnUrl: `${import.meta.env.VITE_WEBHOOK_BASE_URL || 'https://your-backend.com'}/webhooks/momo`,
        extraData: JSON.stringify({
          phoneNumber: formattedPhone,
          originalCurrency: currency,
          originalAmount: amount
        })
      });
      
      if (paymentResponse.resultCode === 0) {
        // Redirect to MoMo payment page
        if (paymentResponse.payUrl) {
          window.location.href = paymentResponse.payUrl;
        } else {
          onSuccess(paymentResponse);
        }
      } else {
        onError(paymentResponse.message || 'Payment creation failed');
      }
    } catch (error) {
      console.error('MoMo payment error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const displayAmount = currency === 'USD' ? `${amount * 23000} VND` : `${amount} ${currency}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            MoMo Payment
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pay securely with your MoMo e-wallet
          </p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">Amount to pay:</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {displayAmount}
          </span>
        </div>
        {currency === 'USD' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Converted from ${amount} USD (approximate rate)
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="0901234567 or +84901234567"
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${
                errors.phoneNumber
                  ? 'border-red-300 dark:border-red-600'
                  : 'border-gray-300 dark:border-gray-600'
              }
            `}
            disabled={isProcessing}
          />
          {errors.phoneNumber && (
            <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.phoneNumber}</span>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Payment Process:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>You'll be redirected to MoMo payment page</li>
                <li>Complete payment using your MoMo app or account</li>
                <li>You'll be redirected back after payment</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isProcessing}
            className="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Pay with MoMo</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MoMoPaymentForm;