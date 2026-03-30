export function formatCurrency(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value;

  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function discountPercent(price: number | string, discountPrice: number | string) {
  const regular = typeof price === 'string' ? Number(price) : price;
  const discounted = typeof discountPrice === 'string' ? Number(discountPrice) : discountPrice;

  if (!regular || !discounted || discounted >= regular) {
    return 0;
  }

  return Math.round(((regular - discounted) / regular) * 100);
}

export function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;

  return new Intl.DateTimeFormat('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
