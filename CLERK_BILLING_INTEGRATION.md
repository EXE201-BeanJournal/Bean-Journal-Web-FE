# Clerk Billing Integration Guide

This guide explains how to integrate Clerk's built-in billing system with your Bean Journal application, providing both custom payment options (Stripe + MoMo) and Clerk's native billing solution.

## Overview

The integration provides users with two billing options:
1. **Custom Payment System**: Uses Stripe for international payments and MoMo for Vietnamese users
2. **Clerk Billing**: Leverages Clerk's built-in subscription management and billing features

## Components Added

### 1. Enhanced Pricing Component (`src/components/pricing.tsx`)

The main pricing component now includes:
- Toggle between custom payment and Clerk billing
- Conditional rendering of pricing tables
- Integrated user experience

```tsx
import { PricingTable } from '@clerk/clerk-react';

// Toggle between pricing modes
const [useClerkPricing, setUseClerkPricing] = useState(false);

// Conditional rendering
{useClerkPricing ? (
  <PricingTable
    appearance={{ /* custom styling */ }}
    ctaPosition="bottom"
    newSubscriptionRedirectUrl="/dashboard"
  />
) : (
  // Custom pricing implementation
)}
```

### 2. Clerk Billing Integration Component (`src/components/payment/ClerkBillingIntegration.tsx`)

A comprehensive component that demonstrates:
- Personal vs Organization billing
- Clerk PricingTable with custom styling
- Feature explanations and benefits
- Fallback states and loading indicators

## Clerk PricingTable Props

### Core Props

| Prop | Type | Description |
|------|------|-------------|
| `forOrganizations` | `boolean` | Enable organization billing mode |
| `appearance` | `PricingTableTheme` | Custom styling configuration |
| `ctaPosition` | `"top" \| "bottom"` | Position of call-to-action buttons |
| `collapseFeatures` | `boolean` | Collapse feature lists by default |
| `newSubscriptionRedirectUrl` | `string` | Redirect URL after successful subscription |
| `checkoutProps` | `CheckoutProps` | Checkout modal appearance settings |
| `fallback` | `ReactNode` | Loading state component |

### Appearance Customization

```tsx
appearance={{
  elements: {
    pricingTable: "bg-white dark:bg-gray-900 rounded-lg shadow-lg",
    pricingTableHeader: "text-center mb-8",
    pricingTableTitle: "text-3xl font-bold text-gray-900 dark:text-white",
    pricingTablePlan: "border rounded-lg p-6 hover:shadow-lg transition-shadow",
    pricingTablePlanButton: "w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
  }
}}
```

## Setup Requirements

### 1. Clerk Dashboard Configuration

1. **Enable Billing**: Go to your Clerk Dashboard → Billing
2. **Configure Plans**: Set up your subscription plans
3. **Payment Methods**: Configure supported payment methods
4. **Webhooks**: Set up billing webhooks for your application

### 2. Environment Variables

Add to your `.env` file:

```env
# Clerk Billing (if using separate billing keys)
CLERK_BILLING_PUBLISHABLE_KEY=pk_test_...
CLERK_BILLING_SECRET_KEY=sk_test_...

# Webhook endpoints
CLERK_BILLING_WEBHOOK_SECRET=whsec_...
```

### 3. Webhook Handling

Create webhook handlers for Clerk billing events:

```tsx
// src/api/webhooks/clerk-billing.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_BILLING_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_BILLING_WEBHOOK_SECRET to .env');
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', { status: 400 });
  }

  // Handle billing events
  switch (evt.type) {
    case 'subscription.created':
      await handleSubscriptionCreated(evt.data);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(evt.data);
      break;
    case 'subscription.deleted':
      await handleSubscriptionDeleted(evt.data);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(evt.data);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(evt.data);
      break;
  }

  return new Response('', { status: 200 });
}
```

## Integration Benefits

### Clerk Billing Advantages

1. **Seamless Integration**: Native integration with Clerk user management
2. **Self-Service Portal**: Users can manage subscriptions in their profile
3. **Automatic Invoicing**: Professional invoices and receipts
4. **Global Payment Support**: Multiple payment methods and currencies
5. **Compliance**: PCI DSS compliant payment processing
6. **Analytics**: Built-in subscription analytics and reporting

### Custom Payment Advantages

1. **Local Payment Methods**: MoMo wallet for Vietnamese users
2. **Custom Logic**: Full control over payment flow and business logic
3. **Flexible Pricing**: Dynamic pricing and custom discount logic
4. **Multi-Provider**: Combine multiple payment providers

