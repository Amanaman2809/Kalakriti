"use client";
import { useSearch } from "@/hooks/useSearch";
import {
  CircleUser,
  SearchIcon,
  ShoppingCart,
  Menu,
  X,
  Package,
  Heart,
  HelpCircle,
  LogOut,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Category", href: "/category" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

// ✅ SOLUTION 1: Extract client-only logic into separate component
function ClientOnlyAuthStatus({ children }: { children: (isLoggedIn: boolean, cartCount: number) => React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Safe localStorage access
    try {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
      
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartCount(Array.isArray(cart) ? cart.length : 0);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  }, []);

  // ✅ SOLUTION 2: Don't render client-specific content until mounted
  if (!mounted) {
    // Return loading state that matches server rendering
    return <>{children(false, 0)}</>;
  }

  return <>{children(isLoggedIn, cartCount)}</>;
}

// ✅ SOLUTION 3: Optimized Search Component
const SearchComponent = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSearch,
    handleSuggestionClick,
  } = useSearch();
  
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Debounced search with cleanup
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      }
    }, 300);
  }, [handleSearch]);

  const handleSuggestionClickMemo = useCallback((item: any) => {
    handleSuggestionClick(item);
    setShowMobileSearch(false);
    setShowSuggestions(false);
  }, [handleSuggestionClick, setShowSuggestions]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Mobile Search Toggle */}
      {!showMobileSearch ? (
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label="Open search"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      ) : (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center p-4 border-b">
            <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-4 py-2">
              <SearchIcon className="h-4 w-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                className="bg-transparent border-none focus:outline-none text-sm flex-1"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowMobileSearch(false)}
              className="ml-3 p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {suggestions.length > 0 ? (
              <div className="p-2">
                {suggestions.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
                    onClick={() => handleSuggestionClickMemo(item)}
                  >
                    <SearchIcon className="w-4 h-4 text-gray-400" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                Start typing to search...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Search */}
      <div className="hidden md:flex items-center relative">
        <div className="flex items-center bg-gray-100 hover:bg-gray-200 transition-colors duration-200 rounded-full pl-3 pr-2 py-1">
          <SearchIcon className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search handcrafted products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              debouncedSearch(e.target.value);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="bg-transparent border-none focus:outline-none px-2 py-1 text-sm w-48 placeholder-gray-500"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 top-full left-0 mt-1 w-full bg-white shadow-lg rounded-md py-1 border max-h-60 overflow-y-auto">
            {suggestions.slice(0, 8).map((item) => (
              <button
                key={item.id}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm transition-colors"
                onClick={() => handleSuggestionClickMemo(item)}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  // ✅ SOLUTION 4: Safe logout handler
  const handleLogout = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("cart");
      }
      setIsProfileMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  // ✅ Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  // ✅ SOLUTION 5: Memoized navigation with stable keys
  const navigationLinks = useMemo(() =>
    navLinks.map(({ name, href }) => (
      <Link
        key={href}
        href={href}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          pathname === href
            ? "bg-secondary text-primary font-bold"
            : "text-gray-600 hover:text-primary hover:bg-accent"
        }`}
      >
        {name}
      </Link>
    )), [pathname]
  );

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-500 hover:text-primary focus:outline-none p-2"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <Image
              src="/logo_sm.png"
              width={100}
              height={100}
              alt="Kalakriti Logo"
              className="h-16 w-16"
              priority
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">Kalakriti</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Sparkles className="w-3 h-3" />
                <span>Handcrafted Excellence</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navigationLinks}
          </div>

          {/* ✅ SOLUTION 6: Right side with client-only rendering */}
          <div className="flex items-center space-x-4">
            <ClientOnlyAuthStatus>
              {(isLoggedIn, cartCount) => (
                <>
                  {/* Search */}
                  <SearchComponent isLoggedIn={isLoggedIn} />

                  {/* Cart */}
                  {isLoggedIn && (
                    <Link
                      href="/cart"
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary relative"
                      aria-label="Shopping cart"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Profile/Login */}
                  {isLoggedIn ? (
                    <div className="relative" ref={profileMenuRef}>
                      <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary focus:outline-none"
                        aria-label="User menu"
                      >
                        <CircleUser className="h-5 w-5" />
                      </button>

                      {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl bg-white border border-gray-100 py-1 z-50">
                          <div className="px-4 py-2 text-sm text-gray-500 font-medium border-b">
                            Welcome back!
                          </div>
                          
                          {[
                            { href: "/account", icon: CircleUser, label: "Your Profile" },
                            { href: "/orders", icon: Package, label: "Your Orders" },
                            { href: "/wishlist", icon: Heart, label: "Wishlist" },
                            { href: "/faqs", icon: HelpCircle, label: "Help & Support" },
                          ].map(({ href, icon: Icon, label }) => (
                            <Link
                              key={href}
                              href={href}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              <Icon className="w-4 h-4 mr-3" />
                              {label}
                            </Link>
                          ))}
                          
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                      className="hidden md:inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                      Get Started
                    </Link>
                  )}
                </>
              )}
            </ClientOnlyAuthStatus>
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
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  pathname === href
                    ? "bg-secondary text-primary"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {name}
              </Link>
            ))}
            
            <ClientOnlyAuthStatus>
              {(isLoggedIn) => (
                !isLoggedIn && (
                  <Link
                    href="/login"
                    className="block w-full px-3 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-primary-dark transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                )
              )}
            </ClientOnlyAuthStatus>
          </div>
        </div>
      )}
    </nav>
  );
}
