import { supabase } from '../lib/supabase';
import { stripeService } from './stripeService';
import { momoPaymentService } from './momoPayment';
import { SubscriptionPlan, UserSubscription } from '../types/payment';

class PaymentService {
  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
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
    planId: string,
    paymentMethod: 'stripe' | 'momo',
    userId: string,
    userEmail: string,
    userPhone?: string
  ): Promise<{ paymentUrl?: string; clientSecret?: string; paymentIntentId: string }> {
    try {
      // Get plan details
      const plans = await this.getSubscriptionPlans();
      const plan = plans.find(p => p.id === planId);
      
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      // Create payment intent record in Supabase
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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

      if (paymentMethod === 'stripe') {
        // Handle Stripe payment - create payment intent directly
        // Note: In a real implementation, this should call your backend API
        // For now, we'll create a mock client secret for frontend testing
        const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          clientSecret,
          paymentIntentId
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
        .from('user_subscriptions')
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
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return subscription;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
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
        await this.processMoMoPaymentCompleted(eventData as { orderId: string; resultCode: number });
      } else if (source === 'stripe') {
        await this.processStripeWebhook(eventType, eventData as { id: string });
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async processMoMoPaymentCompleted(eventData: { orderId: string; resultCode: number }): Promise<void> {
    const { orderId, resultCode } = eventData;
    
    if (resultCode === 0) {
      await this.confirmPayment(orderId);
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

  private async processStripeWebhook(eventType: string, eventData: { id: string }): Promise<void> {
    // Handle Stripe webhook events
    switch (eventType) {
      case 'payment_intent.succeeded':
        await this.confirmPayment(eventData.id);
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