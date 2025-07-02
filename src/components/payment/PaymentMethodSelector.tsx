import React, { useState } from 'react';
import { CreditCard, Smartphone, Check } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  currencies: string[];
}

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  currency?: string;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  currency = 'USD',
  className = ''
}) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      description: 'Pay securely with your credit or debit card',
      icon: <CreditCard className="w-6 h-6" />,
      enabled: true,
      currencies: ['USD', 'EUR', 'GBP']
    },
    {
      id: 'momo',
      name: 'MoMo Wallet',
      description: 'Pay with your MoMo e-wallet (Vietnam)',
      icon: (
        <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">M</span>
        </div>
      ),
      enabled: true,
      currencies: ['VND', 'USD']
    }
  ];

  const availableMethods = paymentMethods.filter(
    method => method.enabled && method.currencies.includes(currency)
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Choose Payment Method
      </h3>
      
      <div className="space-y-2">
        {availableMethods.map((method) => (
          <div
            key={method.id}
            className={`
              relative flex items-center p-4 border rounded-lg cursor-pointer transition-all
              ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            onClick={() => onMethodChange(method.id)}
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0">
                {method.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {method.name}
                  </h4>
                  {method.id === 'momo' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300">
                      Vietnam
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {method.description}
                </p>
              </div>
            </div>
            
            {selectedMethod === method.id && (
              <div className="flex-shrink-0">
                <Check className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {availableMethods.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No payment methods available for {currency}
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;