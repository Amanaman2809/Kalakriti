"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Share2,
  Star,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react';
import { Product } from '@/utils/types';
import { addToCart, addToWishlist, removeFromWishlist, getWishlist } from '@/utils/product';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    cart: false,
    wishlist: false,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!productId || !mounted) return;

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

        // Fetch similar products
        if (data.category?.id) {
          try {
            const similarResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/category/${data.category.id}/products`
            );
            if (similarResponse.ok) {
              const similarData = await similarResponse.json();
              setSimilarProducts(similarData.filter((p: Product) => p.id !== productId).slice(0, 4));
            }
          } catch (error) {
            console.error("Failed to fetch similar products:", error);
          }
        }

        // Check if product is in wishlist
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const wishlistItems = await getWishlist();
            setIsInWishlist(wishlistItems.some(item => item.product.id === productId));
          }
        } catch (error) {
          console.error("Failed to check wishlist:", error);
        }
      } catch (error: any) {
        setError(error.message || "Failed to fetch product details");
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, mounted]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add items to cart");
      router.push("/login");
      return;
    }

    if (!product) return;

    setActionLoading(prev => ({ ...prev, cart: true }));

    try {
      await addToCart({ productId: product.id, quantity });
      setIsInCart(true);
      toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`, {
        duration: 2000,
        position: 'top-center'
      });
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      toast.error(error.message || "Failed to add item to cart");
    } finally {
      setActionLoading(prev => ({ ...prev, cart: false }));
    }
  };

  const handleToggleWishlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to manage wishlist");
      router.push("/login");
      return;
    }

    if (!product) return;

    setActionLoading(prev => ({ ...prev, wishlist: true }));

    try {
      if (isInWishlist) {
        await removeFromWishlist(product.id);
        setIsInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product.id);
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error: any) {
      console.error("Failed to update wishlist:", error);
      toast.error(error.message || "Failed to update wishlist");
    } finally {
      setActionLoading(prev => ({ ...prev, wishlist: false }));
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product?.description!,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else {
      toast.error("Cannot exceed available stock");
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const nextImage = () => {
    if (product && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const previousImage = () => {
    if (product && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-accent">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-500">⚠️</span>
            </div>
            <h3 className="text-xl font-semibold text-text mb-2">Product not found</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                Go Back
              </button>
              <Link
                href="/products"
                className="bg-white text-primary border border-primary px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors font-medium text-center"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-4">Product not found</h2>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          <ChevronRight className="h-4 w-4" />
          {product.category && (
            <>
              <Link
                href={`/category/${product.category.id}`}
                className="hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center hover:text-secondary text-primary transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>

        {/* Product content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image gallery */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-accent">
              <Image
                src={product.images[currentImageIndex] || "/placeholder-product.jpg"}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Image navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Image indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === index
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
          <div className="space-y-6">
            {/* Category */}
            {product.category && (
              <Link
                href={`/category/${product.category.id}`}
                className="inline-block text-sm text-primary hover:text-primary/80 font-medium"
              >
                {product.category.name}
              </Link>
            )}

            {/* Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-text mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < 4 ? 'text-silver fill-current' : 'text-gray-300'
                        }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">(4.5)</span>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">
                  ₹{product.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 bg-green-50 px-2 py-1 rounded">
                  Free shipping
                </span>
              </div>

              {/* Stock status */}
              {product.stock > 0 ? (
                <p className="text-green-600 font-medium flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  In Stock ({product.stock} available)
                </p>
              ) : (
                <p className="text-red-500 font-medium">Out of Stock</p>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-text mb-3">About this item</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-text mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/search?query=${tag}`}
                      className="px-3 py-1 bg-accent text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            {product.stock > 0 && (
              <div className="space-y-4">
                {/* Quantity selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:text-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300 text-gray-900 font-medium min-w-[3rem] text-center">
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

                {/* Action buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={actionLoading.cart || isInCart}
                    className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${isInCart
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl'
                      } disabled:opacity-70`}
                  >
                    {actionLoading.cart ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Adding...
                      </>
                    ) : isInCart ? (
                      <>
                        <Check className="h-5 w-5" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleToggleWishlist}
                    disabled={actionLoading.wishlist}
                    className={`p-4 rounded-xl border transition-all ${isInWishlist
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                      } disabled:opacity-70`}
                    title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    {actionLoading.wishlist ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Heart
                        className={`h-6 w-6 ${isInWishlist ? 'fill-current' : ''}`}
                      />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="bg-accent p-6 rounded-xl">
              <h3 className="font-semibold text-text mb-4">Why buy from us?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Free shipping on orders over ₹999</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>Secure payment & data protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <RotateCcw className="h-4 w-4 text-primary" />
                  </div>
                  <span>30-day return policy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-silver/20 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-silver" />
                  </div>
                  <span>Handcrafted with care</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar products */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-text">You might also like</h2>
              <Link
                href={`/category/${product.category?.id}`}
                className="text-primary hover:text-primary/80 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct) => (
                <SimilarProductCard key={similarProduct.id} product={similarProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Similar product card component
const SimilarProductCard = ({ product }: { product: Product }) => (
  <Link href={`/products/${product.id}`} className="group">
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-accent">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.images?.[0] || "/placeholder-product.jpg"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, 25vw"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-text line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-primary">
            ₹{product.price.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-silver fill-current" />
            <span className="text-sm text-gray-600">4.5</span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);
