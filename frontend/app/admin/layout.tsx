"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  LayoutPanelTop,
} from "lucide-react";
import AdminNavbar from "@/components/layout/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.replace("/admin/login");
    } else {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!localStorage.getItem("token")) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">{children}</div>
      </div>
    );
  }
  return (
    <>
      <AdminNavbar />
      <div className="h-screen bg-gray-50 overflow-hidden flex">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
        >
          <nav className="p-4 mt-20 space-y-2">
            <button
              onClick={() => {
                router.push("/admin");
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                pathname === "/admin"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                router.push("/admin/products");
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                pathname?.startsWith("/admin/products")
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Products</span>
            </button>

            <button
              onClick={() => {
                router.push("/admin/categories");
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                pathname?.startsWith("/admin/categories")
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <LayoutPanelTop className="h-5 w-5" />
              <span>Categories</span>
            </button>

            <button
              onClick={() => {
                router.push("/admin/orders");
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                pathname?.startsWith("/admin/orders")
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Orders</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 text-gray-700 hover:bg-red-50 hover:text-red-600 mt-8 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-0 md:ml-64 overflow-y-auto">
          <div className="p-6 md:p-8">{children}</div>
        </div>
      </div>
    </>
  );
}
