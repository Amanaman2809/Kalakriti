"use client";
import { useEffect, useState } from "react";
import {
  Truck,
  Check,
  Clock,
  ArrowLeft,
  ChevronRight,
  Package,
  ShoppingBag,
  Search,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { Order, OrderStatus } from "@/utils/types";
import { toast } from "react-hot-toast";

export default function OrderHistory() {
  const [paying, setPaying] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Unauthorized - Please login");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();
        console.log(data);
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ✅ Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ✅ Complete Payment Handler with Razorpay Integration
  const handleCompletePayment = async (orderId: string) => {
    try {
      setPaying(orderId);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized - Please login");
        return;
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway");
        return;
      }

      // Create Razorpay order
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments/create-razorpay-order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId }),
        },
      );

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData = await orderResponse.json();

      // Configure Razorpay options
      const options = {
        key: orderData.key_id,
        amount: orderData.razorpayOrder.amount,
        currency: orderData.razorpayOrder.currency,
        name: "Chalava",
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
        order_id: orderData.razorpayOrder.id,
        prefill: {
          name: orderData.customer.name,
          email: orderData.customer.email,
          contact: orderData.customer.phone,
        },
        theme: {
          color: "#2a3d66", // Your primary color
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments/verify-payment`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderId,
                }),
              },
            );

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast.success("🎉 Payment successful!", {
                duration: 3000,
                position: "top-center",
              });

              // Refresh orders list
              const updatedOrdersResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );
              if (updatedOrdersResponse.ok) {
                const updatedData = await updatedOrdersResponse.json();
                setOrders(updatedData.orders);
              }

              // Navigate to order details
              window.location.href = `/orders/${orderId}`;
            } else {
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
          } finally {
            setPaying(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(null);
            toast.error("Payment cancelled");
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.on("payment.failed", async function (response: any) {
        console.error("Payment failed:", response.error);

        // Notify backend about payment failure
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payments/payment-failed`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId: orderId,
                error: response.error,
              }),
            },
          );
        } catch (err) {
          console.error("Failed to notify backend about payment failure:", err);
        }

        toast.error(
          `Payment failed: ${response.error.description || "Please try again"}`,
          { duration: 4000 }
        );
        setPaying(null);
      });

      razorpay.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      toast.error(
        err instanceof Error ? err.message : "Unable to start payment"
      );
      setPaying(null);
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    const configs = {
      PLACED: {
        color: "bg-yellow-50 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-4 h-4" />,
        label: "Order Placed",
      },
      SHIPPED: {
        color: "bg-blue-50 text-blue-800 border-blue-200",
        icon: <Truck className="w-4 h-4" />,
        label: "Shipped",
      },
      DELIVERED: {
        color: "bg-green-50 text-green-800 border-green-200",
        icon: <Check className="w-4 h-4" />,
        label: "Delivered",
      },
      CANCELLED: {
        color: "bg-red-50 text-red-800 border-red-200",
        icon: <X className="w-4 h-4" />,
        label: "Cancelled",
      },
    };
    return (
      configs[status] || {
        color: "bg-gray-50 text-gray-800 border-gray-200",
        icon: <Package className="w-4 h-4" />,
        label: status,
      }
    );
  };

  // Filter orders based on search term and status
  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const matchesStatus =
      filterStatus === "ALL" || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center max-w-md">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-accent">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-text mb-2">
                  Unable to Load Orders
                </h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                  {error.includes("Unauthorized") && (
                    <Link
                      href="/login"
                      className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text">Your Orders</h1>
              <p className="text-gray-600 mt-1">
                Track and manage your order history
              </p>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as OrderStatus | "ALL")
                }
                className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              >
                <option value="ALL">All Orders</option>
                <option value="PLACED">Placed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Results Count */}
          {searchTerm && (
            <p className="text-sm text-gray-600 mb-4">
              {filteredOrders.length} result
              {filteredOrders.length !== 1 ? "s" : ""}
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-accent p-12 text-center">
            {orders.length === 0 ? (
              <>
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">
                  No orders yet
                </h3>
                <p className="text-gray-600 mb-8">
                  Your order history will appear here once you make your first
                  purchase
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors font-medium"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Start Shopping
                </Link>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">
                  No matching orders
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("ALL");
                  }}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-accent overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  {/* Order Header */}
                  <div className="p-6 border-b border-accent">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        {order.paymentStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border bg-orange-50 text-orange-800 border-orange-200">
                            <AlertCircle className="w-4 h-4" />
                            Payment Pending
                          </span>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium group"
                        >
                          View Details
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Product Images */}
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div
                              key={index}
                              className="w-12 h-12 rounded-lg border-2 border-white overflow-hidden bg-gray-100"
                            >
                              <img
                                src={
                                  item.product.images?.[0] ||
                                  "/placeholder-product.png"
                                }
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>

                        {/* Order Summary */}
                        <div>
                          <h3 className="font-semibold text-text line-clamp-1">
                            {order.items[0]?.product.name}
                            {order.items.length > 1 &&
                              ` and ${order.items.length - 1} more item${order.items.length > 2 ? "s" : ""}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {order.items.length} item
                            {order.items.length !== 1 ? "s" : ""} •
                            <span className="font-semibold ml-1">
                              ₹{(order.netAmount / 100).toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-3">
                        {order.status === "DELIVERED" && (
                          <Link
                            href={`/products/${order.items[0].productId}`}
                            className="text-sm text-gray-600 hover:text-primary transition-colors"
                          >
                            Buy Again
                          </Link>
                        )}

                        {order.paymentStatus === "PENDING" && (
                          <button
                            onClick={() => handleCompletePayment(order.id)}
                            disabled={paying === order.id}
                            className="flex items-center gap-2 text-sm text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {paying === order.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Complete Payment
                              </>
                            )}
                          </button>
                        )}

                        {order.status !== "DELIVERED" &&
                          order.status !== "CANCELLED" &&
                          order.paymentStatus !== "PENDING" && (
                            <Link
                              href={`/orders/${order.id}`}
                              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                              Track Order
                            </Link>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Support Section */}
        {orders.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-semibold text-text mb-4">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-6">
              Have questions about your order? Our customer support team is here
              to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors font-medium"
              >
                Contact Support
              </Link>
              <Link
                href="/faqs"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"
              >
                View FAQs
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
