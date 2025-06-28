import dynamic from "next/dynamic";

export const metadata = {
  title: "HomePage",
  description: "Handicrafts made in India",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL
  }
}

const Home = dynamic(() => import("@/pages/Home"));

export default function Page() {
  return <Home />;
}