import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "400", "600", "800", "1000"],
  variable: "--font-nunito",
});
export const metadata: Metadata = {
  title: "Kalakriti",
  description:
    "Discover unique handmade pieces that tell stories of tradition,culture, and expectional craftmanship",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.className}>
      <body className="min-h-screen flex flex-col">
        <Toaster position="top-right" />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
