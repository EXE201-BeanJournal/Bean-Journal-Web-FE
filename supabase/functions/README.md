# Supabase Edge Functions

This directory contains Edge Functions for the Bean Journal application.

## Available Functions

### create-payment-intent

Handles creation of Stripe payment intents for subscription payments.

**Input Parameters:**
- `planId`: ID of the subscription plan
- `paymentMethod`: Payment method ('stripe' or 'momo')
- `userId`: User ID
- `userEmail`: User email address

**Returns:**
- `clientSecret`: Stripe client secret for payment confirmation
- `paymentIntentId`: ID of the created payment intent

## Deployment

To deploy these functions to your Supabase project:

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the functions:
   ```bash
   supabase functions deploy create-payment-intent
   ```

5. Set the required environment variables:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ```

## Testing

You can test the functions locally before deployment:

```bash
supabase functions serve create-payment-intent
```

Then use a tool like cURL or Postman to make requests to `http://localhost:54321/functions/v1/create-payment-intent`.

## Security

These functions require authentication. Make sure to include the user's JWT token in the `Authorization` header when making requests.