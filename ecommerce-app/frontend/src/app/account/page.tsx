import { Suspense } from 'react';
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
    <Suspense fallback={<p className="py-10 text-sm text-muted">Loading account...</p>}>
      <AccountClient initialTab={initialTab} />
    </Suspense>
  );
}
