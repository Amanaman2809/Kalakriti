"use client";

import { useEffect, useState, useCallback } from "react";
import { InteractionState, Product } from "@/utils/types";
import Link from "next/link";
import { Heart, MoveRight } from "lucide-react";
import ProductCard from "../product/ProductCard";
import toast from "react-hot-toast";
import {
  addToCart as addToCartAPI,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "@/utils/product";


const CHARITY_CATEGORY_ID = "f95d41b4-9a43-4f03-a675-1311a205c72e";

export default function CharitySection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [interactions, setInteractions] = useState<InteractionState>({
    wishlist: {},
    cart: {},
    loading: {},
  });

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
        wishlistItems.forEach((item) => {
          wishlistMap[item.product.id] = true;
        });

        setInteractions((prev) => ({
          ...prev,
          wishlist: wishlistMap,
        }));
      } catch (error) {
        console.error("Error loading wishlist:", error);
      }
    };

    loadWishlist();
  }, [mounted]);

  useEffect(() => {
    const fetchCharityProducts = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!url) throw new Error("API base URL not set");

        const res = await fetch(
          `${url}/api/category/${CHARITY_CATEGORY_ID}/products`,
        );
        if (!res.ok) throw new Error("Failed to fetch charity products");

        const data = await res.json();
        setProducts(data.slice(0, 4)); // Show 4 charity products to match grid
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharityProducts();
  }, []);

  // Wishlist toggle handler
  const toggleWishlist = useCallback(
    async (productId: string, productName: string) => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to manage wishlist", {
          duration: 3000,
          position: "top-center",
        });
        return;
      }

      const isInWishlist = interactions.wishlist[productId] || false;

      // Optimistic update
      setInteractions((prev) => ({
        ...prev,
        wishlist: {
          ...prev.wishlist,
          [productId]: !isInWishlist,
        },
        loading: {
          ...prev.loading,
          [`wishlist-${productId}`]: true,
        },
      }));

      try {
        if (isInWishlist) {
          await removeFromWishlist(productId);
          toast.success(`💔 Removed "${productName}" from wishlist`, {
            duration: 2000,
            position: "top-center",
          });
        } else {
          await addToWishlist(productId);
          toast.success(`❤️ Added "${productName}" to wishlist - Supporting charity!`, {
            duration: 2000,
            position: "top-center",
          });
        }
      } catch (error: any) {
        // Revert optimistic update on error
        setInteractions((prev) => ({
          ...prev,
          wishlist: {
            ...prev.wishlist,
            [productId]: isInWishlist,
          },
        }));

        toast.error(error.message || "Failed to update wishlist", {
          duration: 3000,
          position: "top-center",
        });
      } finally {
        setInteractions((prev) => ({
          ...prev,
          loading: {
            ...prev.loading,
            [`wishlist-${productId}`]: false,
          },
        }));
      }
    },
    [interactions.wishlist],
  );

  // Add to cart handler
  const addToCartHandler = useCallback(
    async (productId: string, productName: string) => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to add items to cart", {
          duration: 3000,
          position: "top-center",
        });
        return;
      }

      if (interactions.cart[productId]) {
        toast.success(`"${productName}" is already in cart - Thank you for supporting charity!`, {
          duration: 2000,
          position: "top-center",
        });
        return;
      }

      // Optimistic update
      setInteractions((prev) => ({
        ...prev,
        loading: {
          ...prev.loading,
          [`cart-${productId}`]: true,
        },
      }));

      try {
        await addToCartAPI({ productId, quantity: 1 });

        setInteractions((prev) => ({
          ...prev,
          cart: {
            ...prev.cart,
            [productId]: true,
          },
        }));

        toast.success(`🎉 Added "${productName}" to cart - Making a difference!`, {
          duration: 2000,
          position: "top-center",
        });
      } catch (error: any) {
        toast.error(error.message || "Failed to add to cart", {
          duration: 3000,
          position: "top-center",
        });
      } finally {
        setInteractions((prev) => ({
          ...prev,
          loading: {
            ...prev.loading,
            [`cart-${productId}`]: false,
          },
        }));
      }
    },
    [interactions.cart],
  );

  if (!mounted || loading) {
    return (
      <section className="px-4 sm:px-6 py-20 bg-gradient-to-br from-primary/5 via-secondary/10 to-primary/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-accent rounded w-48 mb-8 mx-auto"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="aspect-square bg-accent rounded-lg mb-4"></div>
                  <div className="h-6 bg-accent rounded mb-2"></div>
                  <div className="h-4 w-3/4 bg-accent rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="px-4 sm:px-6 py-20 bg-gradient-to-br from-primary/5 via-secondary/10 to-primary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full translate-y-24 -translate-x-24"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-2 rounded-full mb-6">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-semibold">Making a Difference</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-text mb-6">
            Shop with Purpose,
            <span className="text-primary"> Create Change</span>
          </h2>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Every purchase from our charity collection directly supports
            artisans in need and contributes to community development
            initiatives. 100% of the proceeds from these specially curated items
            go directly to our partner charities.
          </p>

          <div className="bg-primary/10 p-6 rounded-2xl max-w-2xl mx-auto mb-8">
            <h3 className="text-xl font-bold text-primary mb-3">Your Impact</h3>
            <p className="text-gray-700">
              By choosing these products, you're not just acquiring beautiful
              handicrafts - you're providing education for children, healthcare
              for families, and sustainable livelihoods for communities across
              India.
            </p>
          </div>

          <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Products Grid with Full Functionality */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              interactions={interactions}
              toggleWishlist={toggleWishlist}
              addToCartHandler={addToCartHandler}
            />
          ))}
        </div>

        <div className="text-center">
          <Link
            href={`/category/${CHARITY_CATEGORY_ID}`}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            Explore All Charity Products
            <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="text-gray-600 mt-6 text-sm max-w-2xl mx-auto">
            Your purchase makes a real difference. We transparently donate all
            proceeds from these products to verified charitable organizations
            supporting artisan communities across India.
          </p>
        </div>
      </div>
    </section>
  );
}
