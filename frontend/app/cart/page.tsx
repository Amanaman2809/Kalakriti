"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  fetchCartItems,
  removeFromCart,
  moveItemToWishlist,
  addToCart,
} from "@/utils/product";
import { CartItem } from "@/utils/types";
import {
  Loader2,
  ArrowLeft,
  ShoppingCart,
  ChevronRight,
  Trash2,
  Heart,
  Plus,
  Minus,
  Package,
  Truck,
  Shield,
  Star
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingItems, setProcessingItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

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
  }, [mounted]);

  const updateQuantity = useCallback(async (id: string, productId: string, newQuantity: number) => {
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

      toast.success("Cart updated successfully", {
        duration: 1500,
        position: 'top-center'
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setProcessingItems(prev => ({ ...prev, [id]: false }));
    }
  }, [cartItems]);

  const handleRemoveItem = useCallback(async (id: string, productId: string, productName: string) => {
    try {
      setProcessingItems(prev => ({ ...prev, [id]: true }));
      await removeFromCart({
        productId,
        quantity: cartItems.find(item => item.id === id)?.quantity || 1,
      });
      setCartItems(prev => prev.filter(item => item.id !== id));

      toast.success(`Removed "${productName}" from cart`, {
        duration: 2000,
        position: 'top-center'
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setProcessingItems(prev => ({ ...prev, [id]: false }));
    }
  }, [cartItems]);

  const handleMoveToWishlist = useCallback(async (id: string, productId: string, productName: string) => {
    try {
      setProcessingItems(prev => ({ ...prev, [id]: true }));
      await moveItemToWishlist(productId);
      setCartItems(prev => prev.filter(item => item.id !== id));

      toast.success(`Moved "${productName}" to wishlist`, {
        duration: 2000,
        position: 'top-center'
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move to wishlist");
    } finally {
      setProcessingItems(prev => ({ ...prev, [id]: false }));
    }
  }, []);

  const calculateSubtotal = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      const finalPrice = item.product.finalPrice || item.product.price;
      return sum + finalPrice * item.quantity;
    }, 0);
  }, [cartItems]);


  const calculateTotalItems = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);


  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <ShoppingCart className="h-16 w-16 text-primary/20" />
              <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-4 left-4" />
            </div>
            <p className="mt-6 text-lg text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-red-500">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-full hover:bg-accent transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">
              {cartItems.length === 0
                ? "Your cart is empty"
                : `${calculateTotalItems()} items in your cart`
              }
            </p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text">Cart Items</h2>
                  <div className="text-sm text-gray-500">
                    {calculateTotalItems()} {calculateTotalItems() === 1 ? 'item' : 'items'}
                  </div>
                </div>

                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      processingItems={processingItems}
                      onUpdateQuantity={updateQuantity}
                      onRemoveItem={handleRemoveItem}
                      onMoveToWishlist={handleMoveToWishlist}
                    />
                  ))}
                </div>
              </div>

              {/* Trust Badges */}
              <TrustBadges />
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary
                subtotal={calculateSubtotal()}
                totalItems={calculateTotalItems()}
                cartItems={cartItems}  // Add this prop
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// Individual cart item component
const CartItemCard = ({
  item,
  processingItems,
  onUpdateQuantity,
  onRemoveItem,
  onMoveToWishlist
}: {
  item: CartItem;
  processingItems: Record<string, boolean>;
  onUpdateQuantity: (id: string, productId: string, quantity: number) => void;
  onRemoveItem: (id: string, productId: string, name: string) => void;
  onMoveToWishlist: (id: string, productId: string, name: string) => void;
}) => {
  const isProcessing = processingItems[item.id];

  // Discount calculations
  const hasDiscount = (item.product.discountPct || 0) > 0;
  const finalPrice = item.product.finalPrice || item.product.price;
  const originalPrice = item.product.price;

  // Rating values
  const avgRating = item.product.averageRating || 0;
  const numReviews = item.product.numReviews || 0;

  // Stock checks
  const isOutOfStock = item.product.stock <= 0;
  const isLowStock = item.product.stock > 0 && item.product.stock <= 5;

  return (
    <div className="flex gap-4 p-4 border border-accent rounded-xl hover:border-secondary/30 transition-colors group">
      {/* Product Image */}
      <Link href={`/products/${item.product.id}`} className="flex-shrink-0 relative">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-accent">
          <Image
            src={item.product.images?.[0] || "/placeholder-product.png"}
            alt={item.product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="150px"
          />

          {/* Discount Badge on Image */}
          {hasDiscount && (
            <div className="absolute top-1 left-1">
              <div className="bg-white/95 backdrop-blur-sm text-red-600 px-2 py-1 rounded-full text-xs font-semibold shadow-md border border-red-200 flex items-center gap-1">
                {item.product.discountPct}% OFF
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 mr-4">
            <Link href={`/products/${item.product.id}`}>
              <h3 className="text-lg font-semibold text-text hover:text-primary transition-colors line-clamp-1">
                {item.product.name}
              </h3>
            </Link>

            {/* 🔥 NEW: Product Description */}
            {item.product.description && (
              <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                {item.product.description}
              </p>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-text">
              ₹{(finalPrice * item.quantity).toLocaleString()}
            </p>
            {hasDiscount && (
              <p className="text-sm text-gray-400 line-through">
                ₹{(originalPrice * item.quantity).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-0.5">
              ₹{finalPrice.toLocaleString()} each
            </p>
          </div>
        </div>

        {/* Product rating and stock */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {/* Dynamic Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.floor(avgRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
              {numReviews > 0 && ` (${numReviews})`}
            </span>
          </div>

          {/* Stock Status */}
          <div className="text-xs">
            {isOutOfStock ? (
              <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                Only {item.product.stock} left
              </span>
            ) : (
              <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                In Stock
              </span>
            )}
          </div>

          {/* Savings Badge */}
          {hasDiscount && (
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
              Save ₹{((originalPrice - finalPrice) * item.quantity).toLocaleString()}
            </span>
          )}
        </div>

        {/* Quantity and Actions */}
        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.id, item.product.id, item.quantity - 1)}
              disabled={isProcessing || item.quantity <= 1}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.product.id, item.quantity + 1)}
              disabled={isProcessing || isOutOfStock}
              className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onMoveToWishlist(item.id, item.product.id, item.product.name)}
              disabled={isProcessing}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors disabled:opacity-50 p-2 rounded-lg hover:bg-gray-50"
              title="Move to wishlist"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={() => onRemoveItem(item.id, item.product.id, item.product.name)}
              disabled={isProcessing}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 p-2 rounded-lg hover:bg-red-50"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// Empty cart component
const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
    <div className="w-32 h-32 bg-accent rounded-full flex items-center justify-center mb-6">
      <ShoppingCart className="h-16 w-16 text-gray-400" />
    </div>
    <h2 className="text-2xl font-bold text-text mb-2">Your cart is empty</h2>
    <p className="text-gray-600 mb-8 max-w-md">
      Looks like you haven&apos;t added anything to your cart yet.
      Start exploring our amazing collection!
    </p>
    <div className="flex flex-col sm:flex-row gap-4">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors font-medium"
      >
        <Package className="h-5 w-5" />
        Browse Products
      </Link>
      <Link
        href="/category"
        className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-8 py-4 rounded-xl hover:bg-primary/5 transition-colors font-medium"
      >
        Browse Categories
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  </div>
);

// Order summary component
const OrderSummary = ({
  subtotal,
  totalItems,
  cartItems // Add cartItems prop
}: {
  subtotal: number;
  totalItems: number;
  cartItems: CartItem[]; // Add this
}) => {
  // Calculate original price (before discounts)
  const originalTotal = cartItems.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  // Calculate total discount
  const totalDiscount = originalTotal - subtotal;
  const hasDiscount = totalDiscount > 0;

  const shipping = subtotal >= 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const total = Math.round(subtotal + shipping + tax);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-accent p-6 sticky top-8">
      <h2 className="text-xl font-semibold text-text mb-6">Order Summary</h2>

      <div className="space-y-4 mb-6">
        {/* Original Price (if there's a discount) */}
        {hasDiscount && (
          <div className="flex justify-between text-gray-500">
            <span>Original Price</span>
            <span className="line-through">₹{originalTotal.toLocaleString()}</span>
          </div>
        )}

        {/* Discount Savings */}
        {hasDiscount && (
          <div className="flex justify-between text-green-600 font-medium">
            <span className="flex items-center gap-1">
              <span className="text-sm">🎉</span>
              Discount Savings
            </span>
            <span>- ₹{totalDiscount.toLocaleString()}</span>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-gray-600">
            Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium text-text">
            ₹{subtotal.toLocaleString()}
          </span>
        </div>

        {/* Divider if discount exists */}
        {hasDiscount && <div className="border-t border-gray-200"></div>}

        {/* Shipping */}
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
            {shipping === 0 ? (
              <span className="flex items-center gap-1">
                <span className="text-sm">✓</span>
                FREE
              </span>
            ) : (
              `₹${shipping}`
            )}
          </span>
        </div>

        {/* Tax */}
        <div className="flex justify-between">
          <span className="text-gray-600">Tax (GST 18%)</span>
          <span className="font-medium">₹{tax.toLocaleString()}</span>
        </div>

        {/* Free shipping progress bar */}
        {subtotal < 999 && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-blue-900 text-sm">
                Add ₹{(999 - subtotal).toLocaleString()} for FREE shipping
              </p>
            </div>
          </div>
        )}

        {/* Discount achieved message */}
        {hasDiscount && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <p className="text-sm text-green-800 font-medium flex items-center gap-2">
              <span className="text-base">💰</span>
              You&apos;re saving ₹{totalDiscount.toLocaleString()} on this order!
            </p>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-accent pt-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold text-text">Total Amount</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">
              ₹{total.toLocaleString()}
            </span>
            {hasDiscount && (
              <p className="text-xs text-gray-500 mt-1">
                (After discount)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <Link
        href="/cart/checkout"
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] mb-4"
      >
        Proceed to Checkout
        <ChevronRight className="h-5 w-5" />
      </Link>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-gray-500">
        <Shield className="h-4 w-4" />
        <p className="text-xs">Secure checkout with SSL encryption</p>
      </div>
    </div>
  );
};


// Trust badges component
const TrustBadges = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
    <h3 className="text-lg font-semibold text-text mb-4">Why shop with us?</h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Truck className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-sm">Free Shipping</p>
          <p className="text-xs text-gray-500">On orders over ₹999</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-sm">Secure Payment</p>
          <p className="text-xs text-gray-500">SSL encrypted</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-silver/20 rounded-full flex items-center justify-center">
          <Package className="h-5 w-5 text-silver" />
        </div>
        <div>
          <p className="font-medium text-sm">Easy Returns</p>
          <p className="text-xs text-gray-500">30-day policy</p>
        </div>
      </div>
    </div>
  </div>
);
