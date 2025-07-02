// Browser-compatible crypto implementation
const crypto = {
  createHmac: (_algorithm: string, key: string) => {
    return {
      update: (data: string) => {
        return {
          digest: async () => {
            if (!key || key.trim() === '') {
              throw new Error('HMAC key cannot be empty');
            }
            
            if (!data) {
              throw new Error('HMAC data cannot be empty');
            }
            
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            const messageData = encoder.encode(data);
            
            try {
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
            } catch (error) {
              console.error('Web Crypto API error:', error);
              throw new Error(`Crypto operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
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
    
    // Validate required configuration
    this.validateConfig();
  }
  
  /**
   * Validate MoMo configuration
   */
  private validateConfig(): void {
    const missingVars: string[] = [];
    
    if (!this.config.partnerCode || this.config.partnerCode === 'MOMO') {
      missingVars.push('MOMO_PARTNER_CODE');
    }
    
    if (!this.config.accessKey) {
      missingVars.push('MOMO_ACCESS_KEY');
    }
    
    if (!this.config.secretKey) {
      missingVars.push('MOMO_SECRET_KEY');
    }
    
    if (missingVars.length > 0) {
      console.warn(`MoMo configuration incomplete. Missing environment variables: ${missingVars.join(', ')}`);
      console.warn('Please check your .env file and ensure all MoMo variables are set.');
    }
  }

  /**
   * Generate HMAC SHA256 signature for MoMo API
   */
  private async generateSignature(rawData: string): Promise<string> {
    if (!this.config.secretKey) {
      throw new Error('MoMo secret key is not configured');
    }
    
    if (!rawData) {
      throw new Error('Raw data for signature generation cannot be empty');
    }
    
    try {
      return await crypto
        .createHmac('sha256', this.config.secretKey)
        .update(rawData)
        .digest();
    } catch (error) {
      console.error('Signature generation failed:', error);
      throw new Error('Failed to generate MoMo signature');
    }
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