"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Category, Product } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShoppingCart, Star, Heart, Plus, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addToCart as addToCartAPI,
  addToWishlist,
  removeFromWishlist,
  getWishlist
} from "@/utils/product";

interface CategoryWithProducts extends Category {
  products: Product[];
}

interface InteractionState {
  wishlist: Record<string, boolean>;
  cart: Record<string, boolean>;
  loading: Record<string, boolean>;
}

export default function CategoryPage() {
  const [categoryData, setCategoryData] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<InteractionState>({
    wishlist: {},
    cart: {},
    loading: {}
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load wishlist on mount
  useEffect(() => {
    if (!mounted) return;

    const loadWishlist = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const wishlistItems = await getWishlist();
        const wishlistMap: Record<string, boolean> = {};
        wishlistItems.forEach(item => {
          wishlistMap[item.product.id] = true;
        });

        setInteractions(prev => ({
          ...prev,
          wishlist: wishlistMap
        }));
      } catch (error) {
        console.error("Error loading wishlist:", error);
      }
    };

    loadWishlist();
  }, [mounted]);

  const toggleWishlist = useCallback(async (productId: string, productName: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to manage wishlist", {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    const isInWishlist = interactions.wishlist[productId] || false;

    // Optimistic update
    setInteractions(prev => ({
      ...prev,
      wishlist: {
        ...prev.wishlist,
        [productId]: !isInWishlist
      },
      loading: {
        ...prev.loading,
        [`wishlist-${productId}`]: true
      }
    }));

    try {
      if (isInWishlist) {
        await removeFromWishlist(productId);
        toast.success(`Removed "${productName}" from wishlist`, {
          duration: 2000,
          position: 'top-center'
        });
      } else {
        await addToWishlist(productId);
        toast.success(`❤️ Added "${productName}" to wishlist`, {
          duration: 2000,
          position: 'top-center'
        });
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setInteractions(prev => ({
        ...prev,
        wishlist: {
          ...prev.wishlist,
          [productId]: isInWishlist
        }
      }));

      toast.error(error.message || "Failed to update wishlist", {
        duration: 3000,
        position: 'top-center'
      });
    } finally {
      setInteractions(prev => ({
        ...prev,
        loading: {
          ...prev.loading,
          [`wishlist-${productId}`]: false
        }
      }));
    }
  }, [interactions.wishlist]);

  const addToCartHandler = useCallback(async (productId: string, productName: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add items to cart", {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    if (interactions.cart[productId]) {
      toast.success(`"${productName}" is already in cart`, {
        duration: 2000,
        position: 'top-center'
      });
      return;
    }

    // Optimistic update
    setInteractions(prev => ({
      ...prev,
      loading: {
        ...prev.loading,
        [`cart-${productId}`]: true
      }
    }));

    try {
      await addToCartAPI({ productId, quantity: 1 });

      setInteractions(prev => ({
        ...prev,
        cart: {
          ...prev.cart,
          [productId]: true
        }
      }));

      toast.success(`🛒 Added "${productName}" to cart`, {
        duration: 2000,
        position: 'top-center'
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add to cart", {
        duration: 3000,
        position: 'top-center'
      });
    } finally {
      setInteractions(prev => ({
        ...prev,
        loading: {
          ...prev.loading,
          [`cart-${productId}`]: false
        }
      }));
    }
  }, [interactions.cart]);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      const url = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!url) {
        setError("API base URL is not defined");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const catRes = await fetch(`${url}/api/categories`);
        if (!catRes.ok) throw new Error("Failed to fetch categories");

        const categories: Category[] = await catRes.json();
        const topCategories = categories.slice(0, 5);

        const withProducts: CategoryWithProducts[] = await Promise.all(
          topCategories.map(async (cat) => {
            try {
              const prodRes = await fetch(`${url}/api/category/${cat.id}/products`);
              if (!prodRes.ok) return { ...cat, products: [] };

              const products: Product[] = await prodRes.json();
              return {
                ...cat,
                products: products.slice(0, 8).map(p => ({
                  ...p,
                  rating: 4.5 // Fixed rating to avoid hydration issues
                }))
              };
            } catch (err) {
              console.error(`Error fetching products for ${cat.name}:`, err);
              return { ...cat, products: [] };
            }
          })
        );

        setCategoryData(withProducts);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load category data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted]);

  if (!mounted || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Explore Our <span className="text-primary">Collections</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover handcrafted treasures from Rajasthan's finest artisans,
            where each piece tells a story of tradition and craftsmanship
          </p>

          <div className="flex items-center justify-center mt-8">
            <div className="w-16 h-px bg-silver"></div>
            <div className="w-2 h-2 bg-silver rounded-full mx-4"></div>
            <div className="w-16 h-px bg-silver"></div>
          </div>
        </header>

        {/* Categories */}
        <div className="space-y-20">
          {categoryData.map((category, index) => (
            <CategorySection
              key={category.id}
              category={category}
              interactions={interactions}
              onToggleWishlist={toggleWishlist}
              onAddToCart={addToCartHandler}
              isLast={index === categoryData.length - 1}
            />
          ))}
        </div>

        {/* Call to Action */}
        {categoryData.length > 0 && <CallToAction />}
      </div>
    </div>
  );
}

