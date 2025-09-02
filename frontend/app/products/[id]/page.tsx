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
  StarHalf,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  Shield,
  RotateCcw,
  MessageCircle,
  Calendar,
  User,
  Send,
  CheckCircle
} from 'lucide-react';
import { FeedbackSubmission, Product } from '@/utils/types';
import { addToCart, addToWishlist, removeFromWishlist, getWishlist, addFeedback, fetchAllFeedbacks, feedbackSummary } from '@/utils/product';

// Reviews Types
interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
  };
}

interface FeedbackSummary {
  avg_rating: number;
  total_reviews: number;
}

// Beautiful StarRating component for reviews
const StarRating = ({
  rating,
  interactive = false,
  onRatingChange,
  size = 'md'
}: {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const [hoveredStar, setHoveredStar] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const halfFilled = star === Math.ceil(rating) && rating % 1 >= 0.5;
        const isHovered = interactive && hoveredStar >= star;

        return (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            className={`focus:outline-none transition-all duration-200 ${interactive ? 'hover:scale-110 cursor-pointer transform' : 'cursor-default'
              }`}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            disabled={!interactive}
          >
            {filled || isHovered ? (
              <Star className={`${sizes[size]} fill-yellow-400 text-yellow-400 drop-shadow-sm`} />
            ) : halfFilled ? (
              <StarHalf className={`${sizes[size]} fill-yellow-400 text-yellow-400 drop-shadow-sm`} />
            ) : (
              <Star className={`${sizes[size]} text-gray-300 hover:text-yellow-400 transition-colors`} />
            )}
          </button>
        );
      })}
    </div>
  );
};

// Review Form Component
const ReviewForm = ({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (review: { rating: number; comment: string }) => void;
  loading: boolean;
  error: string | null;
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [focused, setFocused] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }
    onSubmit({ rating, comment });
    setComment('');
    setRating(0);
  };
  return (
    <div className="bg-accent/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-accent shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-text">Share Your Experience</h3>
          <p className="text-text/70 text-sm">Help others make informed decisions</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-text">
            How would you rate this product?
          </label>
          <div className="flex items-center gap-4">
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size="lg"
            />
            {rating > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <label htmlFor="comment" className="block text-sm font-semibold text-text">
            Tell us more about your experience
          </label>
          <div className="relative">
            <textarea
              id="comment"
              rows={4}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none bg-background transition-all duration-300 resize-none ${focused
                ? 'border-primary shadow-md shadow-primary/10'
                : 'border-gray-300 hover:border-gray-400'
                }`}
              placeholder="Share details about your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              required
              minLength={10}
              maxLength={500}
            />
            <div className="absolute bottom-3 right-3">
              <span className={`text-xs transition-colors ${comment.length < 10 ? 'text-gray-400' : 'text-primary'
                }`}>
                {comment.length}/500
              </span>
            </div>
          </div>
          <p className="text-xs text-text/60">Minimum 10 characters required</p>
        </div>
        <button
          type="submit"
          disabled={loading || rating === 0 || comment.trim().length < 10}
          className={`w-full flex items-center justify-center gap-3 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ${loading || rating === 0 || comment.trim().length < 10
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:shadow-lg'
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Review
            </>
          )}
        </button>
        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
};

// Review Item Component
const ReviewItem = ({ review, index }: { review: Review; index: number }) => (
  <div
    className="bg-background rounded-2xl p-6 border border-accent shadow-sm hover:shadow-md transition-all duration-300"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="flex items-start gap-4 mb-4">
      <div className="relative">
        <div className="w-12 h-12 bg-primary  rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
          {review.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-text">{review.user.name}</h4>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {new Date(review.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <StarRating rating={review.rating} size="sm" />
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {review.rating}/5 Stars
          </span>
        </div>
      </div>
    </div>
    <blockquote className="text-text/90 leading-relaxed italic border-l-4 border-primary/30 pl-4">
      "{review.comment}"
    </blockquote>
  </div>
);

// Reviews Summary Component
const ReviewsSummary = ({ summary }: { summary: FeedbackSummary | null }) => {
  if (!summary || summary.total_reviews === 0) return null;

  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-6 bg-background rounded-2xl p-6 border border-accent shadow-sm">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">
            {summary.avg_rating.toFixed(1)}
          </div>
          <StarRating rating={summary.avg_rating} size="lg" />
          <p className="text-text/70 text-sm mt-1">Average Rating</p>
        </div>
        <div className="h-16 w-px bg-gray-300"></div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary mb-1">
            {summary.total_reviews}
          </div>
          <p className="text-text font-medium">
            Review{summary.total_reviews !== 1 ? 's' : ''}
          </p>
          <p className="text-text/60 text-xs">Verified purchases</p>
        </div>
      </div>
    </div>
  );
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  // Existing state
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

  // New review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<FeedbackSummary | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!productId || !mounted) return;

    const fetchProductDetails = async () => {
      try {
        setLoading(true);

        // Fetch product details
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

        // Fetch reviews and summary
        await loadReviews();
      } catch (error: any) {
        setError(error.message || "Failed to fetch product details");
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, mounted]);

  // Load reviews function
  const loadReviews = async () => {
    try {
      const [reviewsData, summaryData] = await Promise.all([
        fetchAllFeedbacks(productId),
        feedbackSummary(productId)
      ]);
      setReviews(reviewsData);
      setReviewSummary(summaryData);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    }
  };

  // Submit review handler
  const handleSubmitReview = async ({ rating, comment }: { rating: number; comment: string }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to write a review");
      router.push("/login");
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError(null);

      const feedbackSubmission: FeedbackSubmission = {
        productId,
        rating,
        comment 
      };

      await addFeedback(feedbackSubmission);
      toast.success('Thank you for your review!', {
        icon: '🎉',
        duration: 3000,
      });

      // Reload reviews
      await loadReviews();
    } catch (err: any) {
      setReviewError(err.message);
      toast.error('Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };
  
  

  // All your existing handlers remain the same...
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

  // Your existing loading and error states remain the same...
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
        {/* Keep all your existing breadcrumb, back button, and product content exactly as is */}
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

        {/* Product content - keep exactly as is */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Keep your entire existing image gallery section */}
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

          {/* Keep your entire existing product info section */}
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
                  <StarRating rating={reviewSummary?.avg_rating || 0} size="md" />
                  <span className="text-sm text-gray-600 ml-2">
                    ({reviewSummary?.avg_rating?.toFixed(1) || '0'}) • {reviewSummary?.total_reviews || 0} reviews
                  </span>
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

            {/* Keep all your existing price, description, tags, quantity, and action buttons sections exactly as they are */}
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

        {/* NEW: Reviews Section */}
        <div className="mt-16 border-t border-accent pt-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-text">Customer Reviews</h2>
              </div>
              <p className="text-text/70">What our customers are saying about this product</p>
            </div>

            <ReviewsSummary summary={reviewSummary} />

            <ReviewForm
              onSubmit={handleSubmitReview}
              loading={reviewLoading}
              error={reviewError}
            />

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-text">
                  All Reviews ({reviews.length})
                </h3>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div
                      key={review.id}
                      className="animate-fadeInUp"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ReviewItem review={review} index={index} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-accent/20 rounded-2xl border border-accent">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-4">No Reviews Yet</h3>
                  <p className="text-text/70 mb-6 max-w-md mx-auto">
                    Be the first to share your experience and help others make informed decisions!
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium">
                    <Star className="w-4 h-4" />
                    Write the first review
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Keep your existing similar products section exactly as is */}
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

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Keep your existing SimilarProductCard component exactly as is
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
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.5</span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);
