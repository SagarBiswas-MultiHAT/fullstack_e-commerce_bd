import type { NextWebVitalsMetric } from 'next/app';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const TRACKED_METRICS = new Set(['CLS', 'LCP', 'FID', 'TTFB']);

function sendToGa4(metric: NextWebVitalsMetric) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) {
    return;
  }

  window.gtag('event', metric.name, {
    event_category: 'Web Vitals',
    event_label: metric.id,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    non_interaction: true,
    metric_id: metric.id,
    metric_value: metric.value,
  });
}

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (!TRACKED_METRICS.has(metric.name)) {
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[web-vitals]', metric.name, metric.value, metric.id);
  }

  sendToGa4(metric);
}
