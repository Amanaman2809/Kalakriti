'use client';
import { useEffect, useState } from 'react';
import {
    ArrowLeft, Loader2, Package, CreditCard, Calendar,
    User, MapPin, Truck, CheckCircle, ChevronLeft,
    Edit, Save, X, Phone, Mail, Home, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Order, OrderStatus, PaymentStatus, PaymentMode, OrderStatusValues, PaymentStatusValues } from '@/utils/types';
import { useParams, useRouter } from 'next/navigation';

export default function OrderDetailPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Order>>({});
    const router = useRouter();
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

    const handleEditChange = (field: keyof Order, value: any) => {
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
            <div className="container mx-auto px-6 py-16 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Order</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="flex justify-center space-x-3">
                            <Link
                                href="/admin/orders"
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Orders
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

    if (!order) {
        return (
            <div className="container mx-auto px-6 py-16 min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Order Not Found</h2>
                        <p className="text-gray-600 mb-4">The requested order could not be found</p>
                        <Link
                            href="/admin/orders"
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center justify-center gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 py-2">Order Details</h1>
                    <p className="text-gray-500 py-2">Manage order #{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={saveChanges}
                                disabled={updating}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-1"
                            >
                                {updating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Save
                            </button>
                            <button
                                onClick={handleEditToggle}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/admin/orders"
                                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back to Orders
                            </Link>
                            <button
                                onClick={handleEditToggle}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-1"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                            <Package className="h-5 w-5 text-gray-500" />
                            Order Summary
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Order ID:</span>
                            <span className="font-medium text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Order Date:</span>
                            <span className="font-medium text-gray-900">
                                {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Order Status:</span>
                            {isEditing ? (
                                <select
                                    value={editData.status || order.status}
                                    onChange={(e) => handleEditChange('status', e.target.value as OrderStatus)}
                                    className={`px-2 py-1 text-xs rounded-md border ${getStatusColor(editData.status || order.status)}`}
                                >
                                    {OrderStatusValues.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                             </select>
                            ) : (
                                <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Status:</span>
                            {isEditing ? (
                                <select
                                    value={editData.paymentStatus || order.paymentStatus}
                                    onChange={(e) => handleEditChange('paymentStatus', e.target.value as PaymentStatus)}
                                    className={`px-2 py-1 text-xs rounded-md border ${getPaymentStatusColor(editData.paymentStatus || order.paymentStatus)}`}
                                >
                                    {PaymentStatusValues.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                             </select>
                            ) : (
                                <span className={`px-2 py-1 text-xs rounded-full border ${getPaymentStatusColor(order.paymentStatus)}`}>
                                    {order.paymentStatus}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Method:</span>
                            <span className="font-medium text-gray-900">{order.paymentMode}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total Amount:</span>
                            <span className="font-bold text-gray-900">₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Shipping Information */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Shipping Information</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Carrier:</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.carrierName || order.carrierName || ''}
                                        onChange={(e) => handleEditChange('carrierName', e.target.value)}
                                        className="px-2 py-1 text-sm border rounded-md w-32"
                                    />
                                ) : (
                                    <span className="font-medium text-gray-900">
                                        {order.carrierName || 'Not specified'}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tracking #:</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.trackingNumber || order.trackingNumber || ''}
                                        onChange={(e) => handleEditChange('trackingNumber', e.target.value)}
                                        className="px-2 py-1 text-sm border rounded-md w-32"
                                    />
                                ) : (
                                    <span className="font-medium text-gray-900">
                                        {order.trackingNumber || 'Not specified'}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Estimated Delivery:</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={editData.estimatedDelivery ? new Date(editData.estimatedDelivery).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleEditChange('estimatedDelivery', new Date(e.target.value))}
                                        className="px-2 py-1 text-sm border rounded-md"
                                    />
                                ) : (
                                    <span className="font-medium text-gray-900">
                                        {order.estimatedDelivery ?
                                            new Date(order.estimatedDelivery).toLocaleDateString() :
                                            'Not specified'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer & Shipping */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-500" />
                        Customer & Shipping
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">Customer Information</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Name:</span>
                                    <span className="font-medium text-gray-900">{order.user?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Email:</span>
                                    <div className="flex items-center gap-1">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">{order.user?.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {order.address && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    Shipping Address
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Address:</span>
                                        <span className="font-medium text-gray-900 text-right">
                                            {order.address.street}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">City:</span>
                                        <span className="font-medium text-gray-900">{order.address.city}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">State:</span>
                                        <span className="font-medium text-gray-900">{order.address.state}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Country:</span>
                                        <span className="font-medium text-gray-900">{order.address.country}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Postal Code:</span>
                                        <span className="font-medium text-gray-900">{order.address.postalCode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Phone:</span>
                                        <div className="flex items-center gap-1">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">{order.address.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {order.shippedAt && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1">
                                    <Truck className="h-4 w-4" />
                                    Shipping Information
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shipped On:</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(order.shippedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {order.deliveredAt && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4" />
                                    Delivery Information
                                </h3>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Delivered On:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(order.deliveredAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 lg:col-span-3">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {order.items?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.product?.name || 'Unnamed Product'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ₹{item.price?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.quantity || 1}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-right text-sm font-medium text-gray-500">
                                        Subtotal
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ₹{order.total.toFixed(2)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-right text-sm font-medium text-gray-500">
                                        Shipping
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ₹0.00
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-right text-sm font-medium text-gray-500">
                                        Total
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        ₹{order.total.toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}