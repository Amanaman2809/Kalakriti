import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "400", "600", "800"],
  variable: "--font-nunito",

})
export const metadata: Metadata = {
  title: "Kalakriti",
  description: "Discover unique handmade pieces that tell stories of tradition,culture, and expectional craftmanship",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
