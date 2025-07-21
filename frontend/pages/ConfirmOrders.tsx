'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check, Truck, Clock, X } from 'lucide-react';
import Link from 'next/link';
import { Order, OrderStatus } from '@/utils/types';

export default function OrderConfirmation() {
    const router = useRouter();
    const params = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${params?.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch order');

                const data = await response.json();
                setOrder(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load order');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [params?.id, router]);

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case 'PLACED':
                return <Clock className="h-8 w-8 text-yellow-500" />;
            case 'SHIPPED':
                return <Truck className="h-8 w-8 text-blue-500" />;
            case 'DELIVERED':
                return <Check className="h-8 w-8 text-green-500" />;
            default:
                return <X className="h-8 w-8 text-red-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="px-6 py-16 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Order</h2>
                        <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
                        <div className="flex justify-center space-x-3">
                            <Link
                                href="/orders"
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                View All Orders
                            </Link>
                            <Link
                                href="/"
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
                    {getStatusIcon(order.status)}
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Order #{order.id} Confirmed
                </h1>
                <p className="text-gray-600">
                    {order.status === 'PLACED' && 'Your order has been placed successfully'}
                    {order.status === 'SHIPPED' && 'Your order is on its way'}
                    {order.status === 'DELIVERED' && 'Your order has been delivered'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Order Details</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <p className="text-gray-600">Order Number</p>
                            <p>#{order.id}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-gray-600">Date Placed</p>
                            <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-gray-600">Payment Method</p>
                            <p className="capitalize">{order.paymentMode.toLowerCase()}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-gray-600">Payment Status</p>
                            <p className="capitalize">{order.paymentStatus.toLowerCase()}</p>
                        </div>
                        <div className="flex justify-between">
                            <p className="text-gray-600">Order Status</p>
                            <p className="capitalize">{order.status.toLowerCase()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                    <p className="whitespace-pre-line">{order.address}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
                <div className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                        <div key={item.id} className="py-4 flex justify-between">
                            <div className="flex items-center">
                                <div className="h-16 w-16 rounded-md overflow-hidden border border-gray-200 mr-4">
                                    <img
                                        src={item.product.image || '/placeholder-product.png'}
                                        alt={item.product.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-medium">{item.product.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between">
                        <p className="font-medium">Total</p>
                        <p className="font-medium">₹{order.total.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <Link
                    href="/products"
                    className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}