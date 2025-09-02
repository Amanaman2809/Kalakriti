import dynamic from "next/dynamic";

export const metadata = {
  title: "Chalava - Handcrafted Excellence",
  description:
    "Discover unique handmade pieces that tell stories of tradition, culture, and exceptional craftsmanship. Premium handicrafts made in India.",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL,
  },
};

const Home = dynamic(() => import("@/pages/Home"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  ),
});

export default function Page() {
  return <Home />;
}
