'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { apiPost } from '@/lib/api';

interface BkashCheckoutProps {
  orderId: string;
  onPaid: (paymentReference: string) => void;
  onFailed: (message: string) => void;
}

interface BkashCreateResponse {
  orderId: string;
  callbackUrl: string;
  payment: Record<string, unknown>;
}

interface BkashExecuteResponse {
  orderId: string;
  paymentId: string;
  execution: Record<string, unknown>;
}

function isSuccess(payload: Record<string, unknown>) {
  const statusCode = String(payload.statusCode ?? '');
  const status = String(payload.transactionStatus ?? payload.status ?? '').toLowerCase();

  if (statusCode === '0000') {
    return true;
  }

  return status === 'completed' || status === 'success';
}

export function BkashCheckout({ orderId, onPaid, onFailed }: BkashCheckoutProps) {
  const searchParams = useSearchParams();
  const [isRedirecting, setRedirecting] = useState(false);
  const [isProcessingReturn, setProcessingReturn] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    const isReturn = searchParams.get('bkashReturn') === 'true';
    const queryOrderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentID');

    if (!isReturn || queryOrderId !== orderId || !paymentId || processedRef.current) {
      return;
    }

    processedRef.current = true;
    setProcessingReturn(true);

    apiPost<BkashExecuteResponse>('/store/payments/bkash/execute', {
      orderId,
      paymentId,
    })
      .then((response) => {
        if (isSuccess(response.execution)) {
          onPaid(paymentId);
          return;
        }

        onFailed('bKash payment was not successful.');
      })
      .catch((error) => {
        onFailed(error instanceof Error ? error.message : 'bKash execute request failed.');
      })
      .finally(() => {
        setProcessingReturn(false);
      });
  }, [orderId, onFailed, onPaid, searchParams]);

  async function beginBkashFlow() {
    setRedirecting(true);

    try {
      const response = await apiPost<BkashCreateResponse>('/store/payments/bkash/create', {
        orderId,
      });

      const payment = response.payment;
      const redirectUrl =
        (payment.bkashURL as string | undefined) ??
        (payment.paymentURL as string | undefined) ??
        (payment.redirectURL as string | undefined);

      if (!redirectUrl) {
        throw new Error('bKash redirect URL is missing from server response.');
      }

      window.location.assign(redirectUrl);
    } catch (error) {
      onFailed(error instanceof Error ? error.message : 'Could not start bKash payment.');
      setRedirecting(false);
    }
  }

  if (isProcessingReturn) {
    return <p className="text-sm text-muted">Processing your bKash confirmation...</p>;
  }

  return (
    <button
      type="button"
      onClick={beginBkashFlow}
      disabled={isRedirecting}
      className="rounded-xl bg-fg px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
    >
      {isRedirecting ? 'Redirecting to bKash...' : 'Pay with bKash'}
    </button>
  );
}