"use client";
import { useEffect, useState } from "react";
import Select, { MultiValue } from "react-select";
import {
  Search,
  Filter,
  RefreshCw,
  Package,
  Eye,
  Calendar,
  CreditCard,
  Download,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingBag,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

type StatusOption = {
  value: "PLACED" | "SHIPPED" | "DELIVERED";
  label: string;
};

type PaymentStatusOption = {
  value: "PAID" | "PENDING" | "FAILED";
  label: string;
};

// Types (keeping your original types)
interface Order {
  id: string;
  user?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  status: "PLACED" | "SHIPPED" | "DELIVERED";
  paymentStatus: "PAID" | "PENDING" | "FAILED";
  paymentMode: string;
  total: number;
  items?: any[];
}

interface OrderStats {
  total: number;
  placed: number;
  shipped: number;
  delivered: number;
  revenue: number;
}

interface OrderFilters {
  start?: string;
  end?: string;
  status?: ("PLACED" | "SHIPPED" | "DELIVERED")[];
  paymentStatus?: ("PAID" | "PENDING" | "FAILED")[];
  sortBy:
    | "createdAt"
    | "total"
    | "updatedAt"
    | "shippedAt"
    | "deliveredAt"
    | "status"
    | "paymentStatus";
  sortOrder: "asc" | "desc";
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface ApiResponse {
  orders: Order[];
  pagination: PaginationInfo;
  filters: OrderFilters;
}

interface FilterOptions {
  statusOptions: { value: "PLACED" | "SHIPPED" | "DELIVERED"; count: number }[];
  paymentStatusOptions: {
    value: "PAID" | "PENDING" | "FAILED";
    count: number;
  }[];
  dateRange: { earliest: string; latest: string };
  sortOptions: { value: string; label: string }[];
}

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Enhanced filters
  const [filters, setFilters] = useState<OrderFilters>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 25,
  });

  // Initialize with default filter options to prevent null issues
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statusOptions: [
      { value: "PLACED", count: 0 },
      { value: "SHIPPED", count: 0 },
      { value: "DELIVERED", count: 0 },
    ],
    paymentStatusOptions: [
      { value: "PAID", count: 0 },
      { value: "PENDING", count: 0 },
      { value: "FAILED", count: 0 },
    ],
    dateRange: { earliest: "", latest: "" },
    sortOptions: [
      { value: "createdAt", label: "Order Date" },
      { value: "total", label: "Order Total" },
      { value: "updatedAt", label: "Last Updated" },
      { value: "status", label: "Order Status" },
      { value: "paymentStatus", label: "Payment Status" },
    ],
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    placed: 0,
    shipped: 0,
    delivered: 0,
    revenue: 0,
  });

  // Mock toast for demonstration (replace with your actual toast implementation)
  const toast = {
    success: (message: string) => {
      console.log("Success:", message);
      // Replace with your actual toast implementation:
      // toast.success(message);
    },
    error: (message: string) => {
      console.log("Error:", message);
      // Replace with your actual toast implementation:
      // toast.error(message);
    },
  };

  // Build query parameters for API call
  const buildQueryParams = (page = 1) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", pagination.limit.toString());
    params.append("sortBy", filters.sortBy);
    params.append("sortOrder", filters.sortOrder);

    if (filters.start) params.append("start", filters.start);
    if (filters.end) params.append("end", filters.end);
    if (filters.status?.length) {
      filters.status.forEach((status) => params.append("status", status));
    }
    if (filters.paymentStatus?.length) {
      filters.paymentStatus.forEach((status) =>
        params.append("paymentStatus", status),
      );
    }

    return params.toString();
  };

  // Fixed authentication token retrieval
  const getAuthToken = () => {
    return localStorage.getItem("token");
    // return cookies.get("authToken");
    // return authContext.token;
  };

  const fetchOrders = async (page = 1, showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const token = getAuthToken();
      if (!token) {
        // For demo purposes, create mock data instead of throwing error
        console.warn("No auth token - using mock data for demonstration");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

        // Generate mock data
        const mockOrders = Array.from({ length: 25 }, (_, i) => ({
          id: `order-${String(i + 1).padStart(8, "0")}`,
          user: {
            name: ["John Doe", "Jane Smith", "Alice Johnson", "Bob Wilson"][
              i % 4
            ],
            email: `user${i + 1}@example.com`,
          },
          createdAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: ["PLACED", "SHIPPED", "DELIVERED"][
            Math.floor(Math.random() * 3)
          ] as any,
          paymentStatus: ["PAID", "PENDING", "FAILED"][
            Math.floor(Math.random() * 3)
          ] as any,
          paymentMode: ["Credit Card", "UPI", "Cash on Delivery"][
            Math.floor(Math.random() * 3)
          ],
          total: Math.floor(Math.random() * 50000) + 500,
          items: Array.from(
            { length: Math.floor(Math.random() * 5) + 1 },
            (_, j) => ({ id: j }),
          ),
        }));

        setOrders(mockOrders);
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          totalPages: 6,
          totalCount: 150,
          hasNextPage: page < 6,
          hasPrevPage: page > 1,
        }));

        // Calculate mock stats
        const mockStats = {
          total: 150,
          placed: 45,
          shipped: 32,
          delivered: 73,
          revenue: mockOrders.reduce((sum, order) => sum + order.total, 0),
        };
        setStats(mockStats);
        setError(null);
        return;
      }

      // Your actual API call (currently commented for demo)
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const queryParams = buildQueryParams(page);

      const response = await fetch(
        `${API_BASE_URL}/api/orders/admin/orders?${queryParams}`,
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

      const data: ApiResponse = await response.json();
      setOrders(data.orders || []);
      setPagination(data.pagination);

      // Calculate stats from API response
      const newStats = data.orders.reduce(
        (acc, order) => {
          acc.total = data.pagination.totalCount;
          acc.revenue += order.total;
          switch (order.status) {
            case "PLACED":
              acc.placed++;
              break;
            case "SHIPPED":
              acc.shipped++;
              break;
            case "DELIVERED":
              acc.delivered++;
              break;
          }
          return acc;
        },
        { total: 0, placed: 0, shipped: 0, delivered: 0, revenue: 0 },
      );

      setStats(newStats);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token - using default filter options");
        return;
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(
        `${API_BASE_URL}/api/orders/admin/orders/filters`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      } else {
        console.warn("Failed to fetch filter options, using defaults");
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchFilterOptions();
  }, [filters]);

  const handleRefresh = () => {
    fetchOrders(pagination.currentPage, true);
    toast.success("Orders refreshed");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setShowAdvancedFilters(false);
  };

  const applyDateFilter = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    setFilters((prev) => ({
      ...prev,
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    }));
  };

  const exportOrders = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        // For demo, export current visible orders
        const csvContent = [
          [
            "Order ID",
            "Customer",
            "Email",
            "Date",
            "Status",
            "Payment Status",
            "Payment Mode",
            "Total",
            "Items",
          ].join(","),
          ...orders.map((order) =>
            [
              order.id.slice(0, 8).toUpperCase(),
              `"${order.user?.name || "N/A"}"`,
              order.user?.email || "N/A",
              new Date(order.createdAt).toLocaleDateString(),
              order.status,
              order.paymentStatus,
              order.paymentMode,
              order.total.toFixed(2),
              order.items?.length || 0,
            ].join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Orders exported successfully");
        return;
      }

      // Your actual export logic for production
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      // const queryParams = buildQueryParams(1).replace("limit=25", "limit=1000");

      const response = await fetch(`${API_BASE_URL}/api/orders/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch orders for export");

      const data: ApiResponse = await response.json();
      console.log(data);

      const csvContent = [
        [
          "Order ID",
          "Customer",
          "Email",
          "Date",
          "Status",
          "Payment Status",
          "Payment Mode",
          "Total",
          "Items",
        ].join(","),
        ...data.orders.map((order) =>
          [
            order.id.slice(0, 8).toUpperCase(),
            `"${order.user?.name || "N/A"}"`,
            order.user?.email || "N/A",
            new Date(order.createdAt).toLocaleDateString(),
            order.status,
            order.paymentStatus,
            order.paymentMode,
            order.total.toFixed(2),
            order.items?.length || 0,
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Orders exported successfully");
    } catch (e) {
      console.log(e);
      toast.error("Failed to export orders");
    }
  };

  // Filter orders by search term (client-side filtering for better UX)
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchLower) ||
      order.user?.name?.toLowerCase().includes(searchLower) ||
      order.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusConfig = (status: "PLACED" | "SHIPPED" | "DELIVERED") => {
    const configs = {
      PLACED: {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Clock,
        trend: "neutral",
      },
      SHIPPED: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Package,
        trend: "up",
      },
      DELIVERED: {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle,
        trend: "up",
      },
    };
    return configs[status] || configs.PLACED;
  };

  const getPaymentStatusConfig = (status: "PAID" | "PENDING" | "FAILED") => {
    const configs = {
      PAID: {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle,
      },
      PENDING: {
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Clock,
      },
      FAILED: {
        color: "bg-rose-100 text-rose-800 border-rose-200",
        icon: AlertCircle,
      },
    };
    return configs[status] || configs.PENDING;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-20 rounded-full blur-sm"></div>
          </div>
          <p className="text-gray-600 mt-2">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-red-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Orders
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all customer orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 bg-white shadow-sm"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={exportOrders}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 transition-all shadow-md"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Orders",
            value: pagination.totalCount,
            icon: ShoppingBag,
            color: "text-blue-600 bg-blue-50",
            trend: "up",
            change: "+12%",
          },
          {
            label: "Placed",
            value: stats.placed,
            icon: Clock,
            color: "text-amber-600 bg-amber-50",
            trend: "neutral",
            change: "+5%",
          },
          {
            label: "Shipped",
            value: stats.shipped,
            icon: Package,
            color: "text-indigo-600 bg-indigo-50",
            trend: "up",
            change: "+18%",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle,
            color: "text-emerald-600 bg-emerald-50",
            trend: "up",
            change: "+22%",
          },
          {
            label: "Revenue",
            value: `₹${stats.revenue.toLocaleString()}`,
            icon: CreditCard,
            color: "text-purple-600 bg-purple-50",
            trend: "up",
            change: "+15%",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.trend === "up"
              ? TrendingUp
              : stat.trend === "down"
                ? TrendingDown
                : Minus;

          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <TrendIcon
                    className={`h-3 w-3 ${
                      stat.trend === "up"
                        ? "text-emerald-500"
                        : stat.trend === "down"
                          ? "text-rose-500"
                          : "text-amber-500"
                    }`}
                  />
                  <span
                    className={
                      stat.trend === "up"
                        ? "text-emerald-600"
                        : stat.trend === "down"
                          ? "text-rose-600"
                          : "text-amber-600"
                    }
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, customers, emails..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-3 bg-primary text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
          >
            <Filter className="h-4 w-4" />
            {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
          </button>
        </div>

        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyDateFilter(1)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            Today
          </button>
          <button
            onClick={() => applyDateFilter(7)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            Last 7 days
          </button>
          <button
            onClick={() => applyDateFilter(30)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            Last 30 days
          </button>
          <button
            onClick={() => applyDateFilter(90)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors bg-white"
          >
            Last 90 days
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Advanced Filters
            </h3>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50"
                value={filters.start || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, start: e.target.value }))
                }
                max={filters.end || new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50"
                value={filters.end || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, end: e.target.value }))
                }
                min={filters.start}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Order Status
              </label>

              <Select
                isMulti
                options={filterOptions.statusOptions.map(
                  (o): StatusOption => ({
                    value: o.value as StatusOption["value"],
                    label: `${o.value} (${o.count})`,
                  }),
                )}
                value={(filters.status || []).map((s) => ({
                  value: s as StatusOption["value"],
                  label: s,
                }))}
                onChange={(selected: MultiValue<StatusOption>) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: selected.map((s) => s.value),
                  }))
                }
              />
            </div>

            {/* Payment Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Payment Status
              </label>
              <Select
                isMulti
                options={filterOptions.paymentStatusOptions.map(
                  (o): PaymentStatusOption => ({
                    value: o.value as PaymentStatusOption["value"],
                    label: `${o.value} (${o.count})`,
                  }),
                )}
                value={(filters.paymentStatus || []).map((p) => ({
                  value: p as PaymentStatusOption["value"],
                  label: p,
                }))}
                onChange={(selected: MultiValue<PaymentStatusOption>) =>
                  setFilters((prev) => ({
                    ...prev,
                    paymentStatus: selected.map((p) => p.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                {/* Sort By Dropdown */}
                <select
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50"
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value as any,
                    }))
                  }
                >
                  {filterOptions.sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <select
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-gray-50"
                value={filters.sortOrder}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortOrder: e.target.value as "asc" | "desc",
                  }))
                }
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm ||
              Object.keys(filters).some(
                (key) =>
                  key !== "sortBy" &&
                  key !== "sortOrder" &&
                  filters[key as keyof OrderFilters],
              )
                ? "Try adjusting your search or filter criteria"
                : "Orders will appear here when customers make purchases"}
            </p>
            {(searchTerm ||
              Object.keys(filters).some(
                (key) =>
                  key !== "sortBy" &&
                  key !== "sortOrder" &&
                  filters[key as keyof OrderFilters],
              )) && (
              <button
                onClick={clearFilters}
                className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { label: "Order ID", key: "id" },
                    { label: "Customer", key: "customer" },
                    { label: "Date", key: "date" },
                    { label: "Items", key: "items" },
                    { label: "Total", key: "total" },
                    { label: "Payment", key: "payment" },
                    { label: "Status", key: "status" },
                    { label: "Actions", key: "actions" },
                  ].map((header) => (
                    <th
                      key={header.key}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusConfig(order.status).icon;
                  const PaymentStatusIcon = getPaymentStatusConfig(
                    order.paymentStatus,
                  ).icon;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-mono font-semibold text-gray-900">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold mr-4">
                            {order.user?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {order.user?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-600">
                              {order.user?.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.items?.length || 0} item
                          {(order.items?.length || 0) !== 1 ? "s" : ""}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{order.total.toLocaleString()}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusConfig(order.paymentStatus).color}`}
                          >
                            <PaymentStatusIcon className="h-3 w-3 mr-1" />
                            {order.paymentStatus}
                          </span>
                          <span className="text-xs text-gray-500">
                            {order.paymentMode}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusConfig(order.status).color}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-2 text-primary hover:text-blue-800 font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.currentPage >=
                      pagination.totalPages - 2
                    ) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          pagination.currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}

                {pagination.totalPages > 5 &&
                  pagination.currentPage < pagination.totalPages - 2 && (
                    <>
                      <span className="px-2 py-2 text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700"
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-sm text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
