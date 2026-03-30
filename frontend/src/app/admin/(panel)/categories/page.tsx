'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: CategoryNode[];
}

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  const output: CategoryNode[] = [];

  const walk = (items: CategoryNode[]) => {
    for (const item of items) {
      output.push(item);
      walk(item.children ?? []);
    }
  };

  walk(nodes);
  return output;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const flatCategories = useMemo(() => flatten(categories), [categories]);

  function loadCategories() {
    setLoading(true);
    apiGet<CategoryNode[]>('/store/categories')
      .then((payload) => setCategories(payload))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Failed to load categories'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function openEdit(category: CategoryNode) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setParentId(category.parentId ?? '');
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setSlug('');
    setParentId('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const payload = {
        name,
        slug,
        parentId: parentId || undefined,
      };

      if (editingId) {
        await apiPut(`/admin/categories/${editingId}`, payload);
      } else {
        await apiPost('/admin/categories', payload);
      }

      resetForm();
      loadCategories();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Save failed');
    }
  }

  function renderTree(nodes: CategoryNode[], depth = 0): React.ReactNode {
    return nodes.map((category) => (
      <div key={category.id} className="space-y-1">
        <div
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"
          style={{ marginLeft: `${depth * 18}px` }}
        >
          <div>
            <p className="text-sm font-semibold">{category.name}</p>
            <p className="text-xs text-slate-400">/{category.slug}</p>
          </div>
          <button
            type="button"
            onClick={() => openEdit(category)}
            className="rounded border border-slate-700 px-2 py-1 text-xs"
          >
            Edit
          </button>
        </div>
        {category.children?.length ? renderTree(category.children, depth + 1) : null}
      </div>
    ));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold">{editingId ? 'Edit Category' : 'Create Category'}</h2>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          />
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Slug"
            required
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          />
          <select
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
          >
            <option value="">No parent</option>
            {flatCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {error ? <p className="text-xs text-rose-300">{error}</p> : null}

          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950">
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-2">
        {loading ? <p className="text-sm text-slate-300">Loading categories...</p> : renderTree(categories)}
      </section>
    </div>
  );
}
