import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Frequently Asked Questions - Kalakriti | FAQ",
  description: "Find answers to common questions about Kalakriti's handmade products, shipping, returns, custom orders, and more. Get the help you need quickly.",
  keywords: "kalakriti faq, handmade products questions, shipping policy, return policy, custom orders, artisan support, handicrafts help",
  authors: [{ name: "Kalakriti" }],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/faqs`
  },
  openGraph: {
    title: "Frequently Asked Questions - Kalakriti",
    description: "Get answers to common questions about our handcrafted products, shipping, and policies",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/faqs`,
    siteName: "Kalakriti",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/og-faqs.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

const FAQs = dynamic(() => import("@/pages/Faqs"), {
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  ),
});

export default function Page() {
  return <FAQs />;
}