## Usage Examples

### Basic Implementation

```tsx
import { PricingTable } from '@clerk/clerk-react';

function PricingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Choose Your Plan
      </h1>
      
      <PricingTable
        ctaPosition="bottom"
        newSubscriptionRedirectUrl="/dashboard"
        appearance={{
          elements: {
            pricingTable: "max-w-4xl mx-auto",
            pricingTablePlan: "border rounded-lg p-6 shadow-sm"
          }
        }}
      />
    </div>
  );
}
```

### Organization Billing

```tsx
import { PricingTable, useOrganization } from '@clerk/clerk-react';

function OrganizationPricing() {
  const { organization } = useOrganization();
  
  if (!organization) {
    return <div>Please join an organization first</div>;
  }
  
  return (
    <PricingTable
      forOrganizations={true}
      newSubscriptionRedirectUrl="/organization/dashboard"
    />
  );
}
```

### Custom Styling

```tsx
const customAppearance = {
  elements: {
    pricingTable: "bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8",
    pricingTableHeader: "text-center mb-12",
    pricingTableTitle: "text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
    pricingTablePlan: "bg-white rounded-lg shadow-lg border-2 border-transparent hover:border-blue-300 transition-all duration-300 p-8",
    pricingTablePlanName: "text-xl font-bold text-gray-900",
    pricingTablePlanPrice: "text-3xl font-extrabold text-blue-600",
    pricingTablePlanButton: "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
  }
};
```

## Migration Strategy

### Phase 1: Dual System
- Run both payment systems in parallel
- Allow users to choose their preferred method
- Monitor usage and feedback

### Phase 2: Feature Parity
- Ensure Clerk billing supports all required features
- Migrate existing subscriptions gradually
- Maintain backward compatibility

### Phase 3: Consolidation
- Choose primary billing system based on user preference and business needs
- Deprecate secondary system gradually
- Provide migration tools for users

## Testing

### Test Scenarios

1. **Plan Selection**: Test both personal and organization plan selection
2. **Payment Flow**: Verify checkout process and payment confirmation
3. **Subscription Management**: Test upgrade, downgrade, and cancellation
4. **Webhook Processing**: Verify all billing events are handled correctly
5. **Error Handling**: Test payment failures and edge cases

### Test Data

```tsx
// Use Clerk's test mode for development
const testCards = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient_funds: '4000000000009995'
};
```

## Monitoring and Analytics

### Key Metrics

1. **Conversion Rate**: Track pricing page to subscription conversion
2. **Payment Method Usage**: Monitor which payment options are preferred
3. **Churn Rate**: Track subscription cancellations and reasons
4. **Revenue Metrics**: Monitor MRR, ARR, and growth trends

### Logging

```tsx
// Track pricing table interactions
const trackPricingEvent = (event: string, data: any) => {
  analytics.track(event, {
    ...data,
    billing_system: useClerkPricing ? 'clerk' : 'custom',
    timestamp: new Date().toISOString()
  });
};
```

## Troubleshooting

### Common Issues

1. **PricingTable not loading**: Check Clerk configuration and API keys
2. **Styling conflicts**: Ensure CSS specificity for custom styles
3. **Webhook failures**: Verify webhook URLs and secret keys
4. **Payment failures**: Check payment method configuration

### Debug Mode

```tsx
// Enable debug logging
const debugMode = process.env.NODE_ENV === 'development';

if (debugMode) {
  console.log('Clerk billing config:', {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    billingEnabled: true
  });
}
```

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Environment Variables**: Keep secret keys secure and rotate regularly
3. **User Permissions**: Implement proper authorization for billing operations
4. **Data Protection**: Ensure compliance with data protection regulations

## Support and Resources

- [Clerk Billing Documentation](https://clerk.com/docs/billing)
- [Clerk Community Discord](https://discord.com/invite/b5rXHjAg7A)
- [Clerk Support](https://clerk.com/support)
- [PricingTable Component Reference](https://clerk.com/docs/components/billing/pricing-table)

## Next Steps

1. Configure Clerk billing in your dashboard
2. Test the integration in development
3. Set up webhook handlers
4. Deploy and monitor usage
5. Gather user feedback and iterate

This integration provides a robust, scalable billing solution that can grow with your application while maintaining the flexibility of custom payment options where needed.