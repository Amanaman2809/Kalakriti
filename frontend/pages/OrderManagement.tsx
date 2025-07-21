'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, Search, Truck, Plus } from 'lucide-react';
import Link from 'next/link';

import { Order,OrderStatus} from '@/utils/types';

export default function OrdersManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Unauthorized access');
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch orders');

                const data = await response.json();
                setOrders(data.orders || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Auth token not found');
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update order');

            const updatedOrder: Order = await response.json();

            setOrders(prev =>
                prev.map(order => order.id === orderId ? updatedOrder : order)
            );
        } catch (err) {
            console.error('Error updating order:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) return (
        <div className="px-6 py-16 bg-accent min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Orders</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="flex justify-center space-x-3">
                        <Link
                            href="/admin"
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            <ArrowLeft className="inline mr-1 h-4 w-4" /> Back to Dashboard
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders by ID or customer..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Status:</label>
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                        >
                            <option value="all">All Orders</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center">
                        <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                        <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            #{order.id}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.user?.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {order.user?.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₹{order.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                                            order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium ${order.status === 'PLACED' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                            'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-primary hover:text-primary/80 p-1 rounded-md hover:bg-primary/10"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}