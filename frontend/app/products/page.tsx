import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Shop Unique Handicrafts | Product Collection",
  description: "Browse our exclusive collection of handcrafted products made in India. Each piece reflects the rich cultural heritage and artistry of Indian craftsmanship.",
  keywords: "handicrafts, Indian crafts, handmade products, traditional art, unique gifts, artisan goods, handcrafted items, Indian heritage, cultural artifacts",
  authors: [{ name: "Kalakriti" }],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/products`
  },
  openGraph: {
    title: "Shop Unique Handicrafts | Product Collection",
    description: "Discover authentic Indian handicrafts - each piece tells a story of tradition and craftsmanship",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/products`,
    siteName: "Kalakriti",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/og-products.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

const ProductsPage = dynamic(() => import("@/pages/Products"), {
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
});

export default function Page() {
  return <ProductsPage />;
}
