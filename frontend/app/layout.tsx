import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AppWrapper from '../components/layout/Layout';

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Kalakriti - Authentic Indian Handicrafts",
  description: "Discover unique handmade pieces that tell stories of tradition, culture, and exceptional craftsmanship",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Kalakriti - Authentic Indian Handicrafts",
    description: "Discover unique handmade pieces that tell stories of tradition, culture, and exceptional craftsmanship",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalakriti - Authentic Indian Handicrafts",
    description: "Discover unique handmade pieces that tell stories of tradition, culture, and exceptional craftsmanship",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} scroll-smooth`}>
      <body className={`${nunito.className} min-h-screen flex flex-col antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
            },
          }}
        />
        <AppWrapper>
          <main className="flex-grow">{children}</main>
        </AppWrapper>
      </body>
    </html>
  );
}
