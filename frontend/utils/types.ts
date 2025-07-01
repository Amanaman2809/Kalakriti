export interface Category {
  id: string;
  name: string;
  image: string;
}

// this is the interface of the reviews server respond for a product
export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface PFeedback {
  rating: number;
  comment: string;
  productId: string;
}

export interface FeedbackSummary {
  avg_rating: number;
  total_reviews: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  tags: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface ProductsResponse {
  products: Product[];
}

export interface CartParams {
  productId: string;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  product: Product;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  userId: string;
}
