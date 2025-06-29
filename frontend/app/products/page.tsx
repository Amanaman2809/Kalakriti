import dynamic from "next/dynamic";

export const metadata = {
  title: "Shop Unique Handicrafts | Product Page",
  description: "Browse our exclusive collection of handcrafted products made in India. Each piece reflects the rich cultural heritage and artistry of Indian craftsmanship.",
  keywords: "handicrafts, Indian crafts, handmade products, traditional art, unique gifts, artisan goods",
  author: "Kalakriti",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL + "/products" // Adjust the URL as needed
  },
}

const ProductsPage = dynamic(() => import("@/pages/Products"));

export default function Page() {
  return <ProductsPage />;
}
