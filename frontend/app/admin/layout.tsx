"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  LayoutPanelTop,
  Users,
  Lock,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Loader2,
  User,
  Shield,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import EditProfileModal from "@/pages/EditProfile";

// Navigation menu items
const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exactMatch: true,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
    exactMatch: false,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: LayoutPanelTop,
    exactMatch: false,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    exactMatch: false,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    exactMatch: false,
  },
];

interface User {
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Enhanced auth check
  useEffect(() => {
    if (pathname?.includes("/admin/login")) {
      setLoading(false);
      return;
    }

    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const userData =
          localStorage.getItem("user") || localStorage.getItem("user_details");

        if (!token || !userData) {
          router.replace("/admin/login");
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== "ADMIN") {
          toast.error("Access denied: Admin privileges required");
          router.replace("/login");
          return;
        }

        setUser(parsedUser);
      } catch (err) {
        console.error("Auth check error:", err);
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enhanced logout handler
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("user_details");
      toast.success("Successfully logged out");
      router.replace("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  }, [router]);

  // Handle profile update
  const handleProfileUpdate = (updatedData: User) => {
    setUser(updatedData);
    localStorage.setItem("user_details", JSON.stringify(updatedData));
    localStorage.setItem("user", JSON.stringify(updatedData));
    toast.success("Profile updated successfully");
  };

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsEditModalOpen(false);
  }, [pathname]);

  // Close menus on outside click
  useEffect(() => {
    if (!mobileMenuOpen && !isProfileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("admin-sidebar");
      const menuButton = document.getElementById("mobile-menu-button");
      const profileMenu = document.getElementById("profile-menu");

      if (
        mobileMenuOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }

      if (
        isProfileMenuOpen &&
        profileMenu &&
        !profileMenu.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen, isProfileMenuOpen]);

  // Check if current route is active
  const isActiveRoute = (href: string, exactMatch: boolean) => {
    if (exactMatch) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // Loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Public admin pages (login, etc.)
  if (pathname?.includes("/admin/login") || !user) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Enhanced Sidebar */}
        <aside
          id="admin-sidebar"
          className={`fixed inset-y-0 left-0 bg-white shadow-xl border-r border-gray-200 z-50 transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 ${sidebarCollapsed ? "w-20" : "w-64"}`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div
              className={`flex items-center gap-3 transition-all duration-300 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Admin Panel
                  </h1>
                  <p className="text-xs text-gray-500">Chalava Management</p>
                </div>
              )}
            </div>

            {/* Sidebar Toggle - Desktop */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>

            {/* Close Button - Mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href, item.exactMatch);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer - Just Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span className="font-medium">Logout</span>}
              {sidebarCollapsed && (
                <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Logout
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? "md:ml-20" : "md:ml-64"
          }`}
        >
          {/* Enhanced Top Bar with User Details */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                id="mobile-menu-button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Page Title */}
              <div className="flex-1 md:flex-none">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {menuItems.find((item) =>
                    isActiveRoute(item.href, item.exactMatch),
                  )?.name || "Admin Panel"}
                </h1>
              </div>

              {/* User Profile Section in Navbar */}
              <div className="flex items-center gap-4">
                {/* User Profile Dropdown */}
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <Shield className="w-3 h-3" />
                      {user?.role || "Administrator"}
                    </p>
                  </div>

                  <div className="relative" id="profile-menu">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-primary focus:outline-none transition-all group"
                    >
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-semibold group-hover:scale-105 transition-transform">
                        {user?.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-xl bg-white border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
                              {user?.name?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {user?.name || "Admin User"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user?.email}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Shield className="w-3 h-3 text-primary" />
                                <span className="text-xs text-primary font-medium">
                                  {user?.role || "Administrator"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              setIsEditModalOpen(true);
                            }}
                            className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span>Edit Profile</span>
                            </div>
                          </button>
                          <Link
                            href="/reset-password"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span>Change Password</span>
                            </div>
                          </Link>

                          <Link
                            href="/admin"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span>Dashboard</span>
                            </div>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center justify-between w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              <span>Sign Out</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={user || { name: "", email: "", phone: "", role: "" }}
        onUpdate={handleProfileUpdate}
      />
    </>
  );
}
