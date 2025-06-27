"use client";
import { CircleUser, SearchIcon, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Category", href: "/about" },
  { name: "About", href: "/services" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar({ isLoggedIn = false }) {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm py-3 px-4">
      <div className="relative flex items-center justify-between w-full">
        {/* Section 1: Logo (always visible) */}
        <Image src="/logo_sm.png" width={50} height={50} alt="Logo" />

        {/* Section 2: Navigation Links (always visible) */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="flex gap-8">
            {navLinks.map(({ name, href }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors duration-300 py-1 px-2 border-secondary ${
                  pathname === href
                    ? "text-primary font-bold border py-1 px-2 rounded-sm bg-secondary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        {/* Section 3: Conditional based on login status */}
        <div className="flex items-center gap-6">
          {isLoggedIn ? (
            <>
              {/* Logged-in user view */}
              <div className="flex items-center bg-secondary/70 hover:bg-secondary/90 transition-colors duration-200 rounded-full pl-3 pr-2 py-1">
                <SearchIcon className="w-4 h-4 text-primary" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none focus:ring-0 focus:outline-none px-2 py-1 text-sm w-52 placeholder-primary/50"
                />
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/cart"
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </Link>
                <Link
                  href="/account"
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <CircleUser className="w-5 h-5 text-primary" />
                </Link>
              </div>
            </>
          ) : (
            /* Guest user view */
            <Link
              href="/login"
              className="bg-primary text-accent font-bold px-6 py-2 rounded-md hover:bg-primary-dark transition-colors duration-300"
            >
              Get Started !
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
