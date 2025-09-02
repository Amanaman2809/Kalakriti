"use client";

import React, { useEffect, useState } from "react";
import { Category } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function CategoryPage() {
  const [categoryData, setCategoryData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        setCategoryData(categories);
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
    return (
      <ErrorDisplay error={error} onRetry={() => window.location.reload()} />
    );
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
            Discover handcrafted treasures from Rajasthan&apos;s finest artisans,
            where each piece tells a story of tradition and craftsmanship
          </p>

          <div className="flex items-center justify-center mt-8">
            <div className="w-16 h-px bg-silver"></div>
            <div className="w-2 h-2 bg-silver rounded-full mx-4"></div>
            <div className="w-16 h-px bg-silver"></div>
          </div>
        </header>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {categoryData.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>

        {/* Call to Action */}
        <CallToAction />
      </div>
    </div>
  );
}

// Category Card Component
const CategoryCard = React.memo(function CategoryCardComp({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  // Use a placeholder image or category-specific image if available
  const imageUrl =
    category.image ||
    `/api/placeholder/400/400?text=${encodeURIComponent(category.name)}`;

  return (
    <Link
      key={index}
      href={`/category/${category.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-accent hover:border-secondary/30"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={category.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

        {/* Category name */}
        <div className="absolute bottom-6 left-6 right-6">
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-y-[-2px] transition-transform">
            {category.name}
          </h3>
          <div className="flex items-center text-white/90">
            <span className="text-sm font-medium">Explore Collection</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-1">
              <div className="aspect-square bg-accent rounded-xl mb-4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Error display component
const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-accent">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-500">⚠️</span>
        </div>
        <h3 className="text-xl font-semibold text-text mb-2">
          Something went wrong
        </h3>
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

// Call to action component
const CallToAction = () => (
  <div className="text-center mt-12 pt-12 border-t border-gray-200">
    <h3 className="text-2xl font-bold text-primary mb-4">
      Looking for something special?
    </h3>
    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
      Our artisans create custom pieces tailored to your preferences. Share your
      vision with us and we&apos;ll craft something truly unique for you.
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
