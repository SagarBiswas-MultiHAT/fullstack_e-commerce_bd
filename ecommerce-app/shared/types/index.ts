export interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  isActive: boolean;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  paymentMethod?: string;
  paymentReference?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  image?: string;
  price: number;
  discountPrice?: number;
  quantity: number;
  stock: number;
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  body?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  customerId: string;
  productId: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}
