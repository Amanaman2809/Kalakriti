"use client";

import React, { useEffect, useState } from "react";
import { Category, Product } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ShoppingCart, Star } from "lucide-react";

interface CategoryWithProducts extends Category {
  products: Product[];
}

function CategoryPage() {
  const [categoryData, setCategoryData] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
      setError("API base URL is not defined");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Step 1: Get categories
        const catRes = await fetch(`${url}/api/categories`);
        if (!catRes.ok) throw new Error(`Category fetch failed with status ${catRes.status}`);
        const categories: Category[] = await catRes.json();
        const topCategories = categories.slice(0, 5);

        // Step 2: Fetch products for each category
        const withProducts: CategoryWithProducts[] = await Promise.all(
          topCategories.map(async (cat) => {
            try {
              const prodRes = await fetch(`${url}/api/category/${cat.id}/products`);
              if (!prodRes.ok) {
                throw new Error(`Failed to fetch products for category ${cat.name}`);
              }
              const products: Product[] = await prodRes.json();
              console.log(`Fetched ${products.length} products for category ${cat.name}`);
              return { 
                ...cat, 
                products: products.map(p => ({
                  ...p,
                  rating: Math.floor(Math.random() * 2) + 4 // Random rating 4-5 for demo
                })) 
              };
            } catch (err) {
              console.error(`Error fetching products for category ${cat.name}:`, err);
              return { ...cat, products: [] };
            }
          })
        );

        setCategoryData(withProducts);
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError("Failed to load category data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="px-6 py-16 text-center bg-accent rounded-lg">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-48 bg-secondary rounded mb-4"></div>
        <div className="h-4 w-64 bg-secondary rounded mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="aspect-square bg-secondary rounded-lg mb-3"></div>
              <div className="h-5 bg-secondary rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-secondary rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="px-6 py-16 text-center bg-accent rounded-lg">
      <div className="text-red-500 bg-white p-6 rounded-lg shadow-sm max-w-md mx-auto">
        {error}
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-12 bg-accent min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
            Explore Our Collections
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover handcrafted treasures from Rajasthan's finest artisans
          </p>
        </div>

        {/* Categories */}
        {categoryData.map((category) => (
          <section key={category.id} className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">
                {category.name}
              </h2>
              <Link 
                href={`/category/${category.id}`}
                className="flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {category.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {category.products.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group"
                  >
                    <Link href={`/product/${product.id}`}>
                      {/* Product Image */}
                      <div className="relative aspect-square">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:opacity-90 transition-opacity"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                        {/* Quick View Badge */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                            Quick View
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900 line-clamp-1">
                            {product.name}
                          </h3>
                          {product.rating && (
                            <div className="flex items-center text-sm text-gold">
                              <Star className="w-4 h-4 fill-gold" />
                              <span className="ml-1">{product.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="font-bold text-primary">
                            ₹{product.price.toLocaleString()}
                          </span>
                          <button
                            className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              // TODO: Add to cart logic
                            }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg text-center">
                <p className="text-gray-500">
                  No products available in this category yet. Check back soon!
                </p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export default CategoryPage;