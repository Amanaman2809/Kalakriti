'use client';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Loader2,
    Package,
    User,
    MapPin,
    Edit,
    Save,
    X,
    Phone,
    Mail,
    Truck,
    Copy,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Order, OrderStatus, PaymentStatus, OrderStatusValues, PaymentStatusValues } from '@/utils/types';
import { useParams} from 'next/navigation';

export default function OrderDetailPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Order>>({});
    const param = useParams();
    const id = param?.id;

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication token missing');

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) throw new Error('Unauthorized access');
                    if (response.status === 404) throw new Error('Order not found');
                    throw new Error('Failed to fetch order');
                }

                const data: Order = await response.json();
                setOrder(data);
                setEditData({
                    status: data.status,
                    paymentStatus: data.paymentStatus,
                    carrierName: data.carrierName,
                    trackingNumber: data.trackingNumber,
                    estimatedDelivery: data.estimatedDelivery
                });
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Something went wrong';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing && order) {
            setEditData({
                status: order.status,
                paymentStatus: order.paymentStatus,
                carrierName: order.carrierName,
                trackingNumber: order.trackingNumber,
                estimatedDelivery: order.estimatedDelivery
            });
        }
    };

    const handleEditChange = (field: keyof Order, value: unknown) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const saveChanges = async () => {
        if (!order) return;

        try {
            setUpdating(true);
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token missing');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${order.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editData),
            });

            if (!response.ok) throw new Error('Failed to update order');

            const updatedOrder = await response.json();
            setOrder(updatedOrder);
            setIsEditing(false);
            toast.success('Order updated successfully');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Update failed';
            toast.error(msg);
        } finally {
            setUpdating(false);
        }
    };

    const copyOrderId = () => {
        navigator.clipboard.writeText(order?.id || '');
        toast.success('Order ID copied to clipboard');
    };

    const getStatusConfig = (status: OrderStatus) => {
        const configs = {
            PLACED: { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Order Placed' },
            SHIPPED: { color: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Shipped' },
            DELIVERED: { color: 'bg-green-50 text-green-800 border-green-200', label: 'Delivered' }
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
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-16">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-red-200">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Order</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <Link
                            href="/admin/orders"
                            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Back to Orders
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-md mx-auto mt-16">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Order Not Found</h2>
                    <p className="text-gray-600 mb-6">The requested order could not be found</p>
                    <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link
                            href="/admin/orders"
                            className="text-gray-500 hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-gray-600">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <button
                            onClick={copyOrderId}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
                        >
                            <Copy className="h-4 w-4" />
                            Copy ID
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={saveChanges}
                                disabled={updating}
                                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70"
                            >
                                {updating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save Changes
                            </button>
                            <button
                                onClick={handleEditToggle}
                                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleEditToggle}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            <Edit className="h-4 w-4" />
                            Edit Order
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Order Summary */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Order Date</span>
                                    <span className="font-semibold text-gray-900">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Status</span>
                                    {isEditing ? (
                                        <select
                                            value={editData.status || order.status}
                                            onChange={(e) => handleEditChange('status', e.target.value as OrderStatus)}
                                            className={`px-3 py-1 text-sm rounded-xl border ${getStatusConfig(editData.status || order.status).color}`}
                                        >
                                            {OrderStatusValues.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 text-sm rounded-xl border ${getStatusConfig(order.status).color}`}>
                                            {getStatusConfig(order.status).label}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Amount</span>
                                    <span className="font-bold text-gray-900 text-lg">₹{order.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Payment Status</span>
                                    {isEditing ? (
                                        <select
                                            value={editData.paymentStatus || order.paymentStatus}
                                            onChange={(e) => handleEditChange('paymentStatus', e.target.value as PaymentStatus)}
                                            className={`px-3 py-1 text-sm rounded-xl border ${getPaymentStatusConfig(editData.paymentStatus || order.paymentStatus).color}`}
                                        >
                                            {PaymentStatusValues.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 text-sm rounded-xl border ${getPaymentStatusConfig(order.paymentStatus).color}`}>
                                            {order.paymentStatus}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Method</span>
                                    <span className="font-semibold text-gray-900">{order.paymentMode}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Items</span>
                                    <span className="font-semibold text-gray-900">
                                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Truck className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Carrier</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.carrierName || order.carrierName || ''}
                                            onChange={(e) => handleEditChange('carrierName', e.target.value)}
                                            className="px-3 py-1 text-sm border rounded-lg w-40 text-right"
                                            placeholder="Enter carrier name"
                                        />
                                    ) : (
                                        <span className="font-semibold text-gray-900">
                                            {order.carrierName || 'Not specified'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Tracking Number</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.trackingNumber || order.trackingNumber || ''}
                                            onChange={(e) => handleEditChange('trackingNumber', e.target.value)}
                                            className="px-3 py-1 text-sm border rounded-lg w-40 text-right"
                                            placeholder="Enter tracking number"
                                        />
                                    ) : (
                                        <span className="font-semibold text-gray-900">
                                            {order.trackingNumber || 'Not specified'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Estimated Delivery</span>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            value={editData.estimatedDelivery ? new Date(editData.estimatedDelivery).toISOString().split('T')[0] : ''}
                                            onChange={(e) => handleEditChange('estimatedDelivery', new Date(e.target.value))}
                                            className="px-3 py-1 text-sm border rounded-lg"
                                        />
                                    ) : (
                                        <span className="font-semibold text-gray-900">
                                            {order.estimatedDelivery
                                                ? new Date(order.estimatedDelivery).toLocaleDateString()
                                                : 'Not specified'
                                            }
                                        </span>
                                    )}
                                </div>

                                {order.shippedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shipped On</span>
                                        <span className="font-semibold text-gray-900">
                                            {new Date(order.shippedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}

                                {order.deliveredAt && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Delivered On</span>
                                        <span className="font-semibold text-gray-900">
                                            {new Date(order.deliveredAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                <Package className="h-5 w-5 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 text-sm font-semibold text-gray-600">Product</th>
                                        <th className="text-center py-3 text-sm font-semibold text-gray-600">Quantity</th>
                                        <th className="text-right py-3 text-sm font-semibold text-gray-600">Price</th>
                                        <th className="text-right py-3 text-sm font-semibold text-gray-600">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items?.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-4">
                                                <div className="font-semibold text-gray-900">
                                                    {item.product?.name || 'Unnamed Product'}
                                                </div>
                                            </td>
                                            <td className="py-4 text-center text-gray-600">
                                                {item.quantity || 1}
                                            </td>
                                            <td className="py-4 text-right text-gray-600">
                                                ₹{(item.price || 0).toFixed(2)}
                                            </td>
                                            <td className="py-4 text-right font-semibold text-gray-900">
                                                ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 border-gray-200">
                                        <td colSpan={3} className="py-4 text-right font-semibold text-gray-900">
                                            Total
                                        </td>
                                        <td className="py-4 text-right font-bold text-xl text-gray-900">
                                            ₹{order.total.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Customer & Address */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Customer</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                    {order.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {order.user?.name || 'Unknown User'}
                                    </div>
                                    <div className="text-sm text-gray-600">Customer</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900">{order.user?.email || 'No email'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.address && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="font-semibold text-gray-900 mb-2">
                                        {order.address.street}
                                    </div>
                                    <div className="text-gray-600 space-y-1">
                                        <div>{order.address.city}, {order.address.state}</div>
                                        <div>{order.address.country} - {order.address.postalCode}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900">{order.address.phone}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
