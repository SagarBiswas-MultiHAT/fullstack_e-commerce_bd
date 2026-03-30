import { discountPercent, formatCurrency } from '@/lib/format';

interface PriceDisplayProps {
  price: number | string;
  discountPrice?: number | string | null;
  className?: string;
}

export function PriceDisplay({ price, discountPrice, className }: PriceDisplayProps) {
  const regular = typeof price === 'string' ? Number(price) : price;
  const discounted =
    discountPrice === null || discountPrice === undefined
      ? null
      : typeof discountPrice === 'string'
        ? Number(discountPrice)
        : discountPrice;

  if (!discounted || discounted >= regular) {
    return <p className={`text-lg font-semibold text-fg ${className ?? ''}`}>{formatCurrency(regular)}</p>;
  }

  const off = discountPercent(regular, discounted);

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <p className="text-lg font-semibold text-fg">{formatCurrency(discounted)}</p>
      <p className="text-sm text-muted line-through">{formatCurrency(regular)}</p>
      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
        {off}% OFF
      </span>
    </div>
  );
}
