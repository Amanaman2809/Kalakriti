import { paiseToRupees } from "../utils/sharedFunctions";

export function transformProduct(product: {
  id: string;
  name: string;
  price: number; // in paise
  discountPct: number | null;
  stock: number;
  images: string[];
}) {
  const priceRupees = paiseToRupees(product.price);
  const discount = product.discountPct || 0;
  // No decimal value in final price
  const finalPrice = Math.floor(priceRupees * (1 - discount / 100));

  return {
    ...product,
    price: priceRupees,
    finalPrice,
  };
}
