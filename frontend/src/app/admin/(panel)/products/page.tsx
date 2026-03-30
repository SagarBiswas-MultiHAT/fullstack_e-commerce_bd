'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: string;
  discountPrice: string | null;
  stock: number;
  images: string[];
  isActive: boolean;
  categoryId: string | null;
  category?: { id: string; name: string; slug: string } | null;
}

interface ProductListPayload {
  items: ProductItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface ProductFormState {
  id?: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  categoryId: string;
  images: string[];
  isActive: boolean;
}

const emptyForm: ProductFormState = {
  title: '',
  slug: '',
  description: '',
  price: '',
  discountPrice: '',
  stock: '0',
  categoryId: '',
  images: [],
  isActive: true,
};

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const output: CategoryNode[] = [];

  function walk(items: CategoryNode[]) {
    for (const item of items) {
      output.push(item);
      if (item.children?.length) {
        walk(item.children);
      }
    }
  }

  walk(nodes);
  return output;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  function openCreateModal() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(product: ProductItem) {
    setForm({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description ?? '',
      price: String(product.price),
      discountPrice: product.discountPrice ? String(product.discountPrice) : '',
      stock: String(product.stock),
      categoryId: product.categoryId ?? '',
      images: product.images ?? [],
      isActive: product.isActive,
    });
    setModalOpen(true);
  }

  function loadProducts(search = '') {
    setLoading(true);
    setError(null);

    Promise.all([
      apiGet<ProductListPayload>('/admin/products', { q: search, page: 1, limit: 50 }),
      apiGet<CategoryNode[]>('/store/categories'),
    ])
      .then(([productPayload, categoryPayload]) => {
        setProducts(productPayload.items);
        setCategories(categoryPayload);
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : 'Failed to load products');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadProducts(query);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description || null,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        stock: Number(form.stock),
        categoryId: form.categoryId || undefined,
        images: form.images,
        isActive: form.isActive,
      };

      if (form.id) {
        await apiPut(`/admin/products/${form.id}`, payload);
      } else {
        await apiPost('/admin/products', payload);
      }

      setModalOpen(false);
      loadProducts(query);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this product?')) {
      return;
    }

    try {
      await apiDelete(`/admin/products/${id}`);
      loadProducts(query);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm md:w-72"
        />
        <button
          type="button"
          onClick={() => loadProducts(query)}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm"
        >
          Search
        </button>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950"
        >
          Add Product
        </button>
      </div>

      {error ? <p className="rounded-lg bg-rose-900/40 px-3 py-2 text-sm text-rose-200">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-300">Loading products...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-slate-800/70">
                  <td className="px-3 py-2">{product.title}</td>
                  <td className="px-3 py-2">{formatCurrency(product.discountPrice ?? product.price)}</td>
                  <td className="px-3 py-2">{product.stock}</td>
                  <td className="px-3 py-2">{product.category?.name ?? 'Uncategorized'}</td>
                  <td className="px-3 py-2">{product.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="rounded border border-slate-600 px-2 py-1 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="rounded border border-rose-700 px-2 py-1 text-xs text-rose-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4">
          <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{form.id ? 'Edit Product' : 'Add Product'}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-sm text-slate-400">
                Close
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                      slug: current.id ? current.slug : slugify(event.target.value),
                    }))
                  }
                  required
                  className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                />
                <input
                  placeholder="Slug"
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  required
                  className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                />
                <input
                  placeholder="Price"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  required
                  className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                />
                <input
                  placeholder="Discount Price"
                  value={form.discountPrice}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, discountPrice: event.target.value }))
                  }
                  className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                />
                <input
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                  required
                  className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                />
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                  className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
                >
                  <option value="">No Category</option>
                  {flatCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-28 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Active
              </label>

              <ImageUploader
                productId={form.id}
                value={form.images}
                onChange={(images) => setForm((current) => ({ ...current, images }))}
              />

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-70"
              >
                {saving ? 'Saving...' : form.id ? 'Update Product' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
