'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2,
    CheckCircle,
    Truck,
    ShieldCheck,
    Home,
    ShoppingBag,
    CreditCard,
    Clock,
    ChevronLeft,
    ChevronRight,
    Package,
    PackageCheck,
    MapPin,
    Phone,
    Copy,
    ExternalLink,
    Star,
    Share2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Order, OrderStatus, PaymentMode } from '@/utils/types';

const url = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!url) throw new Error('API base URL is not set');

const ORDER_STATUS_FLOW: OrderStatus[] = ['PLACED', 'SHIPPED', 'DELIVERED'];

export default function OrderConfirmationPage() {
    const params = useParams();
    const orderId = params?.id;
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTrackingExpanded, setIsTrackingExpanded] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!orderId) return;

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
                    throw new Error(response.status === 404
                        ? 'Order not found'
                        : 'Failed to fetch order details');
                }

                const data = await response.json();
                setOrder(data);
            } catch (err: any) {
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();

        if (!order || order.status !== 'DELIVERED') {
            const intervalId = setInterval(fetchOrder, 100000);
            return () => clearInterval(intervalId);
        }
    }, [orderId, router, order?.status]);

    const getStatusDetails = (status: OrderStatus) => {
        const statusConfig = {
            PLACED: {
                title: 'Order Placed',
                description: 'We\'ve received your order and are preparing it for shipment.',
                icon: <ShoppingBag className="h-6 w-6" />,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-100',
                progress: 25,
                nextStep: 'Expected to ship within 24 hours'
            },
            SHIPPED: {
                title: 'Shipped',
                description: 'Your order has left our fulfillment center and is on its way.',
                icon: <Truck className="h-6 w-6" />,
                color: 'text-blue-600',
                bgColor: 'bg-blue-100',
                progress: 65,
                nextStep: 'Expected delivery in 3-5 business days'
            },
            DELIVERED: {
                title: 'Delivered',
                description: 'Your order has been delivered successfully. Enjoy your purchase!',
                icon: <PackageCheck className="h-6 w-6" />,
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                progress: 100,
                nextStep: null
            }
        };

        return statusConfig[status] || {
            title: 'Order Received',
            description: 'We\'re getting your order ready.',
            icon: <Clock className="h-6 w-6" />,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
            progress: 10,
            nextStep: null
        };
    };

    const getPaymentMethodDetails = (method: PaymentMode) => {
        switch (method) {
            case 'COD':
                return {
                    name: 'Cash on Delivery',
                    icon: <Truck className="h-5 w-5" />,
                    description: 'Pay when you receive your order'
                };
            case 'ONLINE':
                return {
                    name: 'Online Payment',
                    icon: <CreditCard className="h-5 w-5" />,
                    description: 'Payment completed securely online'
                };
            default:
                return {
                    name: 'Unknown',
                    icon: <CreditCard className="h-5 w-5" />,
                    description: 'Payment method not specified'
                };
        }
    };

    const copyOrderId = () => {
        navigator.clipboard.writeText(order?.id || '');
        setCopied(true);
        toast.success('Order ID copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOrder = async () => {
        if (navigator.share && order) {
            try {
                await navigator.share({
                    title: 'My Order from Kalakriti',
                    text: `Check out my order #${order.id.slice(0, 8).toUpperCase()}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Order link copied to clipboard!');
        }
    };

    const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order?.status || 'PLACED');
    const isOrderComplete = order?.status === 'DELIVERED';

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-red-500">⚠️</span>
                        </div>
                        <h3 className="text-xl font-semibold text-text mb-2">Unable to Load Order</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Try Again
                            </button>
                            <Link
                                href="/orders"
                                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                View All Orders
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-6 py-8">
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
            </div>
        );
    }

    const statusDetails = getStatusDetails(order.status);
    const paymentMethodDetails = getPaymentMethodDetails(order.paymentMode);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Navigation Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <Link
                        href="/orders"
                        className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Back to Orders
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={shareOrder}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
                        >
                            <Home className="h-4 w-4" />
                            Home
                        </Link>
                    </div>
                </div>

                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-text mb-4">
                        {isOrderComplete ? 'Order Delivered!' : 'Order Confirmed!'}
                    </h1>
                    <p className="text-xl text-gray-600 mb-4">
                        {isOrderComplete
                            ? 'Your order has been successfully delivered. Thank you for shopping with us!'
                            : 'Thank you for your purchase! Your order has been received and is being processed.'
                        }
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl">
                            <span className="text-sm text-gray-600">Order ID:</span>
                            <span className="font-mono font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
                            <button
                                onClick={copyOrderId}
                                className="text-gray-400 hover:text-primary transition-colors"
                                title="Copy order ID"
                            >
                                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Tracking & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Enhanced Order Tracking */}
                        <div className="bg-white rounded-2xl shadow-sm border border-accent overflow-hidden">
                            <button
                                className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                                onClick={() => setIsTrackingExpanded(!isTrackingExpanded)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`rounded-full p-3 ${statusDetails.bgColor}`}>
                                        <div className={statusDetails.color}>
                                            {statusDetails.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-text">{statusDetails.title}</h2>
                                        <p className="text-gray-600">{statusDetails.description}</p>
                                    </div>
                                </div>
                                <ChevronRight
                                    className={`h-5 w-5 text-gray-400 transition-transform ${isTrackingExpanded ? 'rotate-90' : ''}`}
                                />
                            </button>

                            {isTrackingExpanded && (
                                <div className="px-6 pb-6 border-t border-accent">
                                    {/* Progress Bar */}
                                    <div className="mb-8">
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="h-3 rounded-full bg-primary transition-all duration-500"
                                                style={{ width: `${statusDetails.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status Timeline */}
                                    <div className="space-y-8 relative">
                                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                        {ORDER_STATUS_FLOW.map((status, index) => {
                                            const statusInfo = getStatusDetails(status);
                                            const isCompleted = index < currentStatusIndex;
                                            const isCurrent = index === currentStatusIndex;
                                            const isFuture = index > currentStatusIndex;

                                            if (isOrderComplete && isFuture) return null;

                                            return (
                                                <div key={status} className="relative flex items-center gap-6">
                                                    <div
                                                        className={`relative z-10 w-12 h-12 rounded-full border-4 flex items-center justify-center ${isCurrent
                                                                ? `${statusInfo.bgColor} ${statusInfo.color} border-white shadow-lg`
                                                                : isCompleted
                                                                    ? 'bg-green-100 text-green-600 border-white'
                                                                    : 'bg-gray-100 text-gray-400 border-white'
                                                            }`}
                                                    >
                                                        {isCompleted ? <CheckCircle className="h-6 w-6" /> : statusInfo.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className={`font-semibold ${isCurrent || isCompleted ? 'text-text' : 'text-gray-400'}`}>
                                                            {statusInfo.title}
                                                        </h3>
                                                        <p className={`text-sm ${isCurrent || isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                                                            {statusInfo.description}
                                                        </p>
                                                        {isCurrent && statusInfo.nextStep && (
                                                            <p className="text-xs text-primary mt-1 font-medium">{statusInfo.nextStep}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Shipping Details */}
                                    {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                                        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                                            <h4 className="font-semibold text-blue-800 mb-4">Shipping Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-blue-600 font-medium">Carrier</p>
                                                    <p className="text-blue-800">{order.carrierName || 'Standard Shipping'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-blue-600 font-medium">Tracking Number</p>
                                                    <p className="font-mono text-blue-800">
                                                        {order.trackingNumber || order.id.slice(0, 12).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
                            <h2 className="text-xl font-bold text-text mb-6">Order Summary</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Order Date</h3>
                                    <p className="text-text font-medium">
                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Method</h3>
                                    <div className="flex items-center gap-2">
                                        {paymentMethodDetails.icon}
                                        <div>
                                            <p className="text-text font-medium">{paymentMethodDetails.name}</p>
                                            <p className="text-xs text-gray-500">{paymentMethodDetails.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
                            <h2 className="text-xl font-bold text-text mb-4">Shipping Address</h2>
                            {order.address ? (
                                <div className="space-y-2">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-text">{order.address.street}</p>
                                            <p className="text-gray-600">
                                                {order.address.city}, {order.address.state}
                                            </p>
                                            <p className="text-gray-600">
                                                {order.address.country} - {order.address.postalCode}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <p className="text-gray-600">{order.address.phone}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">No shipping address available</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Items & Actions */}
                    <div className="space-y-6">
                        {/* Order Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
                            <h2 className="text-xl font-bold text-text mb-6">Order Items</h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl">
                                        <div className="w-16 h-16 rounded-lg border overflow-hidden flex-shrink-0">
                                            <img
                                                src={item.product.images[0] || '/placeholder-product.png'}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-text line-clamp-2">{item.product.name}</h3>
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                <p className="font-semibold text-text">₹{(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                            {order.status === 'DELIVERED' && (
                                                <div className="flex gap-2 mt-3">
                                                    <Link
                                                        href={`/products/${item.productId}`}
                                                        className="text-xs text-primary hover:text-primary/80 font-medium"
                                                    >
                                                        Buy Again
                                                    </Link>
                                                    <button className="text-xs text-gray-500 hover:text-primary">
                                                        Rate & Review
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Order Total */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-text">Total</span>
                                        <span className="text-xl font-bold text-primary">₹{order.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
                            <h2 className="text-xl font-bold text-text mb-4">Quick Actions</h2>
                            <div className="space-y-3">
                                <Link
                                    href="/contact"
                                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="font-medium text-text">Contact Support</span>
                                </Link>
                                <Link
                                    href="/orders"
                                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <Package className="h-4 w-4 text-green-600" />
                                    </div>
                                    <span className="font-medium text-text">View All Orders</span>
                                </Link>
                            </div>
                        </div>

                        {/* Continue Shopping */}
                        <Link
                            href="/products"
                            className="block w-full py-4 bg-primary text-white text-center rounded-2xl hover:shadow-lg transition-all font-semibold"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
