import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ShoppingCart,
  Heart,
  Check,
  Loader2,
  Sparkles,
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

  const [isMounted, setIsMounted] = useState(false);
  const [showAddedEffect, setShowAddedEffect] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!toggleWishlist) return;
    await toggleWishlist(product.id, product.name);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!addToCartHandler) return;

    // Show animation effect
    if (!isInCart) {
      setShowAddedEffect(true);
      setTimeout(() => setShowAddedEffect(false), 1000);
    }

    await addToCartHandler(product.id, product.name);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-accent hover:border-secondary/30 hover:-translate-y-2">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              fill
              alt={product.name}
              className="object-cover group-hover:scale-110 transition-transform duration-700"
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

          {/* Floating particles effect on hover */}
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

          {/* Action buttons - only show if handlers exist */}
          {(toggleWishlist || addToCartHandler) && (
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

          {/* Price badge */}
          <div className="absolute top-4 left-4 transform hover:scale-105 transition-transform duration-300">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
              ₹{product.price.toLocaleString()}
            </span>
          </div>

          {/* Rating badge */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-yellow-400 shadow-sm">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-medium text-gray-600">4.5</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-text line-clamp-1 text-lg group-hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-text">
                ₹{product.price.toLocaleString()}
              </span>
            </div>

            {addToCartHandler && (
              <button
                className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-all duration-300 relative overflow-hidden ${
                  isInCart
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105"
                } disabled:opacity-70`}
                onClick={handleAddToCart}
                disabled={isCartLoading || isInCart}
              >
                {/* Shine effect on hover */}
                {!isInCart && !isCartLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}

                {isCartLoading ? (
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
