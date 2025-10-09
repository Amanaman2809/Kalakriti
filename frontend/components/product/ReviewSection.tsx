import { useState, useEffect, useRef } from "react";
import { Star, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  user: { name: string };
  createdAt: string;
}

// 🔥 UPDATE THIS INTERFACE - Add the optional callback prop
interface ReviewSectionProps {
  productId: string;
  onRatingUpdate?: (averageRating: number, totalReviews: number) => void;
}

export default function ReviewSection({
  productId,
  onRatingUpdate
}: ReviewSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [summary, setSummary] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productId}`;

  const fetchingRef = useRef(false);

  const fetchFeedbacks = async () => {
    if (!productId || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const [summaryRes, feedbacksRes] = await Promise.all([
        fetch(`${BASE_URL}/feedback-summary`),
        fetch(`${BASE_URL}/feedbacks`),
      ]);

      const summaryData = await summaryRes.json();
      const feedbackData = await feedbacksRes.json();

      const newSummary = summaryData || { averageRating: 0, totalReviews: 0 };
      setSummary(newSummary);
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);

      // 🔥 Notify parent component of rating update
      if (onRatingUpdate) {
        onRatingUpdate(newSummary.averageRating, newSummary.totalReviews);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reviews");
      setFeedbacks([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (productId) fetchFeedbacks();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login to submit feedback");
      return;
    }

    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, comment }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback");

      console.log("Feedback response:", data); // Debug log

      // 🔥 Update UI immediately with response data
      if (data.summary) {
        setSummary(data.summary);
        if (onRatingUpdate) {
          console.log("Calling onRatingUpdate with:", data.summary); // Debug
          onRatingUpdate(data.summary.averageRating, data.summary.totalReviews);
        }
      }

      // Add new feedback to the list
      if (data.feedback) {
        setFeedbacks(prev => [data.feedback, ...prev]);
      }

      toast.success("Feedback submitted successfully");
      setComment("");
      setRating(0);

      // 🔥 Refetch to ensure consistency (after a short delay)
      setTimeout(() => {
        fetchFeedbacks();
      }, 500);
    } catch (err: any) {
      console.error("Feedback submission error:", err);
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <section className="mt-10 border-t border-gray-200 pt-6">
      {/* Summary */}
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-5 h-5 text-yellow-400 fill-current" />
        <span className="text-lg font-semibold">
          {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "0.0"} / 5
        </span>
        <span className="text-gray-600 text-sm">
          ({summary.totalReviews} {summary.totalReviews === 1 ? "review" : "reviews"})
        </span>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-4 rounded-lg mb-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              onClick={() => setRating(i)}
              className={`w-6 h-6 cursor-pointer transition-all ${i <= rating
                  ? "text-yellow-400 fill-current scale-110"
                  : "text-gray-300 hover:text-yellow-200"
                }`}
            />
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              {rating} star{rating !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your feedback..."
          className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary"
          rows={3}
        />
        <button
          type="submit"
          disabled={submitting || rating < 1}
          className="mt-3 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      {/* Reviews List */}
      {feedbacks.length === 0 ? (
        <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
      ) : (
        <ul className="space-y-4">
          {feedbacks.map((f) => (
            <li key={f.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < f.rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                      }`}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2 font-medium">
                  {f.user.name}
                </span>
              </div>
              {f.comment && (
                <p className="text-gray-700 text-sm mt-2">{f.comment}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(f.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
