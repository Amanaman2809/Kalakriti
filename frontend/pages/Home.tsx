"use client";

import HeroSection from "@/components/ui/HeroSection";
import { MoveRight, Star, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Category, Product, ProductsResponse } from '@/utils/types';
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
      console.error("API base URL is not defined");
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${url}/api/categories`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setCategories(data.slice(0, 5)); // Top 5 categories
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch(`${url}/api/products`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: ProductsResponse = await res.json();
        // Add mock ratings for demonstration
        const productsWithRatings = data.products
          .slice(0, 20)
          .map((product) => ({
            ...product,
            rating: Math.floor(Math.random() * 3) + 3, // Random rating between 3-5
          }));
        setProducts(productsWithRatings);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchCategories();
    fetchProducts();
  }, []);

  return (
    <main className="bg-gray-50">
      <HeroSection />

      {/* Categories Section */}
      <section className="px-6 py-12 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <Link
              href="/category"
              className="flex font-semibold pb-2 items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              View all
              <MoveRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {categories.map(({ id, name, image }) => (
              <Link
                key={id}
                href={`/category/${id}`}
                className="group flex flex-col items-center text-center hover:scale-105 transition-transform duration-200"
              >
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-secondary group-hover:border-primary transition-colors">
                  <Image
                    src={image}
                    fill
                    alt={name}
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                </div>
                <h3 className="mt-4 font-medium text-gray-800 group-hover:text-primary transition-colors">
                  {name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="px-6 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Featured Products
              </h2>
              <div className="w-20 h-1 bg-primary rounded-full"></div>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors font-semibold pb-1"
            >
              View All Products
              <MoveRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(
              ({ id, name, images, description, price }) => (
                <div
                  key={id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <Link href={`/products/${id}`}>
                    <div className="relative aspect-square">
                      <Image
                        src={images[0]}
                        fill
                        alt={name}
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-4 bg-secondary h-40 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900 line-clamp-1">
                            {name}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {description}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="font-bold text-gray-900">
                          ₹{price.toLocaleString()}
                        </span>
                        <button
                          className="p-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
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
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
