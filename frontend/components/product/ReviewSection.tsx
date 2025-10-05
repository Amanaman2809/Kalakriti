import { useState, useEffect, useRef } from "react";
import { Star, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { FeedbackSummary } from "@/utils/types";

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  user: { name: string };
  createdAt: string;
}

export default function ReviewSection({ productId }: { productId: string }) {
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

      setSummary(summaryData || { averageRating: 0, totalReviews: 0 });
      setFeedbacks(Array.isArray(feedbackData) ? feedbackData : []);
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
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback");

      toast.success("Feedback submitted");
      setComment("");
      setRating(0);
      fetchFeedbacks();
    } catch (err: any) {
      toast.error(err.message);
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
          {summary.averageRating} / 5
        </span>
        <span className="text-gray-600 text-sm">
          ({summary.totalReviews} reviews)
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
              className={`w-6 h-6 cursor-pointer ${
                i <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
            />
          ))}
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
          disabled={submitting}
          className="mt-3 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-70"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      {/* Reviews List */}
      {feedbacks.length === 0 ? (
        <p className="text-gray-500 text-sm">No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {feedbacks?.map((f) => (
            <li key={f.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < f.rating
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  {f.user.name}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{f.comment}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(f.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
