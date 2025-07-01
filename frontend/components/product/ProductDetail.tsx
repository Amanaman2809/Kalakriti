"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Star,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CartParams, FeedbackSummary, Product } from "@/utils/types";
import { addToCart, similarCatProd } from "@/utils/product";
import ProductCard from "./ProductCard";
import toast from "react-hot-toast";

interface ProductDetailProps {
  feedback: FeedbackSummary | null;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ feedback }) => {
  const params = useParams();
  const productId = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!productId) {
      setError("Product ID is required");
      setLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data: Product = await response.json();
        setProduct(data);

        if (data.category?.id) {
          try {
            const similar = await similarCatProd(data.category.id);
            setSimilarProducts(similar);
          } catch (error) {
            console.error("Failed to fetch similar products:", error);
          }
        }
      } catch (error: any) {
        setError(error.message || "Failed to fetch product details");
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product) return;

    const item: CartParams = {
      productId: product.id,
      quantity: quantity,
    };

    try {
      await addToCart(item);
      toast.success(
        `${quantity} ${quantity > 1 ? "items" : "item"} added to Cart`,
        {
          position: "bottom-right",
          style: {
            background: "#4BB543",
            color: "#fff",
          },
        }
      );
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add item to cart", {
        position: "bottom-right",
      });
    }
  };

  const addToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
      toast.error("Service unavailable. Please try again later.", {
        position: "bottom-right",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add items to wishlist", {
        position: "bottom-right",
      });
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${url}/api/wishlist`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId: productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add to wishlist");
      }

      toast.success("Added to wishlist successfully", {
        position: "bottom-right",
        style: {
          background: "#4BB543",
          color: "#fff",
        },
      });
    } catch (error: any) {
      console.error("Wishlist error:", error);
      toast.error(error.message || "Failed to add to wishlist", {
        position: "bottom-right",
      });
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else {
      toast.error("Cannot exceed available stock", {
        position: "bottom-right",
      });
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const renderDescription = () => {
    if (!product?.description) return null;

    const descriptionPoints = product.description
      .split(". ")
      .filter((point) => point.trim() !== "");

    return (
      <div className="mb-6">
        {showFullDescription ? (
          <ul className="list-disc pl-5 space-y-2 text-text">
            {descriptionPoints.map((point, index) => (
              <li key={index} className="text-base">
                {point.trim()}
                {!point.endsWith(".") && "."}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-text">
            <ul className="list-disc pl-5 space-y-2">
              {descriptionPoints.slice(0, 3).map((point, index) => (
                <li key={index} className="text-base">
                  {point.trim()}
                  {!point.endsWith(".") && "."}
                </li>
              ))}
            </ul>
            {descriptionPoints.length > 3 && (
              <button
                onClick={() => setShowFullDescription(true)}
                className="text-primary mt-3 flex items-center text-sm font-medium hover:underline"
              >
                Read more <ChevronDown className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>
        )}
        {showFullDescription && descriptionPoints.length > 3 && (
          <button
            onClick={() => setShowFullDescription(false)}
            className="text-primary mt-3 flex items-center text-sm font-medium hover:underline"
          >
            Show less <ChevronUp className="h-4 w-4 ml-1" />
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-lg">Product not found</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-secondary hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="ml-1 font-medium">Back to products</span>
          </button>
        </div>

        {/* Product content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {/* Main image */}
            <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-6">
              <Image
                src={
                  product.images[currentImageIndex] ||
                  "/placeholder-product.jpg"
                }
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Thumbnail images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentImageIndex(index);
                    }}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                      currentImageIndex === index
                        ? "border-primary scale-95 shadow-md"
                        : "border-transparent hover:border-gray-200"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {/* Category */}
            <Link
              href={`/categories/${product.categoryId}`}
              className="text-sm text-primary hover:underline font-medium"
            >
              {product.category.name}
            </Link>

            {/* Title */}
            <h1 className="text-3xl font-bold mt-2 mb-3 text-gray-900">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center mb-4 gap-2">
              <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="text-lg font-bold text-primary">
                  {feedback?.avg_rating.toFixed(1) || "0.0"}
                </span>
                <Star className="h-5 w-5 fill-primary" />
              </div>
              <span className="text-sm text-gray-600">
                {feedback?.total_reviews || 0} reviews
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-3xl font-bold text-gray-900">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              {product.stock > 0 ? (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  In Stock ({product.stock} available)
                </p>
              ) : (
                <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Out of Stock
                </p>
              )}
            </div>

            {/* Quantity selector */}
            {product.stock > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium mb-2 text-gray-700">
                  Quantity
                </h2>
                <div className="flex items-center border border-gray-200 rounded-lg w-fit">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:text-gray-300 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-200 text-gray-900 font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:text-gray-300 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium mb-2 text-gray-700">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/search?query=${tag}`}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  product.stock === 0
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 text-white"
                } font-medium`}
              >
                <ShoppingCart className="h-5 w-5" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>

              <button
                onClick={addToWishlist}
                className="p-3 rounded-lg border border-gray-300 text-gray-700 hover:border-primary hover:text-primary flex items-center justify-center transition-colors"
                aria-label="Add to wishlist"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Description section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">
            About this item
          </h2>
          {renderDescription()}
        </div>

        {/* Support section */}
        <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100 mt-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900">
            Need Assistance?
          </h3>
          <p className="text-gray-700 mb-4">
            Facing an issue with your order? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:+919853823363"
              className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Call Support
            </a>
            <a
              href="https://wa.me/919853823363"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-secondary text-primary px-4 py-2 rounded-lg text-sm hover:bg-primary hover:text-accent transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              WhatsApp Assistance
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Available 10 am to 8 pm IST, Monday to Saturday
          </p>
        </div>

        {/* Similar products section */}
        {similarProducts.length - 1 > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Similar Products
              </h2>
              <Link
                href={`/categories/${product.categoryId}`}
                className="text-primary hover:underline text-sm font-medium"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarProducts
                .filter((product) => product.id !== productId)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
