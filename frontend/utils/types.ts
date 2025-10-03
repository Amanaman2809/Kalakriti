export const PaymentModeValues: PaymentMode[] = ["COD", "ONLINE"];
export const PaymentStatusValues: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
];
export const OrderStatusValues: OrderStatus[] = [
  "PLACED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];
export const AddressTypeValues: AddressType[] = ["HOME", "WORK", "OTHER"];
export const RoleValues: Role[] = ["USER", "ADMIN"];

export type PaymentMode = "COD" | "ONLINE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type OrderStatus = "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type AddressType = "HOME" | "WORK" | "OTHER";
export type Role = "USER" | "ADMIN";

export interface Category {
  id: string;
  name: string;
  image: string | null;
  products?: Product[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string;
  };
}
export interface FeedbackSubmission {
  productId: string;
  rating: number;
  comment: string | null;
}

export interface PFeedback {
  id: string;
  rating: number;
  comment: string | null;
  productId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  product: Product;
}

export interface FeedbackSummary {
  avg_rating: number;
  total_reviews: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  finalPrice: number;
  stock: number;
  categoryId: string;
  tags: string[];
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  category: Category;
  discountPct: number | null;
  wishlistItems?: WishlistItem[];
  orderItems?: OrderItem[];
  CartItem?: CartItem[];
  Feedback?: PFeedback[];
}

export interface CartItem {
  id: string;
  quantity: number;
  userId: string;
  productId: string;
  product: Product;
  user: User;
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
  userId: string;
  productId: string;
  product: Product;
  user: User;
}
export interface InteractionState {
  wishlist: Record<string, boolean>;
  cart: Record<string, boolean>;
  loading: Record<string, boolean>;
}

export interface ProductCardProps {
  product: Product;
  interactions?: {
    wishlist?: Record<string, boolean>;
    cart?: Record<string, boolean>;
    loading?: Record<string, boolean>;
  };
  toggleWishlist?: (productId: string, productName: string) => Promise<void>;
  addToCartHandler?: (productId: string, productName: string) => Promise<void>;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: AddressType | null;
  userId: string;
  user: User;
  orders?: Order[];
}

export interface Order {
  id: string;
  userId: string;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  total: number;
  addressId: string;
  address: Address;
  createdAt: Date;
  updatedAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  estimatedDelivery: Date | null;
  carrierName: string | null;
  trackingNumber: string | null;
  statusUpdatedAt: Date;
  user: User;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  order: Order;
  product: Product;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string | null;
  oauthId: string | null;
  oauthProvider: string | null;
  otp: string | null;
  otpExpiresAt: Date | null;
  isVerified: boolean;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  addresses: Address[];
  orders: Order[];
  wishlist: WishlistItem[];
  cartItems: CartItem[];
  Feedback: PFeedback[];
}
