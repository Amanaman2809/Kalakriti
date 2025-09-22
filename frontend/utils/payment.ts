// types/payment.ts

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface OrderDetails {
  id: string;
  netAmount: number;
  grossAmount: number;
  shippingAmount: number;
  taxAmount: number;
  creditsApplied: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMode: "COD" | "ONLINE";
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface CreateOrderRequest {
  orderId: string;
}

export interface CreateOrderResponse {
  success: boolean;
  razorpayOrder: RazorpayOrder;
  order: OrderDetails;
  customer: Customer;
  key_id: string;
  error?: string;
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  order: OrderDetails;
  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
  };
  error?: string;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: Record<string, any>;
}

export interface RazorpayPaymentMethod {
  upi: boolean;
  card: boolean;
  netbanking: boolean;
  wallet: boolean;
}

export interface RazorpayPrefill {
  name: string;
  email: string;
  contact: string;
}

export interface RazorpayTheme {
  color: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  method: RazorpayPaymentMethod;
  prefill: RazorpayPrefill;
  theme: RazorpayTheme;
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

export interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: any) => void) => void;
}

export interface PaymentFailedRequest {
  orderId: string;
  error: RazorpayError;
}

export interface PaymentFailedResponse {
  success: boolean;
  message: string;
}

export interface RefundRequest {
  orderId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  message: string;
  refund: {
    id: string;
    amount: number;
    status: string;
  };
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Payment Status Types
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMode = "COD" | "ONLINE";

// Order Status Types (matching your Prisma schema)
export type OrderStatus = "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

// Extended Window interface for global access
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
