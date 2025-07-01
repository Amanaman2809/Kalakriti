"use client";
import { useEffect, useState } from "react";
import {
  getWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
} from "@/utils/product";
import { WishlistItem } from "@/utils/types";
import { useRouter } from "next/navigation";
import { ShoppingBag, AlertCircle, Heart, Loader2 } from "lucide-react";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null); // productId being mutated

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const items = await getWishlist();
        setWishlist(items);
      } catch (err: any) {
        setError(err.message ?? "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRemove = async (productId: string) => {
    setProcessing(productId);
    try {
      await removeFromWishlist(productId);
      setWishlist((prev) =>
        prev.filter((item) => item.product.id !== productId)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleMoveToCart = async (productId: string) => {
    setProcessing(productId);
    try {
      await moveWishlistItemToCart(productId);
      setWishlist((prev) =>
        prev.filter((item) => item.product.id !== productId)
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Loading state
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-lg text-gray-600">Loading your wishlist...</p>
      </div>
    );

  // Error state
  if (error)
    return (
      <div className="max-w-4xl mx-auto p-8 bg-red-50/50 rounded-xl border border-red-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-semibold text-red-800">
              Couldn't load wishlist
            </h3>
            <p className="text-red-700 mt-2">{error}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // Empty state
  if (wishlist.length === 0)
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <div className="mx-auto w-28 h-28 bg-accent rounded-full flex items-center justify-center mb-6">
          <Heart className="w-12 h-12 text-primary/70" strokeWidth={1.5} />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">
          Your wishlist is empty
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Save products you love by clicking the heart icon. They'll appear
          right here.
        </p>
        <button
          onClick={() => router.push("/products")}
          className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium text-lg flex items-center gap-2 mx-auto"
        >
          <ShoppingBag className="w-5 h-5" />
          Start Shopping
        </button>
      </div>
    );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Your Wishlist</h1>
        <p className="text-gray-700 mt-2">
          {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-secondary border border-primary p-8 text-center">
          <p className="text-lg text-gray-700">Your wishlist is empty</p>
          <button
            onClick={() => router.push("/products")}
            className="mt-4 px-6 py-2 bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {wishlist.map((item) => {
            const { product } = item;
            return (
              <li
                key={product.id}
                className="flex items-center bg-secondary border border-primary p-4 hover:shadow-sm transition-shadow"
              >
                {/* Clickable Product Image and Info */}
                <div
                  className="flex flex-1 cursor-pointer"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <div className="flex-shrink-0 w-30 h-30 border border-gray-300">
                    <img
                      src={product.images?.[0] || "/placeholder-product.png"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="ml-6">
                    <h2 className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors">
                      {product.name}
                    </h2>
                    <p className="text-lg font-medium text-primary mt-1">
                      ₹{product.price.toFixed(2)}
                    </p>
                    {product.stock > 0 ? (
                      <p className="text-green-700 text-sm mt-1">In Stock</p>
                    ) : (
                      <p className="text-red-700 text-sm mt-1">Out of Stock</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className="flex flex-col sm:flex-row gap-3 ml-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleMoveToCart(product.id)}
                    disabled={processing === product.id || product.stock <= 0}
                    className={`px-5 py-2 font-medium transition-colors ${
                      product.stock > 0
                        ? "bg-primary text-white hover:bg-[#253559] hover:cursor-pointer"
                        : "bg-gray-200 text-gray-600 cursor-not-allowed"
                    } disabled:opacity-50`}
                  >
                    {product.stock > 0 ? "Add to Cart" : "Unavailable"}
                  </button>
                  <button
                    onClick={() => handleRemove(product.id)}
                    disabled={processing === product.id}
                    className="px-5 py-2 border border-gray-400 font-medium text-gray-800 hover:bg-gray-100 hover:cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
