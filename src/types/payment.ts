export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'momo' | 'external';
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  currencies: string[];
}

export interface MoMoPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  orderId: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface MoMoPaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  price_vnd?: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
  popular?: boolean;
  // Computed property for backward compatibility
  price?: number;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  paymentMethod: 'stripe' | 'momo';
  subscriptionPlanId: string;
  userId: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentMethod: 'stripe' | 'momo';
  stripeSubscriptionId?: string;
  momoSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: Record<string, unknown>;
  source: 'stripe' | 'momo';
  processed: boolean;
  createdAt: string;
}