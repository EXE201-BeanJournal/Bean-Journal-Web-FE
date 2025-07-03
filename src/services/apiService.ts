import { useUser } from '@clerk/clerk-react';
import { paymentService } from './paymentService';
import { SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from '../contexts/SupabaseContext';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Helper function to get auth headers
const getAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` })
});

// Payment API functions
export const paymentApi = {
  /**
   * Create payment intent
   */
  async createPaymentIntent(
    planId: string,
    paymentMethod: 'stripe' | 'momo',
    currency = 'USD',
    userToken?: string
  ) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: getAuthHeaders(userToken),
        body: JSON.stringify({
          planId,
          paymentMethod,
          currency
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  /**
   * Confirm payment
   */
  async confirmPayment(
    paymentIntentId: string,
    paymentMethod: 'stripe' | 'momo',
    transactionData?: {
      orderId?: string;
      transId?: string;
      amount?: number;
      resultCode?: number;
      message?: string;
      orderInfo?: string;
      extraData?: Record<string, unknown>;
    },
    userToken?: string
  ) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(userToken),
        body: JSON.stringify({
          paymentIntentId,
          paymentMethod,
          transactionData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }
};

// Plans API functions
export const plansApi = {
  /**
   * Get subscription plans
   */
  async getPlans(supabase: SupabaseClient) {
    try {
      // For now, use the local paymentService
      // In production, this would call your backend API
      return await paymentService.getSubscriptionPlans(supabase);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }
};

// Subscriptions API functions
export const subscriptionsApi = {
  /**
   * Get user's current subscription
   */
  async getUserSubscription(supabase: SupabaseClient, userId: string) {
    try {
      // For now, use the local paymentService
      // In production, this would call your backend API
      return await paymentService.getUserSubscription(supabase, userId);
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw error;
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    supabase: SupabaseClient,
    subscriptionId: string,
  ) {
    try {
      return await paymentService.cancelSubscription(supabase, subscriptionId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  /**
   * Update subscription plan
   */
  async updateSubscription(
    supabase: SupabaseClient,
    userId: string
  ) {
    try {
      const currentSub = await paymentService.getUserSubscription(supabase, userId);
      
      if (currentSub && currentSub.status === 'active') {
        await paymentService.cancelSubscription(supabase, currentSub.id);
      }

      return {
        message: 'Please create a new payment intent for the new plan',
        requiresNewPayment: true
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }
};

// Webhook handlers (for client-side processing if needed)
export const webhookHandlers = {
  /**
   * Handle Stripe webhook events
   * Note: In production, webhooks should be handled on the server side
   */
  async handleStripeWebhook(supabase: SupabaseClient, event: { type: string; data: Record<string, unknown> }) {
    try {
      await paymentService.handleWebhook(supabase, 'stripe', event.type, event.data);
      return { received: true };
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      throw error;
    }
  },

  /**
   * Handle MoMo webhook events
   * Note: In production, webhooks should be handled on the server side
   */
  async handleMoMoWebhook(supabase: SupabaseClient, webhookData: {
    orderId: string;
    transId: string;
    amount: number;
    resultCode: number;
    message: string;
    orderInfo: string;
    extraData?: string;
    partnerCode: string;
    requestId: string;
  }) {
    try {
      const webhookEvent = {
        type: 'momo.payment_completed',
        data: {
          orderId: webhookData.orderId,
          transId: webhookData.transId,
          amount: webhookData.amount,
          resultCode: webhookData.resultCode,
          message: webhookData.message,
          orderInfo: webhookData.orderInfo,
          extraData: webhookData.extraData ? JSON.parse(webhookData.extraData) : null
        }
      };

      await paymentService.handleWebhook(supabase, 'momo', 'payment.completed', webhookEvent.data);
      
      return {
        partnerCode: webhookData.partnerCode,
        orderId: webhookData.orderId,
        requestId: webhookData.requestId,
        resultCode: 0,
        message: 'Success',
        responseTime: Date.now()
      };
    } catch (error) {
      console.error('Error processing MoMo webhook:', error);
      throw error;
    }
  }
};

// React hooks for API calls
export const usePaymentApi = () => {
  const { user } = useUser();
  
  return {
    createPaymentIntent: (planId: string, paymentMethod: 'stripe' | 'momo', currency = 'USD') =>
      paymentApi.createPaymentIntent(planId, paymentMethod, currency, user?.id),
    
    confirmPayment: (paymentIntentId: string, paymentMethod: 'stripe' | 'momo', transactionData?: {
      orderId?: string;
      transId?: string;
      amount?: number;
      resultCode?: number;
      message?: string;
      orderInfo?: string;
      extraData?: Record<string, unknown>;
    }) =>
      paymentApi.confirmPayment(paymentIntentId, paymentMethod, transactionData, user?.id)
  };
};

export const useSubscriptionsApi = () => {
  const { user } = useUser();
  const supabase = useSupabase();
  
  return {
    getUserSubscription: () => 
      user?.id && supabase ? subscriptionsApi.getUserSubscription(supabase, user.id) : Promise.resolve(null),
    
    cancelSubscription: (subscriptionId: string) =>
      user?.id && supabase ? subscriptionsApi.cancelSubscription(supabase, subscriptionId) : Promise.reject('No user'),
    
    updateSubscription: () =>
      user?.id && supabase ? subscriptionsApi.updateSubscription(supabase, user.id) : Promise.reject('No user')
  };
};