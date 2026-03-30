export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface Review {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
  };
}

export interface Product {
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
  category?: CategorySummary | null;
  createdAt: string;
  updatedAt: string;
  reviews?: Review[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: Product[];
  pagination: PaginationMeta;
}

export interface OrderItem {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  price: string;
  product?: Product;
}

export interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  paymentMethod: string;
  paymentReference: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  items: Order[];
  pagination: PaginationMeta;
}

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number;
  expiresAt: string | null;
  usage: {
    usedCount: number;
    usageLimit: number | null;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  customerId: string;
  createdAt: string;
  product?: Product;
}

export interface WishlistResponse {
  items: WishlistItem[];
  pagination: PaginationMeta;
}

export interface SearchProductItem {
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
  category: CategorySummary | null;
  createdAt: string;
  updatedAt: string;
  rating: number;
}

export interface SearchProductsResponse {
  items: SearchProductItem[];
  pagination: PaginationMeta;
  query: string;
}
