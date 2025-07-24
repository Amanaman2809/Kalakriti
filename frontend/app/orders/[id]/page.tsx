'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Truck, ShieldCheck, Home, ShoppingBag, CreditCard, Clock, ChevronLeft, ChevronRight, Package, PackageOpen, PackageCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Order, OrderStatus, PaymentMode } from '@/utils/types';

const url = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!url) throw new Error('API base URL is not set');

// Define all possible order statuses in sequence from your schema
const ORDER_STATUS_FLOW: OrderStatus[] = ['PLACED', 'SHIPPED', 'DELIVERED'];

export default function OrderConfirmationPage() {
    const params = useParams();
    const orderId = params?.id;
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isTrackingExpanded, setIsTrackingExpanded] = useState(true);

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

        // Initial fetch
        fetchOrder();

        if (!order || order.status !== 'DELIVERED') {
            const intervalId = setInterval(fetchOrder, 100000); // Poll every 100 seconds

            return () => clearInterval(intervalId);
        }
    }, [orderId, router,order?.status]);

    const getStatusDetails = (status: OrderStatus) => {
        const statusConfig = {
            PLACED: {
                title: 'Order Placed',
                description: 'We\'ve received your order and are preparing it for shipment.',
                icon: <ShoppingBag className="h-5 w-5" />,
                color: 'text-yellow-500',
                bgColor: 'bg-yellow-100',
                progress: 25,
                nextStep: 'Expected to ship within 24 hours'
            },
            SHIPPED: {
                title: 'Shipped',
                description: 'Your order has left our fulfillment center.',
                icon: <Truck className="h-5 w-5" />,
                color: 'text-blue-500',
                bgColor: 'bg-blue-100',
                progress: 65,
                nextStep: 'Expected delivery in 3-5 business days'
            },
            DELIVERED: {
                title: 'Delivered',
                description: 'Your order has been delivered successfully.',
                icon: <PackageCheck className="h-5 w-5" />,
                color: 'text-green-500',
                bgColor: 'bg-green-100',
                progress: 100,
                nextStep: null
            }
        };

        return statusConfig[status] || {
            title: 'Order Received',
            description: 'We\'re getting your order ready.',
            icon: <Clock className="h-5 w-5" />,
            color: 'text-gray-500',
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

    // Calculate the current status index for progress tracking
    const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order?.status || 'PLACED');
    const isOrderComplete = order?.status === 'DELIVERED';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    <p>{error}</p>
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 border border-gray-300 rounded-md"
                        >
                            Try again
                        </button>
                        <Link
                            href="/orders"
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                        >
                            View All Orders
                        </Link>
                    </div>
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

    // Format estimated delivery date
    const estimatedDeliveryDate = order.estimatedDelivery
        ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        })
        : 'Calculating...';

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {/* Navigation Header */}
            <div className="flex items-center mb-6">
                <Link href="/orders" className="flex items-center text-gray-600 hover:text-gray-900">
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back to Orders
                </Link>
                <Link href="/" className="ml-auto flex items-center text-gray-600 hover:text-gray-900">
                    <Home className="h-5 w-5 mr-1" />
                    Back to Home
                </Link>
            </div>

            {/* Confirmation Header */}
            <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
                <p className="text-lg text-gray-600 mb-4">
                    Thank you for your purchase. Your order #{order.id.slice(0, 8).toUpperCase()} has been received.
                </p>
                {order.user?.email && (
                    <p className="text-gray-500">
                        A confirmation email has been sent to {order.user.email}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Order Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Enhanced Order Tracking with Dropdown */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <button
                            className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                            onClick={() => setIsTrackingExpanded(!isTrackingExpanded)}
                            aria-expanded={isTrackingExpanded}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`rounded-full p-2 ${statusDetails.bgColor} ${statusDetails.color}`}>
                                    {statusDetails.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Order Tracking</h2>
                                    <p className="text-sm text-gray-500">
                                        {statusDetails.title}
                                        {order.status === 'SHIPPED' && order.trackingNumber && (
                                            <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                {order.trackingNumber}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight
                                className={`h-5 w-5 text-gray-400 transition-transform ${isTrackingExpanded ? 'rotate-90' : ''}`}
                            />
                        </button>

                        {isTrackingExpanded && (
                            <div className="p-6 pt-2 border-t">
                                {/* Estimated Delivery */}
                                {!isOrderComplete && (
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Truck className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <h3 className="font-medium text-blue-800">Estimated Delivery</h3>
                                                <p className="text-sm text-blue-600">
                                                    {estimatedDeliveryDate}
                                                    {statusDetails.nextStep && (
                                                        <span className="block mt-1">{statusDetails.nextStep}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                <div className="my-6">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="h-2.5 rounded-full bg-primary"
                                            style={{ width: `${statusDetails.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-6 border-l-2 border-gray-200 relative pl-2 pb-2">
                                    {ORDER_STATUS_FLOW.map((status, index) => {
                                        const statusInfo = getStatusDetails(status);
                                        const isCompleted = index < currentStatusIndex;
                                        const isCurrent = index === currentStatusIndex;
                                        const isFuture = index > currentStatusIndex;

                                        // Skip future statuses if order is complete
                                        if (isOrderComplete && isFuture) return null;

                                        return (
                                            <div
                                                key={status}
                                                className={`relative -left-[26px] transition-colors duration-300 ${isFuture ? 'opacity-50' : ''
                                                    }`}
                                            >
                                                {/* Status icon */}
                                                <div
                                                    className={`rounded-full p-2 absolute z-10 ${isCurrent
                                                            ? `${statusInfo.bgColor} ${statusInfo.color}`
                                                            : isCompleted
                                                                ? `${statusInfo.bgColor} ${statusInfo.color}`
                                                                : 'bg-gray-100 text-gray-400'
                                                        }`}
                                                >
                                                    {statusInfo.icon}
                                                </div>

                                                {/* Status content */}
                                                <div className="pl-12">
                                                    <h3
                                                        className={`font-medium ${isCurrent || isCompleted
                                                                ? statusInfo.color
                                                                : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {statusInfo.title}
                                                    </h3>
                                                    <p
                                                        className={`text-sm ${isCurrent || isCompleted
                                                                ? 'text-gray-600'
                                                                : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {statusInfo.description}
                                                    </p>

                                                    {/* Timestamps */}
                                                    {(isCompleted || isCurrent) && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {status === 'PLACED'
                                                                ? `Placed on ${new Date(order.createdAt).toLocaleString()}`
                                                                : status === 'SHIPPED' && order.shippedAt
                                                                    ? `Shipped on ${new Date(order.shippedAt).toLocaleString()}`
                                                                    : status === 'DELIVERED' && order.deliveredAt
                                                                        ? `Delivered on ${new Date(order.deliveredAt).toLocaleString()}`
                                                                        : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Carrier Info */}
                                {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium text-gray-700 mb-2">Shipping Details</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Carrier</p>
                                                <p className="text-gray-700">{order.carrierName || 'Standard Shipping'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Tracking #</p>
                                                <p className="font-mono text-gray-700">
                                                    {order.trackingNumber || order.id.slice(0, 12).toUpperCase()}
                                                </p>
                                            </div>
                                            {order.status === 'DELIVERED' && order.deliveredAt && (
                                                <div>
                                                    <p className="text-gray-500">Delivered On</p>
                                                    <p className="text-gray-700">
                                                        {new Date(order.deliveredAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                       
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Order Details */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h2 className="text-xl font-semibold mb-6">Order Details</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Order Number</h3>
                                    <p className="mt-1 font-mono">{order.id.slice(0, 8).toUpperCase()}</p>
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
                                    <p className="text-xs text-gray-500 mt-1">
                                        Status: {order.paymentStatus.toLowerCase()}
                                    </p>
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

                {/* Right Column - Order Items & Actions */}
                <div className="space-y-6">
                    {/* Order Items */}
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
                                        {order.status === 'DELIVERED' && (
                                            <Link
                                                href={`/products/${item.productId}`}
                                                className="mt-1 text-xs text-primary hover:underline"
                                            >
                                                Buy again
                                            </Link>
                                        )}
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
                        <h2 className="text-xl font-semibold mb-4">Order Support</h2>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Truck className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm font-medium">Track Your Order</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Track your package with our delivery partner
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm font-medium">Return Policy</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    30-day easy return policy
                                </p>
                            </div>
                            <div className="pt-2">
                                <Link
                                    href="/contact"
                                    className="block w-full text-center py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Continue Shopping */}
                    <Link
                        href="/products"
                        className="block w-full py-3 bg-primary text-white rounded-md text-center hover:bg-primary/90 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}