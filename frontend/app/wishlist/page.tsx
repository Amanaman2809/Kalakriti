"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  getWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
} from "@/utils/product";
import { WishlistItem } from "@/utils/types";
import {
  ShoppingBag,
  AlertCircle,
  Heart,
  Loader2,
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Star,
  Package,
  Share2,
  Eye
} from "lucide-react";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingItems, setProcessingItems] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadWishlist = async () => {
      try {
        const items = await getWishlist();
        setWishlist(items);
      } catch (err: any) {
        setError(err.message ?? "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [mounted]);

  const handleRemove = useCallback(async (productId: string, productName: string) => {
    setProcessingItems(prev => ({ ...prev, [productId]: true }));
    try {
      await removeFromWishlist(productId);
      setWishlist((prev) =>
        prev.filter((item) => item.product.id !== productId)
      );
      toast.success(`Removed "${productName}" from wishlist`, {
        duration: 2000,
        position: 'top-center'
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove item");
    } finally {
      setProcessingItems(prev => ({ ...prev, [productId]: false }));
    }
  }, []);

  const handleMoveToCart = useCallback(async (productId: string, productName: string) => {
    setProcessingItems(prev => ({ ...prev, [productId]: true }));
    try {
      await moveWishlistItemToCart(productId);
      setWishlist((prev) =>
        prev.filter((item) => item.product.id !== productId)
      );
      toast.success(`Moved "${productName}" to cart`, {
        duration: 2000,
        position: 'top-center'
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to move to cart");
    } finally {
      setProcessingItems(prev => ({ ...prev, [productId]: false }));
    }
  }, []);

  const shareWishlist = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'My Wishlist',
        text: 'Check out my wishlist!',
        url: window.location.href,
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Wishlist link copied to clipboard!');
    }
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <Heart className="h-16 w-16 text-primary/20" />
              <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-4 left-4" />
            </div>
            <p className="mt-6 text-lg text-gray-600">Loading your wishlist...</p>
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
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Couldn't load wishlist</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
                >
                  <Loader2 className="w-4 h-4" />
                  Retry
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="bg-white text-primary border border-primary px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors font-medium"
                >
                  Go Home
                </button>
              </div>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-3 rounded-full hover:bg-accent transition-colors"
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-500" />
                My Wishlist
              </h1>
              <p className="text-gray-600 mt-1">
                {wishlist.length === 0
                  ? "Your wishlist is empty"
                  : `${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'} saved for later`
                }
              </p>
            </div>
          </div>

          {wishlist.length > 0 && (
            <button
              onClick={shareWishlist}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Share2 className="h-5 w-5" />
              Share Wishlist
            </button>
          )}
        </div>

        {wishlist.length === 0 ? (
          <EmptyWishlist router={router} />
        ) : (
          <>
            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {wishlist.map((item) => (
                <WishlistItemCard
                  key={item.product.id}
                  item={item}
                  isProcessing={processingItems[item.product.id] || false}
                  onRemove={handleRemove}
                  onMoveToCart={handleMoveToCart}
                />
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-text">Ready to shop?</h3>
                  <p className="text-gray-600">Move all items to cart or continue browsing</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/products"
                    className="flex items-center gap-2 bg-white text-primary border border-primary px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors font-medium"
                  >
                    <Package className="h-5 w-5" />
                    Continue Shopping
                  </Link>
                  <button
                    onClick={async () => {
                      // Move all items to cart
                      const promises = wishlist.map(item =>
                        handleMoveToCart(item.product.id, item.product.name)
                      );
                      await Promise.all(promises);
                    }}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Move All to Cart
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Individual wishlist item component
const WishlistItemCard = ({
  item,
  isProcessing,
  onRemove,
  onMoveToCart
}: {
  item: WishlistItem;
  isProcessing: boolean;
  onRemove: (id: string, name: string) => void;
  onMoveToCart: (id: string, name: string) => void;
}) => {
  const { product } = item;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-accent hover:border-secondary/30">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.images?.[0] || "/placeholder-product.png"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          />

          {/* Stock status overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick view button */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors">
              <Eye className="h-4 w-4 text-gray-700" />
            </button>
          </div>

          {/* Price badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
              ₹{product.price.toLocaleString()}
            </span>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-5">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-lg text-text line-clamp-2 hover:text-primary transition-colors mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < 4 ? 'text-silver fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">(4.5)</span>
        </div>

        {/* Stock status */}
        <div className="mb-4">
          {isOutOfStock ? (
            <span className="text-sm text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
              Out of Stock
            </span>
          ) : (
            <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
              In Stock ({product.stock} available)
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onMoveToCart(product.id, product.name)}
            disabled={isProcessing || isOutOfStock}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
              } disabled:opacity-70`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : isOutOfStock ? (
              'Unavailable'
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </>
            )}
          </button>

          <button
            onClick={() => onRemove(product.id, product.name)}
            disabled={isProcessing}
            className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all duration-200 disabled:opacity-70"
            title="Remove from wishlist"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Empty wishlist component
const EmptyWishlist = ({ router }: { router: any }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
    <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mb-8">
      <Heart className="h-16 w-16 text-red-200" strokeWidth={1} />
    </div>
    <h2 className="text-3xl font-bold text-text mb-4">Your wishlist is empty</h2>
    <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
      Save products you love by clicking the heart icon.
      They'll appear here so you can easily find them later!
    </p>
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={() => router.push("/products")}
        className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors font-medium"
      >
        <ShoppingBag className="h-5 w-5" />
        Start Shopping
      </button>
      <button
        onClick={() => router.push("/category")}
        className="flex items-center gap-2 bg-white text-primary border border-primary px-8 py-4 rounded-xl hover:bg-primary/5 transition-colors font-medium"
      >
        <Package className="h-5 w-5" />
        Browse Categories
      </button>
    </div>
  </div>
);
