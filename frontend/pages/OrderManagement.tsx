'use client';
import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Package,
  Eye,
  Calendar,
  CreditCard,
  User,
  MapPin,
  Download,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import Link from 'next/link';
import { Order, OrderStatus, PaymentStatus } from '@/utils/types';
import { toast } from 'react-hot-toast';

interface OrderStats {
  total: number;
  placed: number;
  shipped: number;
  delivered: number;
  revenue: number;
}

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'total-high' | 'total-low'>('newest');
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    placed: 0,
    shipped: 0,
    delivered: 0,
    revenue: 0
  });

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'total-high':
          return b.total - a.total;
        case 'total-low':
          return a.total - b.total;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const fetchOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized access');
        throw new Error('Failed to fetch orders');
      }

      const data: Order[] = await response.json();
      setOrders(data || []);

      // Calculate stats
      const newStats = data.reduce((acc, order) => {
        acc.total++;
        acc.revenue += order.total;
        switch (order.status) {
          case 'PLACED':
            acc.placed++;
            break;
          case 'SHIPPED':
            acc.shipped++;
            break;
          case 'DELIVERED':
            acc.delivered++;
            break;
        }
        return acc;
      }, { total: 0, placed: 0, shipped: 0, delivered: 0, revenue: 0 });

      setStats(newStats);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    fetchOrders(true);
    toast.success('Orders refreshed');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setSortBy('newest');
  };

  const exportOrders = () => {
    // Implement CSV export
    const csvContent = [
      ['Order ID', 'Customer', 'Date', 'Status', 'Payment', 'Total'].join(','),
      ...filteredOrders.map(order => [
        order.id.slice(0, 8).toUpperCase(),
        order.user?.name || 'N/A',
        new Date(order.createdAt).toLocaleDateString(),
        order.status,
        order.paymentStatus,
        order.total.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Orders exported successfully');
  };

  const getStatusConfig = (status: OrderStatus) => {
    const configs = {
      PLACED: {
        color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        icon: Package,
        trend: 'neutral'
      },
      SHIPPED: {
        color: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: Package,
        trend: 'up'
      },
      DELIVERED: {
        color: 'bg-green-50 text-green-800 border-green-200',
        icon: Package,
        trend: 'up'
      }
    };
    return configs[status];
  };

  const getPaymentStatusConfig = (status: PaymentStatus) => {
    const configs = {
      PAID: { color: 'bg-green-50 text-green-800 border-green-200' },
      PENDING: { color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
      FAILED: { color: 'bg-red-50 text-red-800 border-red-200' }
    };
    return configs[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-red-200">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Orders</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportOrders}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
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
            label: 'Total Orders',
            value: stats.total,
            icon: Package,
            color: 'text-blue-600 bg-blue-50',
            trend: stats.total > 0 ? 'up' : 'neutral'
          },
          {
            label: 'Placed',
            value: stats.placed,
            icon: Package,
            color: 'text-yellow-600 bg-yellow-50',
            trend: 'neutral'
          },
          {
            label: 'Shipped',
            value: stats.shipped,
            icon: Package,
            color: 'text-blue-600 bg-blue-50',
            trend: 'up'
          },
          {
            label: 'Delivered',
            value: stats.delivered,
            icon: Package,
            color: 'text-green-600 bg-green-50',
            trend: 'up'
          },
          {
            label: 'Revenue',
            value: `₹${stats.revenue.toLocaleString()}`,
            icon: CreditCard,
            color: 'text-emerald-600 bg-emerald-50',
            trend: 'up'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Minus;

          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6" />
                </div>
                <TrendIcon className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-500' :
                    stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                  }`} />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, customers, emails..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="min-w-[180px]">
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              >
                <option value="all">All Statuses</option>
                <option value="PLACED">Placed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div className="min-w-[180px]">
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none bg-white"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
              >
                <option value="all">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="min-w-[180px]">
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="total-high">Highest Amount</option>
                <option value="total-low">Lowest Amount</option>
              </select>
            </div>

            {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || sortBy !== 'newest') && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 text-primary hover:text-primary/80 font-medium whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Info */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Orders will appear here when customers make purchases'
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || paymentFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
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
                    { label: 'Order ID', key: 'id' },
                    { label: 'Customer', key: 'customer' },
                    { label: 'Date', key: 'date' },
                    { label: 'Items', key: 'items' },
                    { label: 'Total', key: 'total' },
                    { label: 'Payment', key: 'payment' },
                    { label: 'Status', key: 'status' },
                    { label: 'Actions', key: 'actions' }
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
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
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
                          {order.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {order.user?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{order.total.toLocaleString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusConfig(order.paymentStatus).color}`}>
                          {order.paymentStatus}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.paymentMode}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusConfig(order.status).color}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
