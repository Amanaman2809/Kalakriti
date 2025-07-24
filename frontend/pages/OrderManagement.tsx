'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Truck, Loader2, Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Order, OrderStatus, PaymentStatus } from '@/utils/types';
import { useRouter } from 'next/navigation';

export default function OrdersListPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
    const router = useRouter();

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication token missing');

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/admin`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) throw new Error('Unauthorized access');
                    throw new Error('Failed to fetch orders');
                }

                const data: Order[] = await response.json();
                setOrders(data || []);
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Something went wrong';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusColor = (status: OrderStatus) => {
        return {
            PLACED: 'bg-amber-50 text-amber-800 border-amber-200',
            SHIPPED: 'bg-blue-50 text-blue-800 border-blue-200',
            DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        }[status] || 'bg-gray-50 text-gray-800 border-gray-200';
    };

    const getPaymentStatusColor = (status: PaymentStatus) => {
        return {
            PAID: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
            FAILED: 'bg-rose-50 text-rose-800 border-rose-200',
        }[status] || 'bg-gray-50 text-gray-800 border-gray-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-6 py-16 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Orders</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="flex justify-center space-x-3">
                            <Link
                                href="/admin"
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Link>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-1"
                            >
                                <Loader2 className="h-4 w-4" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-500">View and manage customer orders</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative mt-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            aria-label="Search orders"
                            placeholder="Search orders..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col ">
                        <label className="text-sm font-medium text-gray-700 mb-1">Order Status</label>
                        <select
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                        >
                            <option value="all">All Statuses</option>
                            <option value="PLACED">Placed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <select
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            onChange={(e) => {
                                // Add sorting logic here
                            }}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="total-high">Total (High to Low)</option>
                            <option value="total-low">Total (Low to High)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center">
                        <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                        <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                            }}
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Order ID', 'Customer', 'Date', 'Total', 'Payment', 'Status', 'Actions'].map((h) => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-medium text-gray-900">
                                            #{order.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {order.user?.name || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">{order.user?.email || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                            ₹{order.total.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs rounded-full border ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                    {order.paymentStatus}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({order.paymentMode})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="text-primary flex items-center  hover:text-primary/80"
                                            >
                                                View Details
                                                <ChevronRight className='w-4'/>
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