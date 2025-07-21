"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchCartItems,
  removeFromCart,
  moveItemToWishlist,
  addToCart,
} from "@/utils/product";
import { CartItem } from "@/utils/types";
import { Loader2, ArrowLeft, ShoppingCart, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingItems, setProcessingItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadCart = async () => {
      try {
        const items = await fetchCartItems();
        setCartItems(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cart");
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, []);

  const updateQuantity = async (id: string, productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setProcessingItems(prev => ({ ...prev, [id]: true }));

      const currentItem = cartItems.find(item => item.id === id);
      if (!currentItem) return;

      const quantityDiff = newQuantity - currentItem.quantity;

      if (quantityDiff > 0) {
        await addToCart({ productId, quantity: quantityDiff });
      } else if (quantityDiff < 0) {
        await removeFromCart({ productId, quantity: Math.abs(quantityDiff) });
      }

      setCartItems(prev =>
        prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setProcessingItems(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRemoveItem = async (id: string, productId: string) => {
    try {
      setProcessingItems(prev => ({ ...prev, [id]: true }));
      await removeFromCart({
        productId,
        quantity: cartItems.find(item => item.id === id)?.quantity || 1,
      });
      setCartItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setProcessingItems(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleMoveToWishlist = async (id: string, productId: string) => {
    try {
      setProcessingItems(prev => ({ ...prev, [id]: true }));
      await moveItemToWishlist(productId);
      setCartItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move to wishlist");
    } finally {
      setProcessingItems(prev => ({ ...prev, [id]: false }));
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4">Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Your Shopping Cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet</p>
          <Link
            href="/products"
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Items */}
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row gap-4"
              >
                {/* Product Image */}
                <div className="w-full sm:w-32 h-32 flex-shrink-0">
                  <img
                    src={item.product.images[0] || "/placeholder-product.png"}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-product.png";
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium">{item.product.name}</h3>
                    <p className="text-lg font-semibold">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-4">
                    {/* Quantity Controls */}
                    <div className="flex border rounded-md w-fit">
                      <button
                        onClick={() => updateQuantity(item.id, item.product.id, item.quantity - 1)}
                        disabled={processingItems[item.id] || item.quantity <= 1}
                        className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 border-x">
                        {processingItems[item.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.product.id, item.quantity + 1)}
                        disabled={processingItems[item.id]}
                        className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 ml-auto">
                      <button
                        onClick={() => handleMoveToWishlist(item.id, item.product.id)}
                        disabled={processingItems[item.id]}
                        className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Save for later
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.product.id)}
                        disabled={processingItems[item.id]}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal ({calculateTotalItems()} items)</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-bold text-lg">
                <span>Total</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/cart/checkout"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-3 rounded-md font-medium transition-colors"
            >
              Proceed to Checkout
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}