"use client";

import HeroSection from "@/components/ui/HeroSection";
import { MoveRight, Star, ShoppingCart, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Category, Product, ProductsResponse } from '@/utils/types';

function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            rating: Math.floor(Math.random() * 3) + 3,
          }));

        setProducts(productsWithRatings);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="bg-gray-50">
        <div className="animate-pulse">
          <div className="h-[70vh] bg-gray-300"></div>
          <div className="px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <div className="h-8 bg-gray-300 rounded w-48 mb-8"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-20 mt-4"></div>
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
    <main className="bg-gray-50">
      <HeroSection />

      {/* Categories Section */}
      <section className="px-4 sm:px-6 py-16 bg-secondary relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Explore our curated collection of traditional Indian handicrafts
            </p>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
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
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300"></div>
                </div>
                <h3 className="mt-4 font-semibold text-gray-800 group-hover:text-primary transition-colors text-sm sm:text-base">
                  {name}
                </h3>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/category"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors font-semibold text-lg group"
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Handpicked masterpieces showcasing the finest Indian craftsmanship
            </p>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {products.map(({ id, name, images, description, price }) => (
              <div
                key={id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/20"
              >
                <Link href={`/products/${id}`}>
                  <div className="relative aspect-square overflow-hidden">
                    {images && images.length > 0 ? (
                      <Image
                        src={images[0]}
                        fill
                        alt={name}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 text-lg">
                        {name}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium text-gray-600">4.5</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                      {description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-gray-900">
                          ₹{price.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">Free shipping</span>
                      </div>

                      <button
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                        onClick={(e) => {
                          e.preventDefault();
                          // TODO: Add to cart logic
                        }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl group"
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

export default Home;
