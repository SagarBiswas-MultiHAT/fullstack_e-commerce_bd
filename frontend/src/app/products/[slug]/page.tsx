import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ProductDetailClient } from '@/components/ProductDetailClient';
import { getProductBySlug, getProductReviews, getProducts } from '@/lib/store-data';

async function ProductDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [related, reviews] = await Promise.all([
    getProducts({
      category: product.category?.slug ?? undefined,
      limit: 8,
      sort: 'popular',
    }),
    getProductReviews(product.id, 1, 10),
  ]);

  const relatedProducts = related.items.filter((item) => item.id !== product.id).slice(0, 4);

  const mergedProduct = {
    ...product,
    reviews: (reviews.items ?? []).map((review) => ({
      ...review,
      body: review.body ?? '',
      createdAt: String(review.createdAt),
    })),
  };

  return <ProductDetailClient product={mergedProduct} relatedProducts={relatedProducts} />;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<LoadingSkeleton count={4} />}>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
