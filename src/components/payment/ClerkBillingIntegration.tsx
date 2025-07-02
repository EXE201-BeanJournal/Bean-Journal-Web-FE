import React, { useState } from 'react';
import { PricingTable, useUser, useOrganization } from '@clerk/clerk-react';
import { Button } from '@/components/ui/Button';
import { Building2, User, CreditCard, Settings, ExternalLink } from 'lucide-react';

interface ClerkBillingIntegrationProps {
  className?: string;
}

export default function ClerkBillingIntegration({ className = '' }: ClerkBillingIntegrationProps) {
  const { user, isSignedIn } = useUser();
  const { organization } = useOrganization();
  const [billingMode, setBillingMode] = useState<'personal' | 'organization'>('personal');

  if (!isSignedIn) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Sign in to view pricing
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access our subscription plans and billing options.
          </p>
          <Button onClick={() => window.location.href = '/sign-in'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Billing Mode Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Choose Billing Type
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setBillingMode('personal')}
            className={`p-4 rounded-lg border-2 transition-all ${
              billingMode === 'personal'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center space-x-3">
              <User className={`w-6 h-6 ${
                billingMode === 'personal' ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <div className="text-left">
                <h3 className={`font-medium ${
                  billingMode === 'personal' ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}>
                  Personal Billing
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Individual subscription for personal use
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setBillingMode('organization')}
            disabled={!organization}
            className={`p-4 rounded-lg border-2 transition-all ${
              billingMode === 'organization'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            } ${!organization ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <Building2 className={`w-6 h-6 ${
                billingMode === 'organization' ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <div className="text-left">
                <h3 className={`font-medium ${
                  billingMode === 'organization' ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                }`}>
                  Organization Billing
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {organization ? `For ${organization.name}` : 'Join an organization first'}
                </p>
              </div>
            </div>
          </button>
        </div>

        {!organization && billingMode === 'organization' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              💡 You need to be part of an organization to use organization billing. 
              <a href="/organizations" className="underline hover:no-underline">
                Create or join an organization
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Clerk Pricing Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {billingMode === 'organization' ? 'Organization Plans' : 'Personal Plans'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Powered by Clerk's integrated billing system
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Settings className="w-4 h-4" />
              <span>Managed by Clerk</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <PricingTable
            forOrganizations={billingMode === 'organization'}
            appearance={{
              elements: {
                pricingTable: "w-full",
                pricingTableHeader: "text-center mb-8",
                pricingTableTitle: "text-2xl font-bold text-gray-900 dark:text-white",
                pricingTableSubtitle: "text-gray-600 dark:text-gray-400 mt-2",
                pricingTablePlan: "border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all duration-200",
                pricingTablePlanName: "text-lg font-semibold text-gray-900 dark:text-white",
                pricingTablePlanPrice: "text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2",
                pricingTablePlanDescription: "text-gray-600 dark:text-gray-400 mt-2 text-sm",
                pricingTablePlanFeatures: "mt-4 space-y-2",
                pricingTablePlanFeature: "flex items-start text-sm text-gray-700 dark:text-gray-300",
                pricingTablePlanButton: "w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              }
            }}
            ctaPosition="bottom"
            collapseFeatures={false}
            newSubscriptionRedirectUrl={`${window.location.origin}/dashboard?billing=success`}
            checkoutProps={{
              appearance: {
                elements: {
                  checkoutContainer: "bg-white dark:bg-gray-900",
                  checkoutHeader: "border-b border-gray-200 dark:border-gray-700",
                  checkoutTitle: "text-xl font-semibold text-gray-900 dark:text-white",
                  checkoutForm: "space-y-4",
                  checkoutButton: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                }
              }
            }}
            fallback={
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading pricing plans...</p>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Features and Benefits */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
          Why Choose Clerk Billing?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300">Integrated Payments</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">Seamless payment processing with your user accounts</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300">Self-Service Portal</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">Users can manage their subscriptions independently</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300">Automatic Invoicing</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">Professional invoices and receipt management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          Billing is securely handled by Clerk. 
          <a 
            href="https://clerk.com/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Learn more about Clerk Billing
          </a>
        </p>
      </div>
    </div>
  );
}