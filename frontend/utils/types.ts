// utils/types.ts

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  rating?: number;
}

export interface ProductsResponse {
  products: Product[];
}
