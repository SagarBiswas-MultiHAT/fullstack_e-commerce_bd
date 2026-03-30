import { Suspense } from 'react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { AccountClient } from './AccountClient';

type SearchParams = Record<string, string | string[] | undefined>;

function readTab(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? 'orders';
  }

  return value ?? 'orders';
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialTab = readTab(params.tab);

  return (
    <Suspense fallback={<LoadingSkeleton count={4} />}>
      <AccountClient initialTab={initialTab} />
    </Suspense>
  );
}
