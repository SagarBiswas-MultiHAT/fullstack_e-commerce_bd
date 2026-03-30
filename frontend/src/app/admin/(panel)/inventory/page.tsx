'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';

interface InventoryItem {
  id: string;
  title: string;
  stock: number;
  category?: { name: string };
}

export default function AdminInventoryPage() {
  const [threshold, setThreshold] = useState('10');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [restockValues, setRestockValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadInventory(nextThreshold = threshold) {
    setLoading(true);
    apiGet<InventoryItem[]>('/admin/inventory', { threshold: Number(nextThreshold) || 10 })
      .then((payload) => setInventory(payload))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Failed to load inventory'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadInventory(threshold);
  }, []);

  function applyThreshold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadInventory(threshold);
  }

  async function restock(productId: string) {
    const quantity = Number(restockValues[productId]);
    if (!Number.isFinite(quantity) || quantity < 0) {
      setError('Restock quantity must be a positive number');
      return;
    }

    try {
      await apiPut(`/admin/inventory/${productId}/restock`, { quantity });
      loadInventory(threshold);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Restock failed');
    }
  }

  return (
    <div className="space-y-4">
      <form className="flex max-w-sm gap-2" onSubmit={applyThreshold}>
        <input
          type="number"
          min={0}
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
          className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        />
        <button type="submit" className="rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950">
          Apply
        </button>
      </form>

      {error ? <p className="rounded-md bg-rose-900/40 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-300">Loading inventory...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Set stock</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-slate-800/70">
                  <td className="px-3 py-2">{item.title}</td>
                  <td className="px-3 py-2 text-slate-400">{item.category?.name ?? 'Uncategorized'}</td>
                  <td className="px-3 py-2">{item.stock}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={restockValues[item.id] ?? item.stock}
                        onChange={(event) =>
                          setRestockValues((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        className="h-8 w-24 rounded border border-slate-700 bg-slate-950 px-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => restock(item.id)}
                        className="rounded border border-slate-700 px-2 py-1 text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
