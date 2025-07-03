# MoMo Payment Integration with Stripe and Clerk

This document provides a comprehensive guide for integrating MoMo payment method alongside Stripe in the Bean Journal application using Clerk for user management and Supabase for data storage.

## Overview

The integration supports:
- **Stripe**: Credit/Debit card payments (USD, EUR, GBP)
- **MoMo**: Mobile wallet payments (VND, USD)
- **Clerk**: User authentication and management
- **Supabase**: Database for subscription and payment tracking

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   External      │
│                 │    │                 │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ PaymentSelector │───▶│ /api/payments/  │───▶│ Stripe API      │
│ StripeForm      │    │ create-intent   │    │ MoMo API        │
│ MoMoForm        │    │ confirm         │    │ Clerk Auth      │
│ Checkout        │    │ /api/webhooks/  │    │ Supabase DB     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Clerk (already configured)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase (already configured)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MoMo Configuration
MOMO_PARTNER_CODE=MOMO...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
MOMO_ENVIRONMENT=sandbox # or production
MOMO_REDIRECT_URL=http://localhost:3000/payment/momo/callback
MOMO_IPN_URL=http://localhost:3000/api/webhooks/momo

# Payment URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel
```

### 2. Supabase Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Add subscription fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Create payment_intents table
CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  momo_order_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_usd INTEGER NOT NULL,
  price_vnd INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'month',
  features JSONB,
  stripe_price_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, description, price_usd, price_vnd, features) VALUES
('free', 'Free Plan', 'Perfect for getting started', 0, 0, '["Up to 10 journal entries", "Basic analytics", "Mobile app access"]'),
('pro', 'Pro Plan', 'For serious journaling enthusiasts', 1900, 456000, '["Unlimited journal entries", "Advanced analytics", "Export capabilities", "Priority support", "Custom themes", "Cloud backup"]')
ON CONFLICT (id) DO NOTHING;
```

### 3. Stripe Setup

1. **Create Stripe Account**: Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Get API Keys**: Copy publishable and secret keys
3. **Create Products**: 
   ```bash
   # Pro Plan Product
   stripe products create --name="Pro Plan" --description="Premium journaling features"
   
   # Create Price
   stripe prices create --product=prod_xxx --unit-amount=1900 --currency=usd --recurring[interval]=month
   ```
4. **Setup Webhooks**: Add endpoint `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `invoice.payment_succeeded`, `customer.subscription.updated`

### 4. MoMo Setup

1. **Register with MoMo**: Contact MoMo Business for API access
2. **Get Credentials**: Obtain Partner Code, Access Key, and Secret Key
3. **Configure Sandbox**: Use sandbox environment for testing
4. **Setup IPN**: Configure `https://yourdomain.com/api/webhooks/momo`

### 5. Clerk Configuration

Ensure Clerk is configured to sync user data with Supabase:

```typescript
// In your Clerk configuration
const clerkSupabaseClient = createClerkSupabaseClient(
  supabase,
  {
    getToken: () => getToken({ template: 'supabase' })
  }
);
```

## Usage

### 1. Pricing Page Integration

The pricing component now includes:
- Dynamic plan loading from Supabase
- User subscription status display
- Payment method selection
- Integrated checkout flow

```typescript
import Pricing from '@/components/pricing';

// The component handles everything automatically
<Pricing />
```

### 2. Payment Flow

1. **User selects plan** → Pricing component
2. **Choose payment method** → PaymentMethodSelector
3. **Enter payment details** → StripePaymentForm or MoMoPaymentForm
4. **Process payment** → API routes handle backend
5. **Webhook confirmation** → Subscription activated
6. **Redirect to success** → Payment success page

### 3. API Endpoints

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/subscriptions` - Get user subscription
- `DELETE /api/subscriptions` - Cancel subscription
- `GET /api/plans` - Get available plans
- `POST /api/webhooks/stripe` - Stripe webhook
- `POST /api/webhooks/momo` - MoMo webhook

## Testing

### Stripe Test Cards
```
4242424242424242 - Visa (Success)
4000000000000002 - Visa (Declined)
4000000000009995 - Visa (Insufficient funds)
```

### MoMo Test
- Use sandbox environment
- Test phone numbers provided by MoMo
- Use test amounts (usually < 50,000 VND)

## Security Considerations

1. **API Keys**: Never expose secret keys in frontend
2. **Webhook Signatures**: Always verify webhook signatures
3. **User Authentication**: Validate user sessions with Clerk
4. **Database Security**: Use RLS policies in Supabase
5. **HTTPS**: Always use HTTPS in production

## Error Handling

The integration includes comprehensive error handling:
- Payment failures redirect to cancel page
- Network errors show user-friendly messages
- Webhook failures are logged for debugging
- Subscription status is always verified

## Monitoring

- **Stripe Dashboard**: Monitor payments and subscriptions
- **MoMo Portal**: Track MoMo transactions
- **Supabase Logs**: Database operation logs
- **Application Logs**: Custom error tracking

## Support

For issues:
1. Check environment variables
2. Verify webhook endpoints
3. Review Supabase logs
4. Test with sandbox credentials
5. Contact support teams:
   - Stripe: [Stripe Support](https://support.stripe.com)
   - MoMo: MoMo Business Support
   - Clerk: [Clerk Support](https://clerk.com/support)

## Deployment

1. **Environment Variables**: Set all production keys
2. **Deploy Supabase Edge Functions**: 
   ```bash
   # Deploy the payment intent creation function
   supabase functions deploy create-payment-intent
   
   # Set required secrets
   supabase secrets set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   ```
3. **Webhook URLs**: Update to production URLs
4. **Database**: Run migrations on production Supabase
5. **SSL Certificates**: Ensure HTTPS is configured
6. **Testing**: Test complete payment flow in production

---

**Note**: This integration is production-ready but should be thoroughly tested in your specific environment before going live.