import { Star, StarHalf } from "lucide-react";
import {
  CartItem,
  CartParams,
  FeedbackSummary,
  PFeedback,
  WishlistItem,
} from "./types";

const url = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!url) throw new Error("API base URL is not set");

export const addToCart = async (item: CartParams) => {
  if (typeof window === "undefined") throw new Error("addToCart must be called in a browser environment.");
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found");
  if (!item?.productId || typeof item.quantity !== "number") throw new Error("Invalid item shape");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const response = await fetch(`${url}/api/cart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();

    if (!response.ok) throw { name: "AddToCartError", status: response.status, message: data.message || response.statusText, raw: data };

    await syncCartFromBackend();
    return data;
  } catch (error: any) {
    if (error.name === "AbortError") throw new Error("Add to cart request timed out.");
    console.error("Failed to add to cart:", error.message || error);
    throw new Error(error.message || "Add to cart failed");
  }
};
export async function syncCartFromBackend() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch(`${url}/api/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch cart for syncing");
    const items: CartItem[] = await res.json();
    localStorage.setItem("cart", JSON.stringify(items));
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error("Cart sync error", error);
    localStorage.removeItem("cart"); // fallback: clear if cannot sync
  }
}

export const removeFromCart = async (item: CartParams) => {
  if (typeof window === "undefined") throw new Error("removeFromCart must be called in a browser environment.");
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found");
  if (!item?.productId || typeof item.quantity !== "number" || item.quantity < 1) throw new Error("Invalid removeFromCart payload");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const response = await fetch(`${url}/api/cart`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: item.productId,
        quantityToRemove: item.quantity,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Error ${response.status}`);
    }

    // After remove, sync cart from backend
    await syncCartFromBackend();
    return { success: true };
  } catch (error: any) {
    if (error.name === "AbortError") throw new Error("removeFromCart request timed out.");
    console.error("Failed to remove from cart:", error.message || error);
    throw new Error(error.message || "removeFromCart failed");
  }
};

// Fetch similar Category Prducts
export const similarCatProd = async (categoryId: string) => {
  try {
    const response = await fetch(`${url}/api/category/${categoryId}/products`);
    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}`);
    }
    return response.json();
  } catch (error: any) {
    throw new Error(
      error.message || "Failed to fetch product of this category"
    );
  }
};

export const addFeedback = async (feedback: PFeedback) => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("You need to login to provide a review");
  }

  try {
    const response = await fetch(
      `${url}/api/products/${feedback.productId}/feedback`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: feedback.rating,
          comment: feedback.comment,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add feedback");
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    throw new Error(
      error.message || "Failed to add feedback. Please try again."
    );
  }
};

// Fetch all feedbacks for a product
export const fetchAllFeedbacks = async (productId: string) => {
  try {
    const response = await fetch(`${url}/api/products/${productId}/feedbacks`);
    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}`);
    }
    return response.json();
  } catch (error: any) {
    throw new Error(
      error.message || "Failed to fetch feedbacks for this product"
    );
  }
};

export const feedbackSummary = async (
  productId: string
): Promise<FeedbackSummary> => {
  try {
    const response = await fetch(
      `${url}/api/products/${productId}/feedback-summary`
    );
    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}`);
    }
    const { averageRating, totalReviews } = await response.json();
    return {
      avg_rating: averageRating,
      total_reviews: totalReviews,
    };
  } catch (error: any) {
    throw new Error(
      error.message || "Failed to calculate feedback summary for this product"
    );
  }
};

export const StarRating = ({
  rating,
  interactive = false,
  onRatingChange,
  size = "md",
}: {
  rating: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
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
            className={`focus:outline-none ${
              interactive ? "hover:scale-110 transition-transform" : ""
            }`}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
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

export async function fetchCartItems(): Promise<CartItem[]> {
  if (typeof window === "undefined") {
    throw new Error("fetchCartItems must be called in the browser");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No auth token found");
  }

  const res = await fetch(`${url}/api/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch cart items: ${res.status} ${errorText}`);
  }

  return await res.json();
}

export async function moveItemToWishlist(productId: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("moveItemToWishlist must be called in the browser");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Unauthorized: no token found");
  }

  if (!productId || typeof productId !== "string") {
    throw new Error("Invalid productId");
  }

  const response = await fetch(`${url}/api/cart/moveWishlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to move item to wishlist: ${response.status} ${errorText}`
    );
  }
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Unauthorized: no token found");
  }

  const res = await fetch(`${url}/api/wishlist`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch wishlist: ${res.status}`);
  }

  return res.json();
}

export async function addToWishlist(productId: string): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Unauthorized: no token found");
  }

  const res = await fetch(`${url}/api/wishlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId }),
  });

  if (!res.ok) {
    if (res.status === 409) throw new Error("Already in wishlist");
    if (res.status === 404) throw new Error("Product does not exist");
    throw new Error(`Add to wishlist failed: ${res.status}`);
  }
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Unauthorized: no token found");
  }

  const res = await fetch(`${url}/api/wishlist/${productId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Item not found in wishlist");
    throw new Error(`Remove failed: ${res.status}`);
  }
}

export async function moveWishlistItemToCart(productId: string): Promise<void> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Unauthorized: no token found");
  }

  const res = await fetch(`${url}/api/wishlist/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Item not found in wishlist");
    throw new Error(`Move to cart failed: ${res.status}`);
  }
}
