import { BrevoClient } from '@getbrevo/brevo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Customer } from '../entities/customer.entity';
import { Order } from '../entities/order.entity';

interface AbandonedCartItem {
  title: string;
  quantity: number;
  price: string;
  imageUrl?: string;
}

interface SendEmailArgs {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly senderName: string;
  private readonly senderEmail: string;
  private readonly frontendUrl: string;
  private readonly brandColor: string;
  private readonly brevoClient: BrevoClient | null;

  constructor(private readonly configService: ConfigService) {
    this.senderName = this.configService.get<string>('SENDER_NAME') ?? 'BazaarFlow';
    this.senderEmail =
      this.configService.get<string>('SENDER_EMAIL') ?? 'noreply@example.com';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    this.brandColor = this.configService.get<string>('BRAND_COLOR') ?? '#2563EB';

    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    this.brevoClient =
      apiKey && !apiKey.includes('placeholder')
        ? new BrevoClient({ apiKey })
        : null;

    if (!this.brevoClient) {
      this.logger.warn('BREVO_API_KEY is not configured. Transactional emails are disabled.');
    }
  }

  async sendWelcomeEmail(customer: Pick<Customer, 'email' | 'name'>): Promise<void> {
    const html = this.renderTemplate({
      title: `Welcome to ${this.senderName}`,
      subtitle: `Hi ${customer.name}, your account is ready and your next great find is one click away.`,
      bodyHtml: `
        <tr>
          <td style="padding:0 24px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#475569;">
            Thanks for joining us. Start exploring curated products, flash deals, and smooth checkout in minutes.
          </td>
        </tr>
      `,
      ctaLabel: 'Start Shopping',
      ctaHref: this.frontendUrl,
      footerNote: 'Need help? Reply to this email and our team will assist you.',
    });

    this.sendEmail({
      to: [{ email: customer.email, name: customer.name }],
      subject: `Welcome to ${this.senderName}`,
      htmlContent: html,
      textContent: `Welcome to ${this.senderName}. Visit ${this.frontendUrl} to start shopping.`,
    });
  }

