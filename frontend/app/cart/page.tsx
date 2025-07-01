"use client";
import { useEffect, useState } from "react";
import {
  fetchCartItems,
  removeFromCart,
  moveItemToWishlist,
  addToCart,
} from "@/utils/product";
import { CartItem } from "@/utils/types";

export default function Page() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingItems, setProcessingItems] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    fetchCartItems()
      .then((items) => {
        setCartItems(items);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const updateQuantity = async (
    id: string,
    productId: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    try {
      setProcessingItems((prev) => ({ ...prev, [id]: true }));

      if (newQuantity > cartItems.find((item) => item.id === id)?.quantity!) {
        await addToCart({ productId, quantity: 1 });
      } else {
        await removeFromCart({ productId, quantity: 1 });
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update quantity"
      );
    } finally {
      setProcessingItems((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRemoveItem = async (id: string, productId: string) => {
    try {
      setProcessingItems((prev) => ({ ...prev, [id]: true }));
      await removeFromCart({
        productId,
        quantity: cartItems.find((item) => item.id === id)?.quantity!,
      });
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setProcessingItems((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleMoveToWishlist = async (id: string, productId: string) => {
    try {
      setProcessingItems((prev) => ({ ...prev, [id]: true }));
      await moveItemToWishlist(productId);
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to move to wishlist"
      );
    } finally {
      setProcessingItems((prev) => ({ ...prev, [id]: false }));
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  };

  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (isLoading) return <div className="p-4">Loading your cart...</div>;

  return (
    <div
      className="max-w-4xl mx-auto p-4"
      style={{ background: "var(--background)", color: "var(--text)" }}
    >
      <h1 className="text-2xl font-semibold mb-6 text-primary">
        Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <div className="bg-accent rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Cart Items */}
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-secondary border border-primary justify-between shadow p-4 flex items-center"
              >
                {/* Left Side - Product Image and Actions */}
                <div className="flex items-center gap-4">
                  <div className="w-30 h-30 border border-primary mr-2 overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.images[0] || "/placeholder-product.png"}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-primary">
                      {item.product.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleMoveToWishlist(item.id, item.product.id)
                        }
                        disabled={processingItems[item.id]}
                        className="text-sm text-primary hover:underline hover:cursor-pointer disabled:opacity-50"
                      >
                        Move to Wishlist
                      </button>
                      <span className="text-primary">|</span>
                      <button
                        onClick={() =>
                          handleRemoveItem(item.id, item.product.id)
                        }
                        disabled={processingItems[item.id]}
                        className="text-sm text-primary hover:underline hover:cursor-pointer disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex w-fit border border-primary">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.product.id,
                            item.quantity - 1
                          )
                        }
                        disabled={
                          processingItems[item.id] || item.quantity <= 1
                        }
                        className="w-8 h-8 flex items-center justify-center hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center border-x border-primary">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.product.id,
                            item.quantity + 1
                          )
                        }
                        disabled={processingItems[item.id]}
                        className="w-8 h-8 flex items-center justify-center hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side - Price */}
                <div className="w-24 text-right font-semibold text-primary">
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}

          <div className="flex border-t border-primary py-4 mb-4 justify-between">
            <button className="w-fit px-16 bg-primary hover:bg-primary-dark text-white py-3 font-medium transition-colors">
              Proceed to Checkout
            </button>
            <div>
              <div className="flex space-x-3">
                <span className="font-bold text-primary">
                  Cart Subtotal ({cartItems.length} items):
                </span>
                <span className="font-bold text-primary">
                  ₹ {calculateSubtotal().toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-primary/80">
                Shipping and taxes calculated at checkout
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
