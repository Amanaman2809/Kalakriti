"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import ProductCard from "@/components/product/ProductCard";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { InteractionState, Product } from "@/utils/types";
import toast from "react-hot-toast";
import {
  addToCart as addToCartAPI,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "@/utils/product";

const priceRanges = [
  { label: "All Prices", value: "" },
  { label: "Under ₹500", value: "0-500" },
  { label: "₹500 - ₹1000", value: "500-1000" },
  { label: "₹1000 - ₹2000", value: "1000-2000" },
  { label: "Over ₹2000", value: "2000-" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const query = useMemo(() => searchParams?.get("q") || "", [searchParams]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Add interactions state
  const [interactions, setInteractions] = useState<InteractionState>({
    wishlist: {},
    cart: {},
    loading: {},
  });

  const initialPriceRange = searchParams?.get("price") || "";
  const [selectedPriceRange, setSelectedPriceRange] =
    useState(initialPriceRange);
  const router = useRouter();

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
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let minPrice = "";
        let maxPrice = "";

        if (selectedPriceRange) {
          const [min, max] = selectedPriceRange.split("-");
          minPrice = min || "";
          maxPrice = max || "";
        }
        const params = new URLSearchParams({
          q: query,
          page: String(page),
          limit: "12",
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
        });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/search?${params.toString()}`,
        );

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();
        setProducts((prev) =>
          page === 1 ? data.products : [...prev, ...data.products],
        );
        setHasMore(data.hasMore);
        console.log(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, selectedPriceRange, page]);

  // Add wishlist toggle handler
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
          toast.success(`Removed "${productName}" from wishlist`, {
            duration: 2000,
            position: "top-center",
          });
        } else {
          await addToWishlist(productId);
          toast.success(`❤️ Added "${productName}" to wishlist`, {
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

  // Add cart handler
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
        toast.success(`"${productName}" is already in cart`, {
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

        toast.success(`Added "${productName}" to cart`, {
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

  const handlePriceRangeChange = (range: string) => {
    setSelectedPriceRange(range);
    setPage(1);

    const params = new URLSearchParams({
      q: query,
      ...(range && { price: range }),
    });
    router.push(`/products?${params.toString()}`);
  };

  const resultCount = products.length;
  const showResultsText = query
    ? `${resultCount} results for "${query}"`
    : `Showing ${resultCount} products`;

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Filter and results header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {showResultsText}
          </h1>

          {/* Price filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPriceFilter(!showPriceFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Price Range
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showPriceFilter ? "rotate-180" : ""
                }`}
              />
            </button>

            {showPriceFilter && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => {
                        handlePriceRangeChange(range.value);
                        setShowPriceFilter(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        selectedPriceRange === range.value
                          ? "bg-gray-100 text-primary"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200"></div>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No products found. Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
