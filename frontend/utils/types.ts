export type PaymentMode = "COD" | "ONLINE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type OrderStatus = "PLACED" | "SHIPPED" | "DELIVERED";

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface PFeedback {
  rating: number;
  comment: string;
  productId: string;
}

export interface FeedbackSummary {
  avg_rating: number;
  total_reviews: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface ProductsResponse {
  products: Product[];
}

export interface CartParams {
  productId: string;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  product: Product;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  userId: string;
}

export interface Order {
  id: string;
  userId: string;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  total: number;
  address: Address;
  createdAt: string;
  updatedAt: string;
  shippedAt: string;
  estimatedDelivery: string;
  deliveredAt:string;
  carrierName: string;
  trackingNumber: string;
  user?: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product:Product;
}
