import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Check, Loader2 } from "lucide-react";
import { ProductCardProps } from "@/utils/types";


export default function ProductCard({
  product,
  interactions,
  toggleWishlist,
  addToCartHandler
}: ProductCardProps) {
  // Safe access with fallbacks
  const isInWishlist = interactions?.wishlist?.[product.id] || false;
  const isInCart = interactions?.cart?.[product.id] || false;
  const isWishlistLoading = interactions?.loading?.[`wishlist-${product.id}`] || false;
  const isCartLoading = interactions?.loading?.[`cart-${product.id}`] || false;

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
    await addToCartHandler(product.id, product.name);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-accent hover:border-secondary/30">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              fill
              alt={product.name}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-accent flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Action buttons - only show if handlers exist */}
          {(toggleWishlist || addToCartHandler) && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {toggleWishlist && (
                <button
                  onClick={handleToggleWishlist}
                  disabled={isWishlistLoading}
                  className={`p-3 rounded-full transition-all duration-200 shadow-lg ${isInWishlist
                      ? "bg-red-500 text-white scale-110"
                      : "bg-white/90 text-gray-700 hover:bg-white hover:scale-110"
                    } disabled:opacity-70`}
                  title={
                    isInWishlist
                      ? "Remove from wishlist"
                      : "Add to wishlist"
                  }
                >
                  {isWishlistLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-5 h-5 transition-all duration-200 ${isInWishlist ? "fill-current" : ""
                        }`}
                    />
                  )}
                </button>
              )}

              {addToCartHandler && (
                <button
                  onClick={handleAddToCart}
                  disabled={isCartLoading || isInCart}
                  className={`p-3 rounded-full transition-all duration-200 shadow-lg ${isInCart
                      ? "bg-green-500 text-white"
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
          <div className="absolute top-4 left-4">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
              ₹{product.price.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-text line-clamp-1 text-lg group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium text-gray-600">
                4.5
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-text">
                ₹{product.price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">
                Free shipping
              </span>
            </div>

            {addToCartHandler && (
              <button
                className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-all duration-200 ${isInCart
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl"
                  } disabled:opacity-70`}
                onClick={handleAddToCart}
                disabled={isCartLoading || isInCart}
              >
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
                    Add
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
