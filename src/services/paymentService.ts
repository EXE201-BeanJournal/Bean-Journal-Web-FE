import { SupabaseClient } from '@supabase/supabase-js';
import { momoPaymentService } from './momoPayment';
import { SubscriptionPlan, UserSubscription } from '../types/payment';

class PaymentService {
  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(supabase: SupabaseClient): Promise<SubscriptionPlan[]> {
    try {
      // First try to get from Supabase
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price_usd', { ascending: true });

      if (error) {
        console.error('Error fetching plans from Supabase:', error);
        // Fallback to hardcoded plans
        return this.getDefaultPlans();
      }

      // Add computed price property for backward compatibility
      const plansWithPrice = (plans || []).map(plan => ({
        ...plan,
        price: plan.price_usd // Use USD price as default
      }));

      return plansWithPrice.length > 0 ? plansWithPrice : this.getDefaultPlans();
    } catch (error) {
      console.error('Error in getSubscriptionPlans:', error);
      return this.getDefaultPlans();
    }
  }

  /**
   * Default subscription plans
   */
  private getDefaultPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        price_usd: 0,
        price_vnd: 0,
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          'Up to 10 journal entries',
          'Basic analytics',
          'Mobile app access'
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For serious journaling enthusiasts',
        price_usd: 19,
        price_vnd: 456000,
        price: 19,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited journal entries',
          'Advanced analytics',
          'Export capabilities',
          'Priority support',
          'Custom themes'
        ],
        stripePriceId: 'price_1234567890',
        popular: true
      }
    ];
  }

  /**
   * Create payment intent for subscription
   */
  async createSubscriptionPayment(
    supabase: SupabaseClient,
    planId: string,
    paymentMethod: 'stripe' | 'momo',
    userId: string,
    userEmail: string,
    userPhone?: string
  ): Promise<{ paymentUrl?: string; clientSecret?: string; paymentIntentId: string }> {
    try {
      // Get plan details
      const plans = await this.getSubscriptionPlans(supabase);
      const plan = plans.find(p => p.id === planId);
      
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // For MoMo payments, we still need to create a local payment intent record
      let paymentIntentId: string = '';
      
      if (paymentMethod === 'momo') {
        const timestamp = Date.now().toString(36);
        const randomId = Math.random().toString(36).substr(2, 15);
        paymentIntentId = `pi_${timestamp}${randomId}`;
        
        const { error: insertError } = await supabase
          .from('payment_intents')
          .insert({
            id: paymentIntentId,
            user_id: userId,
            plan_id: planId,
            amount: plan.price_usd * 100, // Convert USD to cents
            currency: plan.currency.toLowerCase(),
            payment_method: paymentMethod,
            status: 'pending',
            metadata: {
              planName: plan.name,
              userEmail,
              userPhone
            }
          });

        if (insertError) {
          throw new Error('Failed to create payment intent record');
        }
      }

      if (paymentMethod === 'stripe') {
        // Call Supabase Edge Function to create real Stripe payment intent
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        // Get the user's session token
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (!accessToken) {
          throw new Error('User not authenticated');
        }
        
        const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            planId,
            userEmail,
            userPhone
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const { clientSecret, paymentIntentId: realPaymentIntentId } = await response.json();
        
        return {
          clientSecret,
          paymentIntentId: realPaymentIntentId
        };
      } else if (paymentMethod === 'momo') {
        // Handle MoMo payment
        if (!userPhone) {
          throw new Error('Phone number is required for MoMo payment. Please add a phone number to your account.');
        }

        // Use VND price if available, otherwise convert USD to VND
        const amountVND = plan.price_vnd || (plan.price_usd * 23000);
        
        const momoResponse = await momoPaymentService.createPayment({
          orderId: paymentIntentId,
          amount: amountVND,
          orderInfo: `Bean Journal ${plan.name} Subscription`,
          redirectUrl: `${window.location.origin}/payment/success?payment_intent=${paymentIntentId}`,
          ipnUrl: `${process.env.VITE_WEBHOOK_BASE_URL || 'https://your-backend.com'}/webhooks/momo`
        });

        if (momoResponse.resultCode === 0) {
          return {
            paymentUrl: momoResponse.payUrl,
            paymentIntentId
          };
        } else {
          throw new Error(momoResponse.message || 'MoMo payment creation failed');
        }
      }

      throw new Error('Invalid payment method');
    } catch (error) {
      console.error('Error creating subscription payment:', error);
      throw error;
    }
  }

  /**
   * Confirm payment and activate subscription
   */
  async confirmPayment(
    supabase: SupabaseClient,
    paymentIntentId: string
  ): Promise<UserSubscription> {
    try {
      // Get payment intent
      const { data: paymentIntent, error: piError } = await supabase
        .from('payment_intents')
        .select('*')
        .eq('id', paymentIntentId)
        .single();

      if (piError || !paymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Update payment intent status
      const { error: updateError } = await supabase
        .from('payment_intents')
        .update({ 
          status: 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentIntentId);

      if (updateError) {
        throw new Error('Failed to update payment intent');
      }

      // Create or update subscription
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const subscriptionData = {
        id: subscriptionId,
        user_id: paymentIntent.user_id,
        plan_id: paymentIntent.plan_id,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        payment_method: paymentIntent.payment_method,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subError) {
        throw new Error('Failed to create subscription');
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: paymentIntent.plan_id,
          subscription_status: 'active',
          updated_at: now.toISOString()
        })
        .eq('id', paymentIntent.user_id);

      if (profileError) {
        console.error('Failed to update user profile:', profileError);
      }

      return subscription;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(supabase: SupabaseClient, userId: string): Promise<UserSubscription | null> {
    try {
      // First, check if user has any subscriptions at all
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching user subscription:', error);
        return null;
      }

      // Return the first subscription if it exists, otherwise null
      return subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  /**
   * Get comprehensive user subscription status including profile data
   */
  async getUserSubscriptionStatus(supabase: SupabaseClient, userId: string): Promise<{
    subscription: UserSubscription | null;
    profile: {
      subscription_tier: string;
      subscription_status: string | null;
      clerk_subscription_id: string | null;
    } | null;
  }> {
    try {
      // Get both subscription and profile data
      const [subscriptionResult, profileResult] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('profiles')
          .select('subscription_tier, subscription_status, clerk_subscription_id')
          .eq('id', userId)
          .single()
      ]);

      const subscription = subscriptionResult.data && subscriptionResult.data.length > 0 
        ? subscriptionResult.data[0] 
        : null;

      const profile = profileResult.error ? null : profileResult.data;

      return { subscription, profile };
    } catch (error) {
      console.error('Error fetching user subscription status:', error);
      return { subscription: null, profile: null };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(supabase: SupabaseClient, subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(
    supabase: SupabaseClient,
    source: 'stripe' | 'momo',
    eventType: string,
    eventData: Record<string, unknown>
  ): Promise<void> {
    try {
      // Log webhook event
      const { error: logError } = await supabase
        .from('webhook_events')
        .insert({
          id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source,
          event_type: eventType,
          event_data: eventData,
          processed: false,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Failed to log webhook event:', logError);
      }

      // Process webhook based on source and type
      if (source === 'momo' && eventType === 'payment.completed') {
        await this.processMoMoPaymentCompleted(supabase, eventData as { orderId: string; resultCode: number });
      } else if (source === 'stripe') {
        await this.processStripeWebhook(supabase, eventType, eventData as { id: string });
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async processMoMoPaymentCompleted(supabase: SupabaseClient, eventData: { orderId: string; resultCode: number }): Promise<void> {
    const { orderId, resultCode } = eventData;
    
    if (resultCode === 0) {
      await this.confirmPayment(supabase, orderId);
    } else {
      // Update payment intent as failed
      await supabase
        .from('payment_intents')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }
  }

  private async processStripeWebhook(supabase: SupabaseClient, eventType: string, eventData: { id: string }): Promise<void> {
    // Handle Stripe webhook events
    switch (eventType) {
      case 'payment_intent.succeeded':
        await this.confirmPayment(supabase, eventData.id);
        break;
      case 'payment_intent.payment_failed':
        await supabase
          .from('payment_intents')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', eventData.id);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${eventType}`);
    }
  }
}

export const paymentService = new PaymentService();
export default PaymentService;