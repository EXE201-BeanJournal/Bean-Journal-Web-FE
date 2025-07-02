import { useUser } from '@clerk/clerk-react';
import { paymentService } from './paymentService';

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
    transactionData?: any,
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
  async getPlans() {
    try {
      // For now, use the local paymentService
      // In production, this would call your backend API
      return await paymentService.getSubscriptionPlans();
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
  async getUserSubscription(userId: string, userToken?: string) {
    try {
      // For now, use the local paymentService
      // In production, this would call your backend API
      return await paymentService.getUserSubscription(userId);
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw error;
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    userId: string,
    userToken?: string
  ) {
    try {
      return await paymentService.cancelSubscription(subscriptionId, userId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  /**
   * Update subscription plan
   */
  async updateSubscription(
    newPlanId: string,
    userId: string,
    userToken?: string
  ) {
    try {
      const currentSub = await paymentService.getUserSubscription(userId);
      
      if (currentSub && currentSub.status === 'active') {
        await paymentService.cancelSubscription(currentSub.id, userId);
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
  async handleStripeWebhook(event: any) {
    try {
      await paymentService.handleWebhook('stripe', event.type, event.data);
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
  async handleMoMoWebhook(webhookData: any) {
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

      await paymentService.handleWebhook('momo', 'payment.completed', webhookEvent.data);
      
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
    
    confirmPayment: (paymentIntentId: string, paymentMethod: 'stripe' | 'momo', transactionData?: any) =>
      paymentApi.confirmPayment(paymentIntentId, paymentMethod, transactionData, user?.id)
  };
};

export const useSubscriptionsApi = () => {
  const { user } = useUser();
  
  return {
    getUserSubscription: () => 
      user?.id ? subscriptionsApi.getUserSubscription(user.id, user.id) : Promise.resolve(null),
    
    cancelSubscription: (subscriptionId: string) =>
      user?.id ? subscriptionsApi.cancelSubscription(subscriptionId, user.id, user.id) : Promise.reject('No user'),
    
    updateSubscription: (newPlanId: string) =>
      user?.id ? subscriptionsApi.updateSubscription(newPlanId, user.id, user.id) : Promise.reject('No user')
  };
};