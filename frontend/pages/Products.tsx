"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Product } from "@/utils/types";
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

  const initialPriceRange = searchParams?.get("price") || "";
  const [selectedPriceRange, setSelectedPriceRange] = useState(initialPriceRange);
  const router = useRouter();
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
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/search?${params.toString()}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();
        setProducts((prev) =>
          page === 1 ? data.products : [...prev, ...data.products]
        );
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, selectedPriceRange, page]);
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
              <ChevronDown className={`h-4 w-4 transition-transform ${showPriceFilter ? "rotate-180" : ""
                }`} />
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
                      className={`block w-full text-left px-4 py-2 text-sm ${selectedPriceRange === range.value
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
          <p className="text-gray-500">No products found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
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