  async sendOrderConfirmation(
    order: Pick<Order, 'id' | 'total' | 'paymentMethod' | 'createdAt'> & {
      items: Array<{ quantity: number; price: string; product?: { title: string } }>;
    },
    customer: Pick<Customer, 'email' | 'name'>,
  ): Promise<void> {
    const itemRows = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0F172A;">
              ${item.product?.title ?? 'Product'} × ${item.quantity}
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0F172A;text-align:right;">
              ৳${Number(item.price).toFixed(2)}
            </td>
          </tr>
        `,
      )
      .join('');

    const html = this.renderTemplate({
      title: 'Order Confirmed',
      subtitle: `Your order #${order.id.slice(0, 8)} has been received successfully.`,
      bodyHtml: `
        <tr>
          <td style="padding:0 24px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:10px 12px;background:#F8FAFC;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:.08em;">Items</td>
                <td style="padding:10px 12px;background:#F8FAFC;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:.08em;text-align:right;">Price</td>
              </tr>
              ${itemRows}
              <tr>
                <td style="padding:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#0F172A;">Total</td>
                <td style="padding:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#0F172A;text-align:right;">৳${Number(order.total).toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#475569;">
            Payment method: <strong style="color:#0F172A;">${order.paymentMethod ?? 'online'}</strong><br />
            Estimated delivery: 2-4 business days.
          </td>
        </tr>
      `,
      ctaLabel: 'Track My Order',
      ctaHref: `${this.frontendUrl}/account/orders/${order.id}`,
      footerNote: `Placed on ${order.createdAt.toISOString()}.`,
    });

    this.sendEmail({
      to: [{ email: customer.email, name: customer.name }],
      subject: `Order Confirmed • #${order.id.slice(0, 8)}`,
      htmlContent: html,
      textContent: `Your order #${order.id.slice(0, 8)} is confirmed. Total ৳${Number(order.total).toFixed(2)}.`,
    });
  }

  async sendPasswordReset(
    customer: Pick<Customer, 'email' | 'name'>,
    resetLink: string,
  ): Promise<void> {
    const html = this.renderTemplate({
      title: 'Reset Your Password',
      subtitle: 'A secure reset link has been generated for your account.',
      bodyHtml: `
        <tr>
          <td style="padding:0 24px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#475569;">
            This password reset link is valid for 1 hour. If you did not request this, you can safely ignore this email.
          </td>
        </tr>
      `,
      ctaLabel: 'Reset Password',
      ctaHref: resetLink,
      footerNote: 'For account safety, this link can only be used once.',
    });

    this.sendEmail({
      to: [{ email: customer.email, name: customer.name }],
      subject: 'Password Reset Request',
      htmlContent: html,
      textContent: `Reset your password using this link (valid for 1 hour): ${resetLink}`,
    });
  }

  async sendShippingUpdate(
    order: Pick<Order, 'id' | 'status'>,
    customer: Pick<Customer, 'email' | 'name'>,
    status: string,
    trackingUrl: string,
  ): Promise<void> {
    const html = this.renderTemplate({
      title: `Order ${status}`,
      subtitle: `Your order #${order.id.slice(0, 8)} status is now ${status}.`,
      bodyHtml: `
        <tr>
          <td style="padding:0 24px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#475569;">
            Stay updated with your parcel movement from the courier tracking page.
          </td>
        </tr>
      `,
      ctaLabel: 'Track Shipment',
      ctaHref: trackingUrl,
      footerNote: `Current status: ${order.status}.`,
    });

    this.sendEmail({
      to: [{ email: customer.email, name: customer.name }],
      subject: `Shipping Update • #${order.id.slice(0, 8)}`,
      htmlContent: html,
      textContent: `Order ${order.id} is now ${status}. Track here: ${trackingUrl}`,
    });
  }

  async sendAbandonedCartEmail(
    customer: Pick<Customer, 'email' | 'name'>,
    cartItems: AbandonedCartItem[],
  ): Promise<void> {
    const itemRows = cartItems
      .map(
        (item) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="64" style="padding-right:10px;vertical-align:top;">
                    <img src="${item.imageUrl ?? `${this.frontendUrl}/images/placeholder-product.svg`}" alt="${item.title}" width="56" height="56" style="display:block;border-radius:6px;object-fit:cover;" />
                  </td>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#0F172A;vertical-align:top;">
                    <strong>${item.title}</strong><br />
                    Qty: ${item.quantity} • ৳${Number(item.price).toFixed(2)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `,
      )
      .join('');

    const html = this.renderTemplate({
      title: 'You Left Something Behind',
      subtitle: 'Your cart is still waiting. Complete checkout before your picks run out.',
      bodyHtml: `
        <tr>
          <td style="padding:0 24px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              ${itemRows}
            </table>
          </td>
        </tr>
      `,
      ctaLabel: 'Resume Checkout',
      ctaHref: `${this.frontendUrl}/checkout`,
      footerNote: 'Prices and stock may change based on demand.',
    });

    this.sendEmail({
      to: [{ email: customer.email, name: customer.name }],
      subject: 'Complete Your Checkout',
      htmlContent: html,
      textContent: `Your cart is waiting. Resume checkout: ${this.frontendUrl}/checkout`,
    });
  }

  private sendEmail({ to, subject, htmlContent, textContent }: SendEmailArgs) {
    if (!this.brevoClient) {
      this.logger.warn(`Skipped email (${subject}) because Brevo is not configured.`);
      return;
    }

    this.brevoClient.transactionalEmails
      .sendTransacEmail({
        sender: {
          name: this.senderName,
          email: this.senderEmail,
        },
        to,
        subject,
        htmlContent,
        textContent,
      })
      .then(() => {
        this.logger.log(`Transactional email sent: ${subject}`);
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to send transactional email: ${subject}`,
          error instanceof Error ? error.stack : undefined,
        );
      });
  }

  private renderTemplate(args: {
    title: string;
    subtitle: string;
    bodyHtml: string;
    ctaLabel: string;
    ctaHref: string;
    footerNote?: string;
  }) {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:${this.brandColor};padding:18px 24px;font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;font-size:18px;font-weight:700;">
                  ${this.senderName}
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px 6px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#0F172A;">
                  ${args.title}
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 14px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#475569;">
                  ${args.subtitle}
                </td>
              </tr>
              ${args.bodyHtml}
              <tr>
                <td style="padding:10px 24px 24px;">
                  <a href="${args.ctaHref}" style="display:inline-block;background:${this.brandColor};color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;">
                    ${args.ctaLabel}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 24px 22px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#94A3B8;">
                  ${args.footerNote ?? 'This is an automated transactional email.'}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }
}