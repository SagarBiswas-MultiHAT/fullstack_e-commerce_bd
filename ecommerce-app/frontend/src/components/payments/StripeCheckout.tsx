'use client';

import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useMemo, useState } from 'react';
import { apiPost } from '@/lib/api';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface StripeCheckoutProps {
  orderId: string;
  onPaid: (paymentReference: string) => void;
  onFailed: (message: string) => void;
}

interface IntentResponse {
  orderId: string;
  paymentIntentId: string;
  clientSecret: string | null;
}

function StripeForm({
  clientSecret,
  onPaid,
  onFailed,
}: {
  clientSecret: string;
  onPaid: (paymentReference: string) => void;
  onFailed: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setSubmitting] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
          onFailed('Stripe has not loaded yet. Please try again.');
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          onFailed('Card form is unavailable.');
          return;
        }

        setSubmitting(true);

        try {
          const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
            },
          });

          if (result.error) {
            onFailed(result.error.message ?? 'Stripe payment failed.');
            return;
          }

          if (result.paymentIntent?.status === 'succeeded') {
            onPaid(result.paymentIntent.id);
            return;
          }

          onFailed('Stripe payment is not completed yet.');
        } catch (error) {
          onFailed(error instanceof Error ? error.message : 'Stripe payment failed.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="rounded-xl border border-outline bg-bg-elevated p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '15px',
                color: '#1f1710',
                '::placeholder': {
                  color: '#7e6656',
                },
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="rounded-xl bg-fg px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'Processing card...' : 'Pay with Stripe'}
      </button>
    </form>
  );
}

export function StripeCheckout({ orderId, onPaid, onFailed }: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setLoadingIntent] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoadingIntent(true);
    apiPost<IntentResponse>('/store/payments/stripe/create-intent', {
      orderId,
    })
      .then((response) => {
        if (cancelled) {
          return;
        }

        if (!response.clientSecret) {
          onFailed('Stripe client secret was not returned by the server.');
          return;
        }

        setClientSecret(response.clientSecret);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        onFailed(
          error instanceof Error
            ? error.message
            : 'Unable to initialize Stripe payment intent.',
        );
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setLoadingIntent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, onFailed]);

  const options = useMemo(() => {
    if (!clientSecret) {
      return undefined;
    }

    return {
      clientSecret,
    };
  }, [clientSecret]);

  if (!stripePromise) {
    return (
      <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
        Stripe publishable key is not configured.
      </p>
    );
  }

  if (isLoadingIntent) {
    return <p className="text-sm text-muted">Preparing secure card checkout...</p>;
  }

  if (!options) {
    return null;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeForm clientSecret={clientSecret!} onPaid={onPaid} onFailed={onFailed} />
    </Elements>
  );
}