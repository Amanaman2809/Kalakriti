import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rating?: number;
  images?: string[];
  discount?: number;
  stock?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock === 0;
  const hasDiscount = product.discount && product.discount > 0;

  // Calculate discounted price
  const discountedPrice = hasDiscount
    ? product.price - (product.price * product.discount!) / 100
    : null;

  return (
    <div
      className={`group relative bg-background rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 ${
        outOfStock ? "opacity-70" : "hover:-translate-y-1"
      }`}
      aria-labelledby={`product-${product.id}-title`}
    >
      {/* Out of Stock Badge */}
      {outOfStock && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          Sold Out
        </div>
      )}

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          {product.discount}% OFF
        </div>
      )}

      <Link 
        href={`/products/${product.id}`} 
        className="block"
        aria-disabled={outOfStock}
      >
        {/* Product Image */}
        <div className="relative aspect-square bg-gray-100">
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
          <h3 
            id={`product-${product.id}-title`}
            className="font-medium text-lg mb-1 line-clamp-2 h-14"
          >
            {product.name}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
            {product.description}
          </p>

          {/* Price Section */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary text-lg">
                ₹{discountedPrice?.toLocaleString("en-IN") || product.price.toLocaleString("en-IN")}
              </span>
              
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Rating and Stock */}
            <div className="flex justify-between items-center mt-2">
              {product.rating ? (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-400">No ratings</div>
              )}

              {product.stock !== undefined && (
                <span className="text-xs text-gray-500">
                  {outOfStock ? "Out of stock" : `${product.stock} left`}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Quick Add to Cart (Optional) */}
      {!outOfStock && (
        <button
          className="absolute bottom-4 right-4 bg-primary text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-90"
          aria-label={`Add ${product.name} to cart`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
        </button>
      )}
    </div>
  );
}