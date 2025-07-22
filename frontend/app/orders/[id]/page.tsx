// frontend/app/orders/[orderId]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Truck, ShieldCheck, Home, ShoppingBag, CreditCard, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Order, OrderStatus, PaymentMode } from '@/utils/types';

const url = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!url) throw new Error('API base URL is not set');

export default function OrderConfirmationPage() {
    const param = useParams();
    const orderId = param?.id;
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch(`${url}/api/orders/${orderId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch order details');
                }

                const data = await response.json();
                console.log(data);
                setOrder(data);
            } catch (err: any) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, router]);

    const getStatusDetails = (status: OrderStatus) => {
        switch (status) {
            case 'PLACED':
                return {
                    title: 'Order Placed',
                    description: 'We\'ve received your order and are preparing it for shipment.',
                    icon: <Clock className="h-5 w-5" />,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-100',
                    nextStep: 'Expected to ship within 24 hours'
                };
            case 'SHIPPED':
                return {
                    title: 'Shipped',
                    description: 'Your order is on its way to you.',
                    icon: <Truck className="h-5 w-5" />,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-100',
                    nextStep: 'Expected delivery in 3-5 business days'
                };
            case 'DELIVERED':
                return {
                    title: 'Delivered',
                    description: 'Your order has been delivered successfully.',
                    icon: <CheckCircle className="h-5 w-5" />,
                    color: 'text-green-500',
                    bgColor: 'bg-green-100',
                    nextStep: null
                };
            default:
                return {
                    title: 'Order Processing',
                    description: 'We\'re getting your order ready.',
                    icon: <ShoppingBag className="h-5 w-5" />,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-100',
                    nextStep: null
                };
        }
    };

    const getPaymentMethodDetails = (method: PaymentMode) => {
        switch (method) {
            case 'COD':
                return {
                    name: 'Cash on Delivery',
                    icon: <Truck className="h-5 w-5" />
                };
            case 'ONLINE':
                return {
                    name: 'Online Payment',
                    icon: <CreditCard className="h-5 w-5" />
                };
            default:
                return {
                    name: 'Unknown',
                    icon: <CreditCard className="h-5 w-5" />
                };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4">Loading your order details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold">Order not found</h2>
                    <p className="mt-2 text-gray-600">We couldn't find the order you're looking for</p>
                    <Link
                        href="/orders"
                        className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                        View All Orders
                    </Link>
                </div>
            </div>
        );
    }

    const statusDetails = getStatusDetails(order.status);
    const paymentMethodDetails = getPaymentMethodDetails(order.paymentMode);
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {/* Confirmation Header */}
            <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
                <p className="text-lg text-gray-600 mb-4">
                    Thank you for your purchase. Your order #{order.id.slice(0, 8).toUpperCase()} has been received.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Status */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-6">Order Status</h2>
                        <div className="flex items-start gap-4">
                            <div className={`rounded-full p-2 ${statusDetails.bgColor} ${statusDetails.color}`}>
                                {statusDetails.icon}
                            </div>
                            <div>
                                <h3 className={`font-medium ${statusDetails.color}`}>
                                    {statusDetails.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {statusDetails.description}
                                </p>
                                {statusDetails.nextStep && (
                                    <p className="text-xs text-gray-400 mt-1">{statusDetails.nextStep}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-6">Order Details</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Order Number</h3>
                                    <p className="mt-1">{order.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                                    <p className="mt-1">{orderDate}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {paymentMethodDetails.icon}
                                        <span>{paymentMethodDetails.name}</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                                    <p className="mt-1">₹{order.total.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                        <div className="space-y-1">
                            {order.address ? (
                                <div>
                                    <h3 className="font-medium">{order.address.street}</h3>
                                    <p className="text-sm text-gray-600">
                                        {order.address.city}, {order.address.state}, {order.address.country} - {order.address.postalCode}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Phone: {order.address.phone}</p>
                                </div>
                            ) : (
                                <p className="text-gray-500">No shipping address available</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-4">Your Items</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 rounded-md border overflow-hidden">
                                        <img
                                            src={item.product.images[0] || '/placeholder-product.png'}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">{item.product.name}</h3>
                                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                        <p className="text-sm font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="border-t pt-4">
                                <div className="flex justify-between font-medium">
                                    <span>Total</span>
                                    <span>₹{order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support & Next Steps */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-gray-500" />
                                <span className="text-sm">30-Day Return Policy</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Truck className="h-5 w-5 text-gray-500" />
                                <span className="text-sm">Track Your Order</span>
                            </div>
                            <div className="pt-4">
                                <Link
                                    href="/contact"
                                    className="block text-center py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Continue Shopping */}
                    <Link
                        href="/products"
                        className="block w-full py-3 bg-primary text-white rounded-md text-center hover:bg-primary/90"
                    >
                        Continue Shopping
                    </Link>

                    {/* Back to Home */}
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <Home className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}