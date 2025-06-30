import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { addToCart } from "@/utils/product";
import { CartParams, Product } from "@/utils/types";
import toast from "react-hot-toast";


export default function ProductCard({ product }: { product: Product }) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const outOfStock = product.stock === 0;
  const isNew = new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const isLowStock = product.stock < 5 && !outOfStock;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);

    const item: CartParams = {
      productId: product.id,
      quantity: 1,
    };

    try {
      await addToCart(item);
      toast.success("Item added to Cart");
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add item to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200 ${
        outOfStock ? "opacity-80" : "hover:-translate-y-0.5"
      }`}
      aria-labelledby={`product-${product.id}-title`}
    >
      {/* Badges Container */}
      <div className="absolute top-3 left-3 right-3 z-10 flex justify-between">
        {/* New Arrival Badge */}
        {isNew && (
          <div className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
            New
          </div>
        )}
      </div>

      {/* Out of Stock Overlay */}
      {outOfStock && (
        <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center">
          <div className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
            Out of Stock
          </div>
        </div>
      )}

      <Link
        href={`/products/${product.id}`}
        className="block"
        aria-disabled={outOfStock}
      >
        {/* Product Image - Cover Style */}
        <div className="relative aspect-square bg-gray-50">
          <Image
            src={product.images?.[0] || "/placeholder-product.jpg"}
            alt={product.name}
            fill
            className="object-cover transition-opacity group-hover:opacity-90"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={false}
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category and Stock */}
          <div className="flex justify-between items-center mb-1">
            {product.category && (
              <span className="text-xs text-gray-500 capitalize">
                {product.category.name.toLowerCase()}
              </span>
            )}
            {!outOfStock && (
              <span className={`text-xs ${isLowStock ? "text-amber-600" : "text-gray-500"}`}>
                {product.stock} in stock
              </span>
            )}
          </div>

          <h3
            id={`product-${product.id}-title`}
            className="font-medium text-gray-900 mb-1 line-clamp-2 leading-tight"
          >
            {product.name}
          </h3>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>

          {/* Price Section */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-md">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Add to Cart Button */}
      {!outOfStock && (
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className={`absolute bottom-4 right-4 p-2.5 rounded-full shadow-sm transition-all ${
            isAddingToCart
              ? "bg-green-500 text-white scale-110"
              : "bg-primary text-white opacity-0 group-hover:opacity-100 hover:bg-opacity-95 hover:scale-105"
          }`}
          aria-label={`Add ${product.name} to cart`}
        >
          {isAddingToCart ? (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}