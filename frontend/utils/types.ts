export const PaymentModeValues: PaymentMode[] = ["COD", "ONLINE"];
export const PaymentStatusValues: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
];
export const OrderStatusValues: OrderStatus[] = [
  "PENDING",
  "PLACED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const AddressTypeValues: AddressType[] = ["HOME", "WORK", "OTHER"];
export const RoleValues: Role[] = ["USER", "ADMIN"];

export type PaymentMode = "COD" | "ONLINE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type OrderStatus =
  | "PLACED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "PENDING";
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
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  averageRating: number;
  numReviews: number;
  price: number;
  finalPrice: number;
  stock: number;
  categoryId: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  status: OrderStatus | "PENDING"; // support backend enum

  addressId: string;
  address: Address;

  // Financials
  creditsApplied: number;
  grossAmount: number;
  netAmount: number;
  shippingAmount: number;
  taxAmount: number;

  // Tracking / logistics
  carrierName: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  statusUpdatedAt: string;

  // Cancellation
  cancellationReason: string | null;
  cancelledAt: string | null;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Relations
  items: OrderItem[];
  user?: User; // optional, not included in API
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
  createdAt: string;
  updatedAt: string;
  addresses: Address[];
  orders: Order[];
  wishlist: WishlistItem[];
  cartItems: CartItem[];
  Feedback: PFeedback[];
}

export interface OrderFinancials {
  grossAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalDiscount: number;
  creditsApplied: number;
  totalAmount: number;
  finalAmountToPay: number;
}

export interface OrderPayment {
  id: string;
  provider: string;
  amount: number;
  status: string;
  createdAt: string;
  meta: any;
}

export interface OrderDetail extends Order {
  financials: OrderFinancials;
  payments: OrderPayment[];
  items: (OrderItem & { total: number; discount: number })[];
}
