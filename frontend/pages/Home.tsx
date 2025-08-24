"use client";

import HeroSection from "@/components/ui/HeroSection";
import { MoveRight, Star, ShoppingCart, Heart, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { Category, Product, ProductsResponse } from '@/utils/types';
import toast from "react-hot-toast";
import {
  addToCart as addToCartAPI,
  addToWishlist,
  removeFromWishlist,
  getWishlist
} from "@/utils/product";

interface InteractionState {
  wishlist: Record<string, boolean>;
  cart: Record<string, boolean>;
  loading: Record<string, boolean>;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!mounted) return;

    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
      console.error("API base URL is not defined");
      return;
    }

    const fetchData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch(`${url}/api/categories`),
          fetch(`${url}/api/products`)
        ]);

        if (!categoriesRes.ok || !productsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const categoriesData = await categoriesRes.json();
        const productsData: ProductsResponse = await productsRes.json();

        // Filter out categories without images and limit to 5
        setCategories(categoriesData.filter((cat: Category) => cat.image).slice(0, 5));

        const productsWithRatings = productsData.products
          .slice(0, 20)
          .map((product) => ({
            ...product,
            rating: 4.5, // Fixed rating to avoid hydration issues
          }));

        setProducts(productsWithRatings);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

      toast.success(`Added "${productName}" to cart`, {
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

  if (!mounted || loading) {
    return (
      <main className="bg-background">
        <div className="animate-pulse">
          <div className="h-[70vh] bg-accent"></div>
          <div className="px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="h-8 bg-accent rounded w-48 mb-8 mx-auto"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-accent rounded-full"></div>
                    <div className="h-4 bg-accent rounded w-20 mt-4"></div>
                  </div>
                ))}
              </div>
              <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4">
                    <div className="aspect-square bg-accent rounded-lg mb-4"></div>
                    <div className="h-5 bg-accent rounded mb-2"></div>
                    <div className="h-4 w-3/4 bg-accent rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background">
      <HeroSection />

      {/* Categories Section */}
      <section className="px-4 sm:px-6 py-16 bg-secondary/30 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Explore our curated collection of traditional Indian handicrafts
            </p>
            <div className="w-24 h-1 bg-silver mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
            {categories.map(({ id, name, image }) => (
              <Link
                key={id}
                href={`/category/${id}`}
                className="group flex flex-col items-center text-center"
              >
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-3 border-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  {image ? (
                    <Image
                      src={image}
                      fill
                      alt={name}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-accent flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300"></div>
                </div>
                <h3 className="mt-4 font-semibold text-text group-hover:text-primary transition-colors text-sm sm:text-base">
                  {name}
                </h3>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/category"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold text-lg group"
            >
              View All Categories
              <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="px-4 sm:px-6 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Handpicked masterpieces showcasing the finest Indian craftsmanship
            </p>
            <div className="w-24 h-1 bg-silver mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {products.map((product) => {
              const isInWishlist = interactions.wishlist[product.id] || false;
              const isInCart = interactions.cart[product.id] || false;
              const isWishlistLoading = interactions.loading[`wishlist-${product.id}`] || false;
              const isCartLoading = interactions.loading[`cart-${product.id}`] || false;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-accent hover:border-secondary/30"
                >
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

                      {/* Action buttons */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(product.id, product.name);
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
                            addToCartHandler(product.id, product.name);
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
                            <ShoppingCart className="w-5 h-5" />
                          )}
                        </button>
                      </div>

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
                        <div className="flex items-center gap-1 text-silver">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium text-gray-600">4.5</span>
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
                          <span className="text-sm text-gray-500">Free shipping</span>
                        </div>

                        <button
                          className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-all duration-200 ${isInCart
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl'
                            } disabled:opacity-70`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCartHandler(product.id, product.name);
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
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl group"
            >
              View All Products
              <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
