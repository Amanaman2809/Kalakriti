"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Truck,
  ChevronRight,
} from "lucide-react";

interface OrderSummary {
  count: number;
  amount: number;
}

interface OrderSummaryProps {
  weeklySummary: OrderSummary;
  monthlySummary: OrderSummary;
  TotalSummary: OrderSummary;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  total: number;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export default function UnifiedDashboard() {
  const [stats, setStats] = useState<OrderSummaryProps>({
    weeklySummary: { count: 0, amount: 0 },
    monthlySummary: { count: 0, amount: 0 },
    TotalSummary: { count: 0, amount: 0 },
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/stats`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats({
        weeklySummary: {
          count: data.weekly.totalOrders,
          amount: data.weekly.totalSum,
        },
        monthlySummary: {
          count: data.monthly.totalOrders,
          amount: data.monthly.totalSum,
        },
        TotalSummary: {
          count: data.overall.totalOrders,
          amount: data.overall.totalSum,
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized access");
        throw new Error("Failed to fetch orders");
      }

      const data: Order[] = await response.json();
      setOrders(data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    return (
      {
        PLACED: "bg-amber-50 text-amber-800 border-amber-200",
        SHIPPED: "bg-blue-50 text-blue-800 border-blue-200",
        DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200",
      }[status] || "bg-gray-50 text-gray-800 border-gray-200"
    );
  };

  const StatCard = ({
    title,
    count,
    amount,
    icon: Icon,
  }: {
    title: string;
    count: number;
    amount: number;
    icon: React.ComponentType<any>;
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-secondary`}>
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <TrendingUp className="w-5 h-5 text-primary" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-sm text-gray-500">Orders</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              ₹{amount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your store performance and customer orders
          </p>
        </div>

        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Orders"
              count={stats.TotalSummary.count}
              amount={stats.TotalSummary.amount}
              icon={Package}
            />
            <StatCard
              title="Weekly Orders"
              count={stats.weeklySummary.count}
              amount={stats.weeklySummary.amount}
              icon={Calendar}
            />
            <StatCard
              title="Monthly Orders"
              count={stats.monthlySummary.count}
              amount={stats.monthlySummary.amount}
              icon={DollarSign}
            />
          </div>

          {/* Additional Metrics Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Performance Insights
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-700">
                  Average Order Value
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  ₹
                  {stats.TotalSummary.count > 0
                    ? (
                        stats.TotalSummary.amount / stats.TotalSummary.count
                      ).toFixed(2)
                    : "0.00"}
                </p>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-700">Weekly Growth</h3>
                <p className="text-2xl font-bold text-gray-900">
                  +{stats.weeklySummary.count} orders
                </p>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-700">Monthly Growth</h3>
                <p className="text-2xl font-bold text-gray-900">
                  +{stats.monthlySummary.count} orders
                </p>
              </div>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Orders
              </h2>
              <button
                onClick={() => setActiveTab("orders")}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {orders.slice(0, 5).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Order ID", "Customer", "Total", "Status", "Date"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.user?.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.user?.email || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          ₹{order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  No orders yet
                </h3>
                <p className="mt-1 text-gray-500">
                  Orders will appear here once customers start placing them
                </p>
              </div>
            )}
          </div>
        </>
      </div>
    </div>
  );
}
