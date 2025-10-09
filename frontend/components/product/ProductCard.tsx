import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShoppingCart,
  Heart,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ProductCardProps } from "@/utils/types";
import { useState, useEffect } from "react";

export default function ProductCard({
  product,
  interactions,
  toggleWishlist,
  addToCartHandler,
}: ProductCardProps) {
  // Safe access with fallbacks
  const isInWishlist = interactions?.wishlist?.[product.id] || false;
  const isInCart = interactions?.cart?.[product.id] || false;
  const isWishlistLoading =
    interactions?.loading?.[`wishlist-${product.id}`] || false;
  const isCartLoading = interactions?.loading?.[`cart-${product.id}`] || false;

  // ✅ Stock status checks
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // ✅ Discount calculations
  const hasDiscount = (product.discountPct || 0) > 0;

  // 🔥 NEW: Get rating values from product
  const avgRating = product.averageRating || 0;
  const numReviews = product.numReviews || 0;

  const [isMounted, setIsMounted] = useState(false);
  const [showAddedEffect, setShowAddedEffect] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [product]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!toggleWishlist) return;
    await toggleWishlist(product.id, product.name);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!addToCartHandler || isOutOfStock) return;

    // Show animation effect
    if (!isInCart) {
      setShowAddedEffect(true);
      setTimeout(() => setShowAddedEffect(false), 1000);
    }

    await addToCartHandler(product.id, product.name);
  };

  return (
    <div
      className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-accent flex flex-col h-full hover:border-secondary/30 hover:-translate-y-2 ${
        isOutOfStock ? "opacity-75" : ""
      }`}
    >
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              fill
              alt={product.name}
              className={`object-cover group-hover:scale-110 transition-transform duration-700`}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-accent flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Added to cart animation effect */}
          {showAddedEffect && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm animate-fade-in-out">
              <div className="bg-white rounded-full p-4 shadow-2xl animate-bounce-in">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
          )}

          {/* Floating particles effect on hover - only if not out of stock */}
          {!isOutOfStock && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-primary/30 animate-float"
                  style={{
                    width: Math.random() * 10 + 5 + "px",
                    height: Math.random() * 10 + 5 + "px",
                    top: Math.random() * 100 + "%",
                    left: Math.random() * 100 + "%",
                    animationDelay: Math.random() * 2 + "s",
                    animationDuration: Math.random() * 5 + 5 + "s",
                  }}
                />
              ))}
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-white/95 backdrop-blur-sm text-red-600 px-2 py-1 rounded-full text-xs font-semibold shadow-md border border-red-200 flex items-center gap-1 animate-pulse-gentle hover:scale-105 transition-transform duration-200">
                <span className="text-[10px]">⚡</span>
                {product.discountPct}% OFF
              </div>
            </div>
          )}

          {/* Action buttons - only show if handlers exist and not out of stock */}
          {(toggleWishlist || addToCartHandler) && !isOutOfStock && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
              {toggleWishlist && (
                <button
                  onClick={handleToggleWishlist}
                  disabled={isWishlistLoading}
                  className={`p-3 rounded-full transition-all duration-300 shadow-lg ${
                    isInWishlist
                      ? "bg-red-500 text-white scale-110 animate-heart-beat"
                      : "bg-white/90 text-gray-700 hover:bg-white hover:scale-110"
                  } disabled:opacity-70`}
                  title={
                    isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  {isWishlistLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-5 h-5 transition-all duration-300 ${
                        isInWishlist ? "fill-current" : ""
                      }`}
                    />
                  )}
                </button>
              )}

              {addToCartHandler && (
                <button
                  onClick={handleAddToCart}
                  disabled={isCartLoading || isInCart}
                  className={`p-3 rounded-full transition-all duration-300 shadow-lg ${
                    isInCart
                      ? "bg-green-500 text-white animate-pulse-slow"
                      : "bg-white/90 text-gray-700 hover:bg-white hover:scale-110"
                  } disabled:opacity-70`}
                  title={isInCart ? "Added to cart" : "Add to cart"}
                >
                  {isCartLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isInCart ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* 🔥 UPDATED: Dynamic Rating badge */}
          {!isOutOfStock && (
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-yellow-400 shadow-sm">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs font-medium text-gray-600">
                {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
              </span>
              {numReviews > 0 && (
                <span className="text-[10px] text-gray-500">
                  ({numReviews})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1 justify-between">
          <div className="flex items-start justify-between mb-2">
            <h3
              className={`font-semibold line-clamp-1 text-lg group-hover:text-primary transition-colors duration-300 ${
                isOutOfStock ? "text-gray-500" : "text-text"
              }`}
            >
              {product.name}
            </h3>
          </div>

          <p
            className={`text-sm line-clamp-2 mb-4 leading-relaxed group-hover:text-gray-800 transition-colors duration-300 ${
              isOutOfStock ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {product.description}
          </p>

          {/* ✅ Fixed Stock Status Display - Always reserves space */}
          <div className="mb-3 h-6 flex items-center">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Currently Unavailable
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 text-orange-600 text-sm font-medium">
                <AlertCircle className="w-4 h-4" />
                Only {product.stock} left in stock
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {/* Price display with discount */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xl font-bold ${
                    isOutOfStock ? "text-gray-400" : "text-text"
                  }`}
                >
                  ₹{product.finalPrice}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-500 line-through">
                    ₹{product.price}
                  </span>
                )}
              </div>
              {/* Fixed discount badge height */}
              <div className="h-6">
                {hasDiscount && (
                  <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                    You save ₹
                    {(product.price - product.finalPrice).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {addToCartHandler && (
              <button
                className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-all duration-300 relative overflow-hidden ${
                  isOutOfStock
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : isInCart
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105"
                } disabled:opacity-70`}
                onClick={handleAddToCart}
                disabled={isCartLoading || isInCart || isOutOfStock}
              >
                {/* Shine effect on hover - only if not out of stock */}
                {!isInCart && !isCartLoading && !isOutOfStock && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}

                {isOutOfStock ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Out of Stock
                  </>
                ) : isCartLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : isInCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
