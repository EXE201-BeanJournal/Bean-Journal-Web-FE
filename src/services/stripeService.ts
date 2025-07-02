import { loadStripe, Stripe } from '@stripe/stripe-js';

class StripeService {
  private stripe: Promise<Stripe | null>;
  private publishableKey: string;

  constructor() {
    this.publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    this.stripe = loadStripe(this.publishableKey);
  }

  /**
   * Get Stripe instance
   */
  async getStripe(): Promise<Stripe | null> {
    return await this.stripe;
  }

  /**
   * Create Stripe payment intent for subscription
   * Note: This now requires integration with paymentService
   */
  async createSubscriptionPaymentIntent(
    planId: string,
    userId: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    // This method should now be called through paymentService.createSubscriptionPayment
    // with paymentMethod: 'stripe'
    throw new Error('Use paymentService.createSubscriptionPayment with paymentMethod: "stripe" instead');
  }

  /**
   * Create external payment method (for MoMo)
   * Note: This functionality is now handled by paymentService
   */
  async createExternalPaymentMethod(
    type: string,
    metadata: Record<string, string>
): Promise<{ id: string; type: string; metadata: Record<string, string> }> {
    throw new Error('External payment methods are now handled by paymentService');
  }

  /**
   * Confirm payment with external payment method
   * Note: This functionality is now handled by paymentService
   */
  async confirmExternalPayment(
    paymentIntentId: string,
    externalPaymentData: {
      type: string;
      metadata?: Record<string, string>;
      returnUrl?: string;
    }
  ): Promise<{ 
    id: string;
    status: string;
    client_secret?: string;
    next_action?: {
      type: string;
      redirect_to_url?: {
        url: string;
      };
    };
  }> {
    throw new Error('External payment confirmation is now handled by paymentService');
  }

  /**
   * Create customer in Stripe
   * Note: This functionality is now handled by paymentService
   */
  async createCustomer(
    email: string,
    name: string,
    userId: string
): Promise<{ id: string; email: string; name: string }> {
    throw new Error('Customer creation is now handled by paymentService');
  }

  /**
   * Get subscription plans
   * Note: This functionality is now handled by paymentService
   */
  async getSubscriptionPlans(): Promise<any[]> {
    throw new Error('Use paymentService.getSubscriptionPlans() instead');
  }

  /**
   * Cancel subscription
   * Note: This functionality is now handled by paymentService
   */
  async cancelSubscription(subscriptionId: string): Promise<{ id: string; status: string }> {
    throw new Error('Use paymentService.cancelSubscription() instead');
  }
}

export const stripeService = new StripeService();
export default StripeService;