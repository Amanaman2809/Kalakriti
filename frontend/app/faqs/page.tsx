import dynamic from "next/dynamic";

export const metadata = {
  title: "HomePage",
  description: "Handicrafts made in India",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL
  }
}

const FAQs = dynamic(() => import("@/pages/Faqs"));

export default function Page() {
  return <FAQs />;
}