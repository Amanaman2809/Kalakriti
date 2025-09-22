"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Types and Interfaces
interface Customer {
  name: string;
  email: string;
  phone: string;
}

interface OrderDetails {
  id: string;
  netAmount: number;
  grossAmount: number;
  shippingAmount: number;
  taxAmount: number;
  creditsApplied: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMode: "COD" | "ONLINE";
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

interface CreateOrderResponse {
  success: boolean;
  razorpayOrder: RazorpayOrder;
  order: OrderDetails;
  customer: Customer;
  key_id: string;
  error?: string;
}

interface PaymentVerificationResponse {
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

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: Record<string, any>;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  method: {
    upi: boolean;
    card: boolean;
    netbanking: boolean;
    wallet: boolean;
  };
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface OrderPaymentProps {
  orderId: string;
  onPaymentSuccess?: (paymentData: PaymentVerificationResponse) => void;
  onPaymentError?: (error: RazorpayError | Error) => void;
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: any) => void) => void;
    };
  }
}

const OrderPayment: React.FC<OrderPaymentProps> = ({
  orderId,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  // Load Razorpay script
  const loadScript = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Get auth token (adjust based on your auth implementation)
  const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Create Razorpay order
  const createRazorpayOrder = async (): Promise<CreateOrderResponse> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/payments/create-razorpay-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CreateOrderResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create payment order");
      }

      return data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  };

  // Handle payment process
  const handlePayment = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      // Load Razorpay script
      const res = await loadScript(
        "https://checkout.razorpay.com/v1/checkout.js",
      );
      if (!res) {
        throw new Error(
          "Razorpay SDK failed to load. Please check your internet connection.",
        );
      }

      // Create Razorpay order
      const { razorpayOrder, order, customer, key_id } =
        await createRazorpayOrder();

      // Razorpay checkout options
      const options: RazorpayOptions = {
        key: key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Your Store Name",
        description: `Payment for Order #${order.id.slice(-8)}`,
        order_id: razorpayOrder.id,

        // UPI and other payment methods
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },

        // Prefill customer details
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },

        // Theme customization
        theme: {
          color: "#3B82F6", // Tailwind blue-500
        },

        // Success handler
        handler: async function (response: RazorpayResponse) {
          try {
            setLoading(true);

            const token = getAuthToken();
            if (!token) {
              throw new Error("Authentication required");
            }

            // Verify payment on backend
            const verifyResponse = await fetch("/api/payments/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.id,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error(`HTTP error! status: ${verifyResponse.status}`);
            }

            const verifyData: PaymentVerificationResponse =
              await verifyResponse.json();

            if (verifyData.success) {
              // Payment successful
              if (onPaymentSuccess) {
                onPaymentSuccess(verifyData);
              } else {
                await router.push(`/orders/${order.id}?payment=success`);
              }
            } else {
              throw new Error(
                verifyData.error || "Payment verification failed",
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Payment verification failed";
            setError(errorMessage);
            if (onPaymentError) {
              onPaymentError(
                error instanceof Error ? error : new Error(errorMessage),
              );
            }
          } finally {
            setLoading(false);
          }
        },

        // Modal close handler
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      // Create Razorpay instance and open checkout
      const paymentObject = new window.Razorpay(options);

      paymentObject.on(
        "payment.failed",
        async function (response: { error: RazorpayError }) {
          console.error("Payment failed:", response.error);
          setError(`Payment failed: ${response.error.description}`);

          try {
            const token = getAuthToken();
            if (token) {
              // Report failure to backend
              await fetch("/api/payments/payment-failed", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  orderId: order.id,
                  error: response.error,
                }),
              });
            }
          } catch (reportError) {
            console.error("Failed to report payment failure:", reportError);
          }

          if (onPaymentError) {
            onPaymentError(response.error);
          }
          setLoading(false);
        },
      );

      paymentObject.open();
    } catch (error) {
      console.error("Error initiating payment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initiate payment";
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async (): Promise<void> => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError("Authentication required");
          return;
        }

        const response = await fetch(`/api/payments/order/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setOrderDetails(data.order);
        } else {
          setError(data.error || "Failed to fetch order details");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError("Failed to fetch order details");
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Don't render if order is already paid
  if (orderDetails?.paymentStatus === "PAID") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              This order has already been paid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number): string => {
    return (amount / 100).toFixed(2);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Payment
        </h2>
        <p className="text-gray-600">
          Pay securely using UPI, Cards, or Net Banking
        </p>
      </div>

      {orderDetails && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Order ID:</span>
            <span className="text-sm text-gray-900 font-mono">
              #{orderDetails.id.slice(-8)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Amount:</span>
            <span className="text-lg font-bold text-gray-900">
              ₹{formatAmount(orderDetails.netAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Payment Mode:
            </span>
            <span className="text-sm text-gray-900">
              {orderDetails.paymentMode}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !orderDetails}
        className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
          loading || !orderDetails
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </div>
        ) : (
          `Pay ₹${orderDetails ? formatAmount(orderDetails.netAmount) : "0.00"}`
        )}
      </button>

      <div className="mt-6 text-center">
        <div className="text-xs text-gray-500 mb-2">
          Supported Payment Methods:
        </div>
        <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
          <span className="bg-gray-100 px-2 py-1 rounded">UPI</span>
          <span className="bg-gray-100 px-2 py-1 rounded">Cards</span>
          <span className="bg-gray-100 px-2 py-1 rounded">Net Banking</span>
          <span className="bg-gray-100 px-2 py-1 rounded">Wallets</span>
        </div>
      </div>

      <div className="mt-4 flex justify-center items-center space-x-2 text-xs text-gray-400">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Secured by Razorpay</span>
      </div>
    </div>
  );
};

export default OrderPayment;
