'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Loader2, ShoppingCart } from 'lucide-react';
import { CartItem, PaymentMode } from '@/utils/types';
import Link from 'next/link';

export default function CheckoutPage() {
    const router = useRouter();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [address, setAddress] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('COD');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCart = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch cart');

                const data = await response.json();
                setCart(data.items);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load cart');
            }
        };

        fetchCart();
    }, [router]);

    const handlePlaceOrder = async () => {
        if (!address) {
            setError('Please enter shipping address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address,
                    paymentMode
                })
            });

            if (!response.ok) throw new Error('Failed to place order');

            const data = await response.json();
            router.push(`/orders/${data.order.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    if (cart.length === 0) {
        return (
            <div className="px-4 py-8 max-w-7xl mx-auto text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
                <p className="text-gray-600 mb-6">Add some products to your cart first</p>
                <Link
                    href="/products"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 inline-block"
                >
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="px-4 py-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={4}
                            placeholder="Enter your complete shipping address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                        <div className="space-y-4">
                            <div
                                className={`border rounded-md p-4 cursor-pointer ${paymentMode === 'COD' ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
                                onClick={() => setPaymentMode('COD')}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium">Cash on Delivery</h3>
                                        <p className="text-sm text-gray-500">Pay when you receive the order</p>
                                    </div>
                                    {paymentMode === 'COD' && <Check className="h-5 w-5 text-primary" />}
                                </div>
                            </div>
                            <div
                                className={`border rounded-md p-4 cursor-pointer ${paymentMode === 'ONLINE' ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
                                onClick={() => setPaymentMode('ONLINE')}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium">Online Payment</h3>
                                        <p className="text-sm text-gray-500">Pay securely with Razorpay</p>
                                    </div>
                                    {paymentMode === 'ONLINE' && <Check className="h-5 w-5 text-primary" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            {cart.map((item) => (
                                <div key={item.id} className="flex justify-between">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 rounded-md overflow-hidden border border-gray-200 mr-3">
                                            <img
                                                src={item.product.images?.[0] || "/placeholder.png"}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{item.product.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <p className="text-gray-600">Subtotal</p>
                                <p>₹{total.toLocaleString()}</p>
                            </div>
                            <div className="flex justify-between mb-2">
                                <p className="text-gray-600">Shipping</p>
                                <p>FREE</p>
                            </div>
                            <div className="flex justify-between font-medium text-lg">
                                <p>Total</p>
                                <p>₹{total.toLocaleString()}</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || !address}
                            className={`w-full py-3 rounded-md flex items-center justify-center ${loading || !address ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white'}`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Place Order
                                    <ChevronRight className="h-5 w-5 ml-2" />
                                </>
                            )}
                        </button>

                        {error && (
                            <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}