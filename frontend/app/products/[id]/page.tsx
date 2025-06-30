'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import ProductDetail from '@/components/product/ProductDetail';
import { FeedbackSummary, PFeedback, Review } from '@/utils/types';
import { Star, StarHalf } from 'lucide-react';
import { addFeedback, fetchAllFeedbacks, feedbackSummary } from '@/utils/product';

// Reusable StarRating component
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

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const halfFilled = star === Math.ceil(rating) && rating % 1 >= 0.5;
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            className={`focus:outline-none ${interactive ? 'hover:scale-110 transition-transform' : ''}`}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            disabled={!interactive}
          >
            {filled ? (
              <Star className={`${sizes[size]} fill-gold text-gold`} />
            ) : halfFilled ? (
              <StarHalf className={`${sizes[size]} fill-gold text-gold`} />
            ) : (
              <Star className={`${sizes[size]} text-secondary`} />
            )}
          </button>
        );
      })}
    </div>
  );
};

// ReviewForm component
const ReviewForm = ({
  onSubmit,
  loading,
  error,
  initialRating = 0
}: {
  onSubmit: (review: { rating: number; comment: string }) => void;
  loading: boolean;
  error: string | null;
  initialRating?: number;
}) => {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ rating, comment });
  };

  return (
    <div className="bg-accent p-6 rounded-lg mb-8 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Rating</label>
          <StarRating 
            rating={rating} 
            interactive 
            onRatingChange={setRating} 
            size="lg" 
          />
        </div>
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium mb-2">
            Review
          </label>
          <textarea
            id="comment"
            rows={4}
            className="w-full px-3 py-2 border border-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background transition-colors"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || rating === 0}
          className={`px-4 py-2 bg-primary text-accent rounded-md hover:bg-primary/90 transition-colors ${
            loading || rating === 0 ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </form>
    </div>
  );
};

// ReviewItem component
const ReviewItem = ({ review }: { review: Review }) => (
  <div className="border-b border-secondary/50 pb-6 last:border-0">
    <div className="flex items-center mb-2">
      <div className="flex mr-2">
        <StarRating rating={review.rating} size="sm" />
      </div>
      <span className="text-sm text-text/80">
        {new Date(review.createdAt).toLocaleDateString()}
      </span>
    </div>
    <h4 className="font-medium mb-1">{review.user.name}</h4>
    <p className="text-text">{review.comment}</p>
  </div>
);

function Page() {
  const params = useParams();
  const productId = params?.id as string;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeedbackData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [allFeedbacks, summaryData] = await Promise.all([
          fetchAllFeedbacks(productId),
          feedbackSummary(productId)
        ]);
        setReviews(allFeedbacks);
        setSummary(summaryData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadFeedbackData();
    }
  }, [productId]);

  const handleSubmitReview = async ({ rating, comment }: { rating: number; comment: string }) => {
    try {
      setLoading(true);
      setError(null);
      await addFeedback({ productId, rating, comment });
      
      // Refresh feedback data
      const [allFeedbacks, summaryData] = await Promise.all([
        fetchAllFeedbacks(productId),
        feedbackSummary(productId)
      ]);
      setReviews(allFeedbacks);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-text container mx-auto px-4 py-8 max-w-6xl">
      <ProductDetail feedback={summary} />
      
      {/* Feedback and review section */}
      <div className="mt-12 border-t border-secondary/30 pt-8">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
        
        {summary && (
          <div className="flex items-center mb-8">
            <div className="flex items-center mr-4">
              <span className="text-4xl font-bold mr-2 text-primary">
                {summary.avg_rating.toFixed(1)}
              </span>
              <div className="flex flex-col">
                <StarRating rating={summary.avg_rating} size="md" />
                <span className="text-sm text-text/80 mt-1">
                  Based on {summary.total_reviews} reviews
                </span>
              </div>
            </div>
          </div>
        )}

        <ReviewForm 
          onSubmit={handleSubmitReview} 
          loading={loading} 
          error={error} 
        />

        {/* Reviews list */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>
          {loading && !reviews.length ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-secondary py-4 text-center">
              No reviews yet. Be the first to review!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Page;