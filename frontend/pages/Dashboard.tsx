"use client";
import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Truck,
  ChevronRight,
  Eye,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface OrderSummary {
  count: number;
  amount: number;
}

interface Stats {
  weeklySummary: OrderSummary;
  monthlySummary: OrderSummary;
  TotalSummary: OrderSummary;
}

interface Order {
  id: string;
  status: "PLACED" | "SHIPPED" | "DELIVERED";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  paymentMode: string;
  total: number;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    weeklySummary: { count: 0, amount: 0 },
    monthlySummary: { count: 0, amount: 0 },
    TotalSummary: { count: 0, amount: 0 },
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get order and sales data
  const fetchStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load data");

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
      console.log(error);
      toast.error("Could not load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Get recent orders
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: Order[] = await response.json();
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Could not load orders:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchStats(true);
    fetchOrders();
    toast.success("Dashboard updated");
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLACED": return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "SHIPPED": return "bg-blue-50 text-blue-800 border-blue-200";
      case "DELIVERED": return "bg-green-50 text-green-800 border-green-200";
      default: return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const StatCard = ({
    title,
    count,
    amount,
    icon: Icon,
    description,
  }: {
    title: string;
    count: number;
    amount: number;
    icon: React.ComponentType<any>;
    description: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>

        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-sm text-gray-500">Orders</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">₹{amount?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Sales</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Here&apos;s how your store is doing</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="All Time"
            count={stats.TotalSummary.count}
            amount={stats.TotalSummary.amount}
            icon={Package}
            description="Total orders and sales"
          />
          <StatCard
            title="This Week"
            count={stats.weeklySummary.count}
            amount={stats.weeklySummary.amount}
            icon={Calendar}
            description="Last 7 days"
          />
          <StatCard
            title="This Month"
            count={stats.monthlySummary.count}
            amount={stats.monthlySummary.amount}
            icon={TrendingUp}
            description="Current month"
          />
        </div>

        {/* Quick Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Info</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Average Order</h3>
              <p className="text-2xl font-bold text-gray-900">
                ₹{stats.TotalSummary.count > 0
                  ? Math.round(stats.TotalSummary.amount / stats.TotalSummary.count)
                  : 0}
              </p>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Weekly Orders</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklySummary.count}</p>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Monthly Orders</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.monthlySummary.count}</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-600 mt-1">Latest customer orders</p>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              View all orders
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-6">
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-mono text-sm font-semibold text-gray-900">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {order.user?.name || "Guest"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.user?.email || "No email"}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status === "PLACED" && <Clock className="w-3 h-3" />}
                            {order.status === "SHIPPED" && <Truck className="w-3 h-3" />}
                            {order.status === "DELIVERED" && <CheckCircle className="w-3 h-3" />}
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900">
                            ₹{order.total.toLocaleString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-primary hover:text-primary/80"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600">Orders will show up here when customers place them</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
