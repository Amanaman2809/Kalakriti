"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import ProductCard from "@/components/product/ProductCard";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Filter,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Product } from "@/utils/types";

const priceRanges = [
  { label: "All Prices", value: "" },
  { label: "Under ₹500", value: "0-500" },
  { label: "₹500 - ₹1000", value: "500-1000" },
  { label: "₹1000 - ₹2000", value: "1000-2000" },
  { label: "₹2000 - ₹5000", value: "2000-5000" },
  { label: "Over ₹5000", value: "5000-" },
];

const sortOptions = [
  { label: "Featured", value: "" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest First", value: "newest" },
  { label: "Name: A to Z", value: "name-asc" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = useMemo(() => searchParams?.get("q") || "", [searchParams]);
  const initialPriceRange = searchParams?.get("price") || "";
  const initialSort = searchParams?.get("sort") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [selectedPriceRange, setSelectedPriceRange] = useState(initialPriceRange);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [showFilters, setShowFilters] = useState(false);

  // Dropdowns state
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [showSortFilter, setShowSortFilter] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProducts = useCallback(async (pageNum: number = 1, resetProducts: boolean = true) => {
    if (!mounted) return;

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
        page: String(pageNum),
        limit: "12",
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(selectedSort && { sort: selectedSort }),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/search?${params.toString()}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
      setProducts((prev) =>
        resetProducts ? data.products : [...prev, ...data.products]
      );
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [query, selectedPriceRange, selectedSort, mounted]);

  useEffect(() => {
    fetchProducts(1, true);
    setPage(1);
  }, [fetchProducts]);

  const handleFilterChange = useCallback((type: 'price' | 'sort', value: string) => {
    if (type === 'price') {
      setSelectedPriceRange(value);
    } else {
      setSelectedSort(value);
    }

    setPage(1);

    const params = new URLSearchParams({
      q: query,
      ...(type === 'price' && value && { price: value }),
      ...(type === 'sort' && value && { sort: value }),
      ...(type === 'price' && selectedSort && { sort: selectedSort }),
      ...(type === 'sort' && selectedPriceRange && { price: selectedPriceRange }),
    });

    router.push(`/products?${params.toString()}`);
  }, [query, selectedPriceRange, selectedSort, router]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, false);
  }, [page, fetchProducts]);

  const clearFilters = useCallback(() => {
    setSelectedPriceRange("");
    setSelectedSort("");
    router.push(`/products${query ? `?q=${query}` : ''}`);
  }, [query, router]);

  const resultCount = products.length;
  const showResultsText = query
    ? `${resultCount} results for "${query}"`
    : `${resultCount} products`;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">
                {query ? `Search Results` : 'All Products'}
              </h1>
              <p className="text-gray-600">{showResultsText}</p>
            </div>

            {/* View toggle and filters */}
            <div className="flex items-center gap-4">

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-xl border border-accent">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Price filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowPriceFilter(!showPriceFilter);
                      setShowSortFilter(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 min-w-[160px] justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>
                        {priceRanges.find(r => r.value === selectedPriceRange)?.label || 'Price Range'}
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showPriceFilter ? "rotate-180" : ""
                      }`} />
                  </button>

                  {showPriceFilter && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        {priceRanges.map((range) => (
                          <button
                            key={range.value}
                            onClick={() => {
                              handleFilterChange('price', range.value);
                              setShowPriceFilter(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${selectedPriceRange === range.value
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                              }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSortFilter(!showSortFilter);
                      setShowPriceFilter(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 min-w-[160px] justify-between"
                  >
                    <span>
                      {sortOptions.find(s => s.value === selectedSort)?.label || 'Sort by'}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showSortFilter ? "rotate-180" : ""
                      }`} />
                  </button>

                  {showSortFilter && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              handleFilterChange('sort', option.value);
                              setShowSortFilter(false);
                            }}
                            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${selectedSort === option.value
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear filters */}
              {(selectedPriceRange || selectedSort) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products */}
        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-text mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {query
                ? `No products match your search for "${query}". Try adjusting your filters or search terms.`
                : "No products found. Try adjusting your filters."
              }
            </p>
            {(selectedPriceRange || selectedSort || query) && (
              <button
                onClick={clearFilters}
                className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={ 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-primary text-white px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-70 flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More Products'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
