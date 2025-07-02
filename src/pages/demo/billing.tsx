import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import PricingComponent from '@/components/pricing';
import ClerkBillingIntegration from '@/components/payment/ClerkBillingIntegration';
import { 
  CreditCard, 
  Smartphone, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  CheckCircle, 
  ArrowRight,
  Globe,
  Lock,
  Receipt,
  Settings
} from 'lucide-react';

export function BillingDemo() {
  const [activeDemo, setActiveDemo] = useState<'overview' | 'pricing' | 'clerk' | 'comparison'>('overview');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');

  const features = {
    clerkBilling: [
      { icon: Shield, title: 'PCI DSS Compliant', description: 'Enterprise-grade security for all transactions' },
      { icon: Globe, title: 'Global Payments', description: 'Support for multiple currencies and payment methods' },
      { icon: Receipt, title: 'Automatic Invoicing', description: 'Professional invoices and receipts generated automatically' },
      { icon: Settings, title: 'Self-Service Portal', description: 'Users can manage subscriptions independently' },
      { icon: BarChart3, title: 'Built-in Analytics', description: 'Comprehensive subscription and revenue analytics' },
      { icon: Users, title: 'Organization Billing', description: 'Team subscriptions and multi-seat management' }
    ],
    customPayment: [
      { icon: Smartphone, title: 'MoMo Wallet', description: 'Local payment method for Vietnamese users' },
      { icon: CreditCard, title: 'Stripe Integration', description: 'International credit card processing' },
      { icon: Zap, title: 'Custom Logic', description: 'Full control over payment flow and business rules' },
      { icon: Lock, title: 'Flexible Pricing', description: 'Dynamic pricing and custom discount systems' },
      { icon: CheckCircle, title: 'Multi-Provider', description: 'Combine multiple payment providers seamlessly' },
      { icon: ArrowRight, title: 'Custom Webhooks', description: 'Tailored event handling and integrations' }
    ]
  };

  const comparisonData = [
    {
      feature: 'Setup Complexity',
      clerk: 'Low - Built-in integration',
      custom: 'Medium - Multiple integrations required',
      winner: 'clerk'
    },
    {
      feature: 'Local Payment Methods',
      clerk: 'Limited - Global methods only',
      custom: 'High - MoMo, Stripe, and more',
      winner: 'custom'
    },
    {
      feature: 'Subscription Management',
      clerk: 'Excellent - Self-service portal',
      custom: 'Good - Custom implementation',
      winner: 'clerk'
    },
    {
      feature: 'Customization',
      clerk: 'Medium - Theme customization',
      custom: 'High - Full control',
      winner: 'custom'
    },
    {
      feature: 'Analytics & Reporting',
      clerk: 'Excellent - Built-in dashboards',
      custom: 'Good - Custom implementation',
      winner: 'clerk'
    },
    {
      feature: 'Compliance',
      clerk: 'Excellent - PCI DSS included',
      custom: 'Good - Depends on providers',
      winner: 'clerk'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Billing Integration Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience both Clerk's native billing system and our custom payment integration with Stripe and MoMo wallet support.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'pricing', label: 'Pricing Demo', icon: CreditCard },
            { id: 'clerk', label: 'Clerk Billing', icon: Shield },
            { id: 'comparison', label: 'Comparison', icon: Users }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeDemo === id ? 'default' : 'outline'}
              onClick={() => setActiveDemo(id as any)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Content */}
        {activeDemo === 'overview' && (
          <div className="space-y-8">
            {/* System Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Dual Billing System Overview
                </CardTitle>
                <CardDescription>
                  Our application supports two billing approaches to maximize user convenience and business flexibility.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Clerk Billing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Clerk Billing</h3>
                      <Badge variant="secondary">Recommended</Badge>
                    </div>
                    <div className="space-y-3">
                      {features.clerkBilling.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <feature.icon className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{feature.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Payment */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Custom Payment</h3>
                      <Badge variant="outline">Flexible</Badge>
                    </div>
                    <div className="space-y-3">
                      {features.customPayment.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <feature.icon className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{feature.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Enterprise Security</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">PCI DSS compliant payment processing</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Global + Local</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">International cards + MoMo wallet</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Team Billing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Organization subscriptions supported</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeDemo === 'pricing' && (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                This is the integrated pricing component that allows users to toggle between Clerk billing and custom payment methods.
              </AlertDescription>
            </Alert>
            <PricingComponent />
          </div>
        )}

        {activeDemo === 'clerk' && (
          <div className="space-y-6">
            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                Experience Clerk's native billing component with custom styling and organization support.
              </AlertDescription>
            </Alert>
            <ClerkBillingIntegration />
          </div>
        )}

        {activeDemo === 'comparison' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Comparison</CardTitle>
                <CardDescription>
                  Compare the capabilities of Clerk billing vs custom payment implementation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Feature</th>
                        <th className="text-left py-3 px-4 font-semibold text-blue-600">Clerk Billing</th>
                        <th className="text-left py-3 px-4 font-semibold text-green-600">Custom Payment</th>
                        <th className="text-left py-3 px-4 font-semibold">Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4 font-medium">{row.feature}</td>
                          <td className="py-3 px-4 text-sm">{row.clerk}</td>
                          <td className="py-3 px-4 text-sm">{row.custom}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={row.winner === 'clerk' ? 'default' : 'secondary'}
                              className={row.winner === 'clerk' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                            >
                              {row.winner === 'clerk' ? 'Clerk' : 'Custom'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Implementation Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Implementation Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Choose Clerk Billing If:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• You want quick setup and minimal maintenance</li>
                      <li>• Built-in customer portal is important</li>
                      <li>• You need comprehensive analytics out-of-the-box</li>
                      <li>• PCI compliance is a concern</li>
                      <li>• Organization billing is required</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Choose Custom Payment If:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• You need local payment methods (MoMo)</li>
                      <li>• Custom pricing logic is required</li>
                      <li>• You want full control over the payment flow</li>
                      <li>• Integration with existing systems is needed</li>
                      <li>• Specific business rules must be implemented</li>
                    </ul>
                  </div>
                </div>
                
                <Separator />
                
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Recommended Approach:</strong> Start with the dual system to let users choose their preferred payment method, 
                    then gradually migrate based on usage patterns and user feedback.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Ready to Implement?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Check out our comprehensive integration guides and documentation.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" asChild>
                  <a href="/CLERK_BILLING_INTEGRATION.md" target="_blank">
                    <Shield className="w-4 h-4 mr-2" />
                    Clerk Integration Guide
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/MOMO_INTEGRATION_README.md" target="_blank">
                    <Smartphone className="w-4 h-4 mr-2" />
                    MoMo Integration Guide
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}