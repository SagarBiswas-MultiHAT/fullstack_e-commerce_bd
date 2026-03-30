import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BkashService {
  private readonly logger = new Logger(BkashService.name);
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(private readonly configService: ConfigService) {}

  async createPayment(amount: string, orderId: string, callbackUrl: string) {
    const payload = {
      mode: '0011',
      payerReference: orderId,
      callbackURL: callbackUrl,
      amount,
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderId,
    };

    return this.postBkash('/tokenized/checkout/create', payload);
  }

  async executePayment(paymentId: string) {
    return this.postBkash('/tokenized/checkout/execute', {
      paymentID: paymentId,
    });
  }

  async queryPayment(paymentId: string) {
    return this.postBkash('/tokenized/checkout/payment/status', {
      paymentID: paymentId,
    });
  }

  async refundPayment(paymentId: string, amount: string, reason: string) {
    return this.postBkash('/tokenized/checkout/payment/refund', {
      paymentID: paymentId,
      amount,
      reason,
    });
  }

  private async grantToken() {
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt) {
      return this.accessToken;
    }

    const username = this.configService.get<string>('BKASH_USERNAME') ?? '';
    const password = this.configService.get<string>('BKASH_PASSWORD') ?? '';
    const appKey = this.configService.get<string>('BKASH_APP_KEY') ?? '';
    const appSecret = this.configService.get<string>('BKASH_APP_SECRET') ?? '';

    const response = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username,
        password,
      },
      body: JSON.stringify({
        app_key: appKey,
        app_secret: appSecret,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      this.logger.error('Failed to grant bKash token', JSON.stringify(payload));
      throw new Error('bKash token grant failed');
    }

    const token =
      (payload.id_token as string | undefined) ??
      (payload.token as string | undefined) ??
      (payload.access_token as string | undefined);

    if (!token) {
      throw new Error('bKash token is missing in response');
    }

    const expiresInRaw = Number(payload.expires_in ?? 3600);
    const expiresIn = Number.isFinite(expiresInRaw) ? expiresInRaw : 3600;

    this.accessToken = token;
    this.accessTokenExpiresAt = Date.now() + Math.min(expiresIn, 55 * 60) * 1000;

    return token;
  }

  private async postBkash(path: string, body: Record<string, unknown>) {
    const token = await this.grantToken();
    const appKey = this.configService.get<string>('BKASH_APP_KEY') ?? '';

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': appKey,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      this.logger.error(`bKash request failed: ${path}`, JSON.stringify(payload));
      throw new Error(`bKash request failed for ${path}`);
    }

    return payload;
  }

  private get baseUrl() {
    return (
      this.configService.get<string>('BKASH_BASE_URL') ??
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    );
  }
}