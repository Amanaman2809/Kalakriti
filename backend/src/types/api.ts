// types/api.ts - Backend API Types

import { Request } from "express";

// Extend Express Request type with user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN";
  };
}

// Razorpay Order Creation Options
export interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt: string;
  payment_capture: number;
  notes: {
    order_id: string;
    user_id: string;
    user_email: string;
  };
}

// Razorpay Payment Details
export interface RazorpayPaymentDetails {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null; // UPI ID
  email: string;
  contact: string;
  notes: Record<string, any>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: Record<string, any>;
  created_at: number;
}

// Database Payment Record
export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  provider: "RAZORPAY" | "INTERNAL";
  providerPaymentId: string | null;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  metadata: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    method?: string;
    bank?: string;
    wallet?: string;
    vpa?: string; // UPI ID
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Order with Relations
export interface OrderWithRelations {
  id: string;
  userId: string;
  addressId: string;
  paymentMode: "COD" | "ONLINE";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  status: "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  grossAmount: number;
  shippingAmount: number;
  taxAmount: number;
  creditsApplied: number;
  netAmount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      price: number;
      // ... other product fields
    };
  }>;
  address: {
    id: string;
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    // ... other address fields
  };
  payments?: PaymentRecord[];
}

// API Request/Response Types
export interface CreateRazorpayOrderRequest {
  orderId: string;
}

export interface CreateRazorpayOrderResponse {
  success: boolean;
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
  };
  order: {
    id: string;
    netAmount: number;
    grossAmount: number;
    shippingAmount: number;
    taxAmount: number;
    creditsApplied: number;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  key_id: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  order: OrderWithRelations;
  payment: {
    id: string;
    amount: number;
    method: string;
    status: string;
  };
  error?: string;
}

// Refund Types
export interface RazorpayRefund {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, any>;
  receipt: string | null;
  acquirer_data: Record<string, any>;
  created_at: number;
  batch_id: string | null;
  status: string;
  speed_processed: string;
  speed_requested: string;
}

export interface InitiateRefundRequest {
  orderId: string;
  amount?: number;
  reason?: string;
}

export interface InitiateRefundResponse {
  success: boolean;
  message: string;
  refund: {
    id: string;
    amount: number;
    status: string;
  };
  error?: string;
}

// Error Response Type
export interface ErrorResponse {
  error: string;
  success: false;
}
