// Browser-compatible crypto implementation
const crypto = {
  createHmac: (_algorithm: string, key: string) => {
    return {
      update: (data: string) => {
        return {
          digest: async () => {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            const messageData = encoder.encode(data);
            
            const cryptoKey = await window.crypto.subtle.importKey(
              'raw',
              keyData,
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['sign']
            );
            
            const signature = await window.crypto.subtle.sign(
              'HMAC',
              cryptoKey,
              messageData
            );
            
            const hashArray = Array.from(new Uint8Array(signature));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          }
        };
      }
    };
  }
};

interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  environment: 'sandbox' | 'production';
}

interface MoMoPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  extraData?: string;
  requestType?: string;
  signature?: string;
}

interface MoMoPaymentResponse {
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

class MoMoPaymentService {
  private config: MoMoConfig;

  constructor() {
    this.config = {
      partnerCode: import.meta.env.MOMO_PARTNER_CODE || 'MOMO',
      accessKey: import.meta.env.MOMO_ACCESS_KEY || '',
      secretKey: import.meta.env.MOMO_SECRET_KEY || '',
      endpoint: import.meta.env.MOMO_ENVIRONMENT === 'production' 
        ? 'https://payment.momo.vn/v2/gateway/api/create'
        : 'https://test-payment.momo.vn/v2/gateway/api/create',
      environment: (import.meta.env.MOMO_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };
  }

  /**
   * Generate HMAC SHA256 signature for MoMo API
   */
  private async generateSignature(rawData: string): Promise<string> {
    return await crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawData)
      .digest();
  }

  /**
   * Create MoMo payment request
   */
  async createPayment({
    orderId,
    amount,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData = '',
    requestType = 'payWithATM'
  }: Omit<MoMoPaymentRequest, 'signature'>): Promise<MoMoPaymentResponse> {
    const requestId = orderId;
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = await this.generateSignature(rawSignature);

    const requestBody = {
      partnerCode: this.config.partnerCode,
      partnerName: 'Bean Journal',
      storeId: 'BeanJournalStore',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      extraData,
      requestType,
      signature
    };

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`MoMo API error: ${response.status} ${response.statusText}`);
      }

      const result: MoMoPaymentResponse = await response.json();
      return result;
    } catch (error) {
      console.error('MoMo payment creation failed:', error);
      throw new Error('Failed to create MoMo payment');
    }
  }

  /**
   * Verify MoMo IPN (Instant Payment Notification) signature
   */
  async verifyIPN(ipnData: {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    orderType: string;
    transId: string;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: number;
    extraData: string;
    signature: string;
  }): Promise<boolean> {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = ipnData;

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = await this.generateSignature(rawSignature);
    return signature === expectedSignature;
  }

  /**
   * Query payment status from MoMo
   */
  async queryPaymentStatus(orderId: string): Promise<MoMoPaymentResponse> {
    const requestId = orderId;
    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;
    const signature = await this.generateSignature(rawSignature);

    const requestBody = {
      partnerCode: this.config.partnerCode,
      requestId,
      orderId,
      signature,
      lang: 'vi'
    };

    const queryEndpoint = this.config.environment === 'production'
      ? 'https://payment.momo.vn/v2/gateway/api/query'
      : 'https://test-payment.momo.vn/v2/gateway/api/query';

    try {
      const response = await fetch(queryEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`MoMo query API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MoMo payment query failed:', error);
      throw new Error('Failed to query MoMo payment status');
    }
  }
}

export const momoPaymentService = new MoMoPaymentService();
export default MoMoPaymentService;