// Component for individual category section
const CategorySection = React.memo(({
  category,
  interactions,
  onToggleWishlist,
  onAddToCart,
  isLast
}: {
  category: CategoryWithProducts;
  interactions: InteractionState;
  onToggleWishlist: (id: string, name: string) => void;
  onAddToCart: (id: string, name: string) => void;
  isLast: boolean;
}) => (
  <section className="relative">
    <div className="flex justify-between items-center mb-8">
      <div>
        <h2 className="text-3xl font-bold text-primary mb-2">
          {category.name}
        </h2>
        <p className="text-gray-600">
          Handpicked {category.name.toLowerCase()} from master artisans
        </p>
      </div>
      <Link
        href={`/category/${category.id}`}
        className="flex items-center gap-2 hover:text-secondary text-primary transition-colors font-medium group"
      >
        View All
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>

    {category.products.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {category.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            interactions={interactions}
            onToggleWishlist={onToggleWishlist}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    ) : (
      <EmptyState categoryName={category.name} />
    )}

    {/* Decorative Separator */}
    {!isLast && (
      <div className="flex items-center justify-center mt-20">
        <div className="w-32 h-px bg-gray-200"></div>
        <div className="w-3 h-3 bg-silver rounded-full mx-6"></div>
        <div className="w-32 h-px bg-gray-200"></div>
      </div>
    )}
  </section>
));

// Product card component
const ProductCard = React.memo(({
  product,
  interactions,
  onToggleWishlist,
  onAddToCart
}: {
  product: Product;
  interactions: InteractionState;
  onToggleWishlist: (id: string, name: string) => void;
  onAddToCart: (id: string, name: string) => void;
}) => {
  const isInWishlist = interactions.wishlist[product.id] || false;
  const isInCart = interactions.cart[product.id] || false;
  const isWishlistLoading = interactions.loading[`wishlist-${product.id}`] || false;
  const isCartLoading = interactions.loading[`cart-${product.id}`] || false;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-accent hover:border-secondary/30">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-accent flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist(product.id, product.name);
              }}
              disabled={isWishlistLoading}
              className={`p-3 rounded-full transition-all duration-200 shadow-lg ${isInWishlist
                  ? 'bg-red-500 text-white scale-110'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-110'
                } disabled:opacity-70`}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlistLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart
                  className={`w-5 h-5 transition-all duration-200 ${isInWishlist ? 'fill-current' : ''
                    }`}
                />
              )}
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(product.id, product.name);
              }}
              disabled={isCartLoading || isInCart}
              className={`p-3 rounded-full transition-all duration-200 shadow-lg ${isInCart
                  ? 'bg-green-500 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-110'
                } disabled:opacity-70`}
              title={isInCart ? 'Added to cart' : 'Add to cart'}
            >
              {isCartLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isInCart ? (
                <Check className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Price Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
              ₹{product.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-text line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < 4 ? 'text-silver fill-current' : 'text-gray-300'
                    }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">(4.5)</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isInCart
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-primary text-white hover:bg-primary/90'
                } disabled:opacity-70`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(product.id, product.name);
              }}
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
                  Add to Cart
                </>
              )}
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist(product.id, product.name);
              }}
              disabled={isWishlistLoading}
              className={`p-3 rounded-xl border transition-all duration-200 ${isInWishlist
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                } disabled:opacity-70`}
            >
              {isWishlistLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart
                  className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`}
                />
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
});

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="animate-pulse">
        <div className="text-center mb-16">
          <div className="h-12 w-80 bg-accent rounded-lg mx-auto mb-4"></div>
          <div className="h-6 w-96 bg-accent rounded mx-auto"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-16">
            <div className="h-8 w-48 bg-accent rounded mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="aspect-square bg-accent rounded-lg mb-4"></div>
                  <div className="h-5 bg-accent rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-accent rounded mb-3"></div>
                  <div className="h-6 w-1/2 bg-accent rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Error display component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-accent">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-500">⚠️</span>
        </div>
        <h3 className="text-xl font-semibold text-text mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState = ({ categoryName }: { categoryName: string }) => (
  <div className="bg-white rounded-2xl p-12 text-center border border-accent">
    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-2xl">🎨</span>
    </div>
    <h3 className="text-xl font-semibold text-text mb-2">Coming Soon</h3>
    <p className="text-gray-600">
      Beautiful {categoryName.toLowerCase()} are being curated by our artisans.
      Check back soon for amazing handcrafted pieces!
    </p>
  </div>
);

// Call to action component
const CallToAction = () => (
  <div className="text-center mt-20 pt-16 border-t border-gray-200">
    <h3 className="text-2xl font-bold text-primary mb-4">
      Can't find what you're looking for?
    </h3>
    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
      Our artisans are always creating new masterpieces.
      Get in touch and we'll help you find the perfect handcrafted piece.
    </p>
    <Link
      href="/contact"
      className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-medium hover:bg-primary/90 transition-colors"
    >
      Contact Our Artisans
      <ChevronRight className="w-5 h-5" />
    </Link>
  </div>
);