import dynamic from "next/dynamic";

export const metadata = {
  title: "HomePage",
  description: "Handicrafts made in India",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/about`
  }
}

const About = dynamic(() => import("@/pages/About"));

export default function Page() {
  return <About />;
}