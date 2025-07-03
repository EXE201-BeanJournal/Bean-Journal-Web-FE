import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the user from the JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Parse request body
    const { planId, paymentMethod, userId, userEmail } = await req.json()

    if (!planId || !paymentMethod || !userId || !userEmail) {
      throw new Error('Missing required parameters')
    }

    // Verify the user ID matches the JWT
    if (user.id !== userId) {
      throw new Error('User ID mismatch')
    }

    // Get plan details from database
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('active', true)
      .single()

    if (planError || !plan) {
      throw new Error('Subscription plan not found')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // Create or get Stripe customer
    let customerId: string
    const { data: existingCustomer } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id

      // Update profile with customer ID
      await supabaseClient
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price_usd * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata: {
        planId: planId,
        userId: userId,
        paymentMethod: paymentMethod,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store payment intent in database
    const { error: insertError } = await supabaseClient
      .from('payment_intents')
      .insert({
        id: paymentIntent.id,
        user_id: userId,
        plan_id: planId,
        amount: plan.price_usd,
        currency: 'USD',
        status: 'pending',
        payment_method: paymentMethod,
        stripe_payment_intent_id: paymentIntent.id,
        metadata: {
          planId,
          userId,
          paymentMethod,
        },
      })

    if (insertError) {
      console.error('Error storing payment intent:', insertError)
      throw new Error('Failed to store payment intent')
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-payment-intent function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})