import { apiGetServer } from './api';
import type {
  Product,
  ProductListResponse,
  Review,
  SearchProductsResponse,
} from './types';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  createdAt: string;
  children: CategoryNode[];
}

export async function getCategoryTree() {
  try {
    return await apiGetServer<CategoryNode[]>('/store/categories');
  } catch {
    return [];
  }
}

export function flattenCategories(tree: CategoryNode[]): CategoryNode[] {
  const output: CategoryNode[] = [];

  function walk(nodes: CategoryNode[]) {
    for (const node of nodes) {
      output.push(node);
      if (node.children.length) {
        walk(node.children);
      }
    }
  }

  walk(tree);
  return output;
}

export async function getProducts(params: Record<string, string | number | boolean | undefined>) {
  try {
    const payload = await apiGetServer<ProductListResponse>('/store/products', params);
    return payload;
  } catch {
    return {
      items: [],
      pagination: {
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 12),
        total: 0,
        totalPages: 0,
      },
    };
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await apiGetServer<Product>(`/store/products/${slug}`);
  } catch {
    return null;
  }
}

export async function getProductReviews(productId: string, page = 1, limit = 10) {
  try {
    return await apiGetServer<{ items: Review[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/store/products/${productId}/reviews`,
      { page, limit },
    );
  } catch {
    return {
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

export async function searchProducts(
  params: Record<string, string | number | boolean | undefined>,
) {
  try {
    return await apiGetServer<SearchProductsResponse>('/store/search', params);
  } catch {
    return {
      items: [],
      pagination: {
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 12),
        total: 0,
        totalPages: 0,
      },
      query: String(params.q ?? ''),
    };
  }
}
