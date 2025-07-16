import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
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
import AppWrapper from '../components/layout/Layout'
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  return (
    <html lang="en" className={nunito.className}>
      <body className="min-h-screen flex flex-col">
        <Toaster position="top-right" />
        <AppWrapper>
        <main className="flex-grow">{children}</main>
        </AppWrapper>
      </body>
    </html>
  );
}
