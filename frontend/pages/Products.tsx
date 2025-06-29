"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import Filters from "@/components/ui/Filters";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  tags: string[];
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const query = useMemo(() => searchParams?.get("q") || "", [searchParams]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    minPrice: searchParams ? searchParams.get("minPrice") || "" : "",
    maxPrice: searchParams ? searchParams.get("maxPrice") || "" : "",
  });

  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          page: String(page),
          limit: "10",
          ...(filters.minPrice && { minPrice: filters.minPrice }),
          ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        });

        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL
          }/api/search?${params.toString()}`
        );
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

    if (query) {
      fetchProducts();
    }
  }, [query, filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);

    const params = new URLSearchParams({
      q: query,
      ...(newFilters.minPrice && { minPrice: newFilters.minPrice }),
      ...(newFilters.maxPrice && { maxPrice: newFilters.maxPrice }),
    });

    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Results for "${query}"` : "All Products"}
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters sidebar */}
        <div className="w-full md:w-64">
          <Filters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
