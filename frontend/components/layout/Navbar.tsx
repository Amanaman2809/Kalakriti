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
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Categories", href: "/category" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

// ✅ Enhanced Auth Context Hook
function useAuthState() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  const updateAuthState = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        const cartData = localStorage.getItem("cart");
        setIsLoggedIn(!!token);
        setUser(userData ? JSON.parse(userData) : null);

        if (cartData) {
          const cart = JSON.parse(cartData);
          const count = Array.isArray(cart)
            ? cart.reduce((total, item) => total + (item.quantity || 1), 0)
            : 0;
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      }
    } catch (error) {
      setCartCount(0);
      console.error("Auth state update error:", error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    updateAuthState();
  }, [updateAuthState]);

  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user" || e.key === "cart") {
        updateAuthState();
      }
    };

    const handleCartUpdate = () => {
      updateAuthState();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [mounted, updateAuthState]);

  const logout = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("cart");

        setIsLoggedIn(false);
        setUser(null);
        setCartCount(0);
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
    }
  }, []);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user" || e.key === "cart") {
        updateAuthState();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted, updateAuthState]);

  return {
    isLoggedIn,
    cartCount,
    user,
    mounted,
    logout,
    updateAuthState,
  };
}

// ✅ Enhanced Search Component
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        if (query.trim().length > 2) {
          handleSearch(query);
        }
      }, 300);
    },
    [handleSearch],
  );

  const handleSuggestionClickMemo = useCallback(
    (item: any) => {
      handleSuggestionClick(item);
      setShowMobileSearch(false);
      setShowSuggestions(false);
    },
    [handleSuggestionClick, setShowSuggestions],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  }, [setSearchQuery, setShowSuggestions]);

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
      {/* Mobile Search */}
      {!showMobileSearch ? (
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-all duration-200"
          aria-label="Open search"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      ) : (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center p-4 border-b border-gray-200 bg-white">
            <div className="flex-1 relative">
              <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3">
                <SearchIcon className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search handcrafted products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="bg-transparent border-none focus:outline-none text-base flex-1 placeholder-gray-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="ml-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowMobileSearch(false)}
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50">
            {suggestions.length > 0 ? (
              <div className="p-4 space-y-2">
                {suggestions.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-4 p-4 bg-white hover:bg-gray-50 rounded-xl text-left transition-colors border border-gray-100"
                    onClick={() => handleSuggestionClickMemo(item)}
                  >
                    <SearchIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900">{item.name}</span>
                  </button>
                ))}
              </div>
            ) : searchQuery.length > 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <SearchIcon className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-center">
                      No results found for &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <p>Start typing to search products...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop Search */}
      <div className="hidden md:flex items-center relative">
        <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-all duration-200 rounded-xl pl-4 pr-3 py-2.5">
          <SearchIcon className="h-4 w-4 text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search handcrafted products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              debouncedSearch(e.target.value);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="bg-transparent border-none focus:outline-none px-3 py-1 text-sm w-56 placeholder-gray-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 mt-2 w-full bg-white shadow-xl rounded-xl py-2 border border-gray-200 max-h-80 overflow-y-auto">
            {suggestions.slice(0, 6).map((item) => (
              <button
                key={item.id}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm transition-colors flex items-center gap-3"
                onClick={() => handleSuggestionClickMemo(item)}
              >
                <SearchIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{item.name}</span>
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

  // Use enhanced auth state
  const { isLoggedIn, cartCount, user, mounted, logout, updateAuthState } =
    useAuthState();

  // Enhanced logout handler
  const handleLogout = useCallback(() => {
    logout();
    setIsProfileMenuOpen(false);
    router.push("/");
  }, [logout, router]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!isProfileMenuOpen) return;

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
  }, [isProfileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  // Update cart count when user logs in
  useEffect(() => {
    if (mounted && isLoggedIn) {
      updateAuthState();
    }
  }, [pathname, mounted, updateAuthState, isLoggedIn]);

  const navigationLinks = useMemo(
    () =>
      navLinks.map(({ name, href }) => (
        <Link
          key={href}
          href={href}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            pathname === href
              ? "bg-primary text-white shadow-lg scale-105"
              : "text-gray-600 hover:text-primary hover:bg-primary/10"
          }`}
        >
          {name}
        </Link>
      )),
    [pathname],
  );

  // Show loading state until mounted
  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <button className="md:hidden text-gray-500 p-2">
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <Image
                src="/logo_sm.png"
                width={80}
                height={80}
                alt="Chalava Logo"
                priority
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Chalava</h1>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Sparkles className="w-3 h-3" />
                  <span>Handcrafted Excellence</span>
                </div>
              </div>
            </Link>

            <div className="hidden md:flex md:items-center md:space-x-4">
              {navigationLinks}
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-500 hover:text-primary focus:outline-none p-2 rounded-lg hover:bg-primary/10 transition-all duration-200"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 flex items-center gap-3 group"
          >
            <div className="relative">
              <Image
                src="/logo_sm.png"
                width={80}
                height={80}
                alt="Chalava Logo"
                className=" transition-transform group-hover:scale-105"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                Chalava.in
              </h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Handcrafted Excellence</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {navigationLinks}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <SearchComponent isLoggedIn={isLoggedIn} />

            {isLoggedIn && (
              <Link
                href="/cart"
                className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-primary transition-all duration-200 group"
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse border-2 border-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
                {/* Pulsing effect for visual feedback */}
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-20"></span>
                )}
              </Link>
            )}

            {/* Profile/Login */}
            {isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-primary focus:outline-none transition-all duration-200 group"
                  aria-label="User menu"
                >
                  <CircleUser className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl bg-white border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.name || "Welcome!"}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>

                    {/* Menu Items */}
                    {[
                      {
                        href: "/account",
                        icon: CircleUser,
                        label: "Your Profile",
                        shortcut: "⌘P",
                      },
                      {
                        href: "/orders",
                        icon: Package,
                        label: "Your Orders",
                        shortcut: "⌘O",
                      },
                      {
                        href: "/wishlist",
                        icon: Heart,
                        label: "Wishlist",
                        shortcut: "⌘W",
                      },
                      {
                        href: "/return-policy",
                        icon: RotateCcw,
                        label: "Return Policy",
                        shortcut: "⌘R",
                      },
                      {
                        href: "/faqs",
                        icon: HelpCircle,
                        label: "Help & Support",
                        shortcut: "⌘?",
                      },
                    ].map(({ href, icon: Icon, label, shortcut }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-all duration-200 group"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                          {label}
                        </div>
                        <span className="text-xs text-gray-400">
                          {shortcut}
                        </span>
                      </Link>
                    ))}

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group"
                      >
                        <LogOut className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                        Sign Out
                        <span className="ml-auto text-xs text-red-400">⌘Q</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                <CircleUser className="w-4 h-4" />
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map(({ name, href }) => (
              <Link
                key={href}
                href={href}
                className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  pathname === href
                    ? "bg-primary text-white shadow-lg"
                    : "text-gray-600 hover:text-primary hover:bg-primary/10"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {name}
              </Link>
            ))}

            {!isLoggedIn && (
              <Link
                href="/login"
                className="block w-full px-4 py-3 mt-4 text-center text-white bg-gradient-to-r from-primary to-primary/90 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
                onClick={() => setIsMobileMenuOpen(false)}
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
