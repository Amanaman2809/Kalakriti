import { CartParams } from "./types";

const url = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!url) throw new Error("API base URL is not set");

export const addToCart = async (item: CartParams) => {
  if (typeof window === "undefined") {
    throw new Error("addToCart must be called in a browser environment.");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No auth token found");
  }

  if (!item?.productId || typeof item.quantity !== "number") {
    throw new Error("Invalid item shape");
  }

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

    if (!response.ok) {
      throw {
        name: "AddToCartError",
        status: response.status,
        message: data.message || response.statusText,
        raw: data,
      };
    }

    return data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Add to cart request timed out.");
    }
    console.error("Failed to add to cart:", error.message || error);
    throw new Error(error.message || "Add to cart failed");
  }
};

export const removeFromCart = async (item: CartParams) => {
  if (typeof window === "undefined") {
    throw new Error("removeFromCart must be called in a browser environment.");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No auth token found");
  }

  if (
    !item?.productId ||
    typeof item.quantity !== "number" ||
    item.quantity < 1
  ) {
    throw new Error("Invalid removeFromCart payload");
  }

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

    return { success: true }; // 204 has no body
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("removeFromCart request timed out.");
    }
    console.error("Failed to remove from cart:", error.message || error);
    throw new Error(error.message || "removeFromCart failed");
  }
};
