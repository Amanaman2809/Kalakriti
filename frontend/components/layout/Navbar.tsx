"use client";
import { CircleUser, SearchIcon, ShoppingCart, Menu, X, Package, Heart, HelpCircle, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Category", href: "/category" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar({ isLoggedIn = true }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-500 hover:text-primary focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src="/logo_sm.png"
                width={40}
                height={40}
                alt="Logo"
                className="h-10 w-10"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map(({ name, href }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-md text-sm ${
                  pathname === href
                    ? "bg-secondary text-primary font-bold"
                    : "text-gray-600 hover:text-primary hover:bg-accent"
                }`}
              >
                {name}
              </Link>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Search - hidden on mobile when not active */}
            {isLoggedIn && (
              <>
                {showSearch ? (
                  <div className="relative md:hidden">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-accent placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <button
                      onClick={() => setShowSearch(false)}
                      className="absolute right-2 top-2 text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="md:hidden text-gray-500 hover:text-primary"
                  >
                    <SearchIcon className="h-5 w-5" />
                  </button>
                )}

                {/* Desktop Search */}
                <div className="hidden md:flex items-center bg-gray-100 hover:bg-gray-200 transition-colors duration-200 rounded-full pl-3 pr-2 py-1">
                  <SearchIcon className="h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none px-2 py-1 text-sm w-40 lg:w-52 placeholder-gray-500"
                  />
                </div>
              </>
            )}

            {/* Cart */}
            {isLoggedIn && (
              <Link
                href="/cart"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary"
              >
                <ShoppingCart className="h-5 w-5" />
              </Link>
            )}

            {/* Profile/Login */}
            {isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary focus:outline-none"
                >
                  <CircleUser className="h-5 w-5" />
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white border border-gray-100 divide-y divide-gray-100 focus:outline-none z-50">
                    <div className="py-2 px-1">
                      <div className="px-4 py-2 text-sm text-gray-500 font-medium">
                        Welcome back!
                      </div>
                      <Link
                        href="/account"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                      >
                        <CircleUser className="w-4 h-4 mr-3" />
                        Your Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                      >
                        <Package className="w-4 h-4 mr-3" />
                        Your Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                      >
                        <Heart className="w-4 h-4 mr-3" />
                        Wishlist
                      </Link>
                    </div>
                    <div className="py-2 px-1">
                      <Link
                        href="/faqs"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 mr-3" />
                        FAQs
                      </Link>
                    </div>
                    <div className="py-2 px-1">
                      <button
                        onClick={() => {
                          // TODO: Implement logout logic
                          localStorage.removeItem("token");
                          router.push("/");
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map(({ name, href }) => (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === href
                    ? "bg-secondary text-primary"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
              >
                {name}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                href="/login"
                className="block w-full px-3 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-primary-dark"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
