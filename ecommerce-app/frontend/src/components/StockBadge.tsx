interface StockBadgeProps {
  stock: number;
}

export function StockBadge({ stock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <span className="inline-flex rounded-full bg-danger-soft px-3 py-1 text-xs font-semibold text-danger">
        Out of Stock
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
        Low Stock
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
      In Stock
    </span>
  );
}
