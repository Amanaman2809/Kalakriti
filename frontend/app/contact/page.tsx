import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Contact Us - Kalakriti | Get in Touch",
  description: "Get in touch with Kalakriti for questions about our handcrafted products, custom orders, or visit our store in Jaipur, Rajasthan. We're here to help!",
  keywords: "contact kalakriti, handicrafts store jaipur, handmade products inquiry, custom orders, visit store rajasthan",
  authors: [{ name: "Kalakriti" }],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/contact`
  },
  openGraph: {
    title: "Contact Us - Kalakriti",
    description: "Get in touch with Kalakriti for questions about our handcrafted products or visit our store in Jaipur",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/contact`,
    siteName: "Kalakriti",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/og-contact.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

const Contact = dynamic(() => import("@/pages/Contact"), {
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
});

export default function Page() {
  return <Contact />;
}
