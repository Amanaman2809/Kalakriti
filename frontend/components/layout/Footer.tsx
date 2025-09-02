"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Heart,
  ArrowUp,
  Youtube,
  Linkedin,
} from "lucide-react";

// ✅ Navigation links
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Categories", href: "/category" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "FAQs", href: "/faqs" },
];

const quickLinks = [
  { name: "Your Orders", href: "/orders" },
  { name: "Wishlist", href: "/wishlist" },
  { name: "Account", href: "/account" },
  { name: "Help Center", href: "/faqs" },
];

const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com/Chalava",
    icon: <Instagram className="w-5 h-5" />,
    color: "hover:text-pink-400",
  },
  {
    name: "Facebook",
    href: "https://facebook.com/Chalava",
    icon: <Facebook className="w-5 h-5" />,
    color: "hover:text-blue-400",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/Chalava",
    icon: <Twitter className="w-5 h-5" />,
    color: "hover:text-sky-400",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@Chalava",
    icon: <Youtube className="w-5 h-5" />,
    color: "hover:text-red-400",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/Chalava",
    icon: <Linkedin className="w-5 h-5" />,
    color: "hover:text-blue-500",
  },
];

function Footer() {
  const pathname = usePathname();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="bg-primary text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-accent rounded-xl"></div>
                <Image
                  src="/logo_sm.png"
                  width={60}
                  height={60}
                  alt="Chalava Logo"
                  className="relative rounded-xl border-2 border-white/20"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Chalava</h3>
                <div className="flex items-center gap-1 text-sm text-secondary">
                  <Heart className="w-3 h-3 fill-current" />
                  <span>Handcrafted Excellence</span>
                </div>
              </div>
            </div>

            <p className="text-white/80 mb-6 leading-relaxed text-sm">
              Celebrating India's rich heritage through authentic handcrafted
              products. Each piece tells a story of tradition, skill, and
              artistry passed down through generations.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:Chalava@handicrafts.com"
                className="flex items-center gap-3 text-white/80 hover:text-secondary transition-all duration-300 group"
              >
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 group-hover:scale-110 transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">
                  Chalava@handicrafts.com
                </span>
              </a>

              <a
                href="tel:+918209101822"
                className="flex items-center gap-3 text-white/80 hover:text-secondary transition-all duration-300 group"
              >
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 group-hover:scale-110 transition-all duration-300">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">+91 82091 01822</span>
              </a>

              <div className="flex items-start gap-3 text-white/80">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center mt-1">
                  <MapPin className="w-4 h-4" />
                </div>
                <address className="not-italic text-sm leading-relaxed">
                  Shop No. 30, Abhinandan Vihar
                  <br />
                  Vaishali Nagar, Jaipur
                  <br />
                  Rajasthan - 302034, India
                </address>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-secondary rounded-full"></div>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {navLinks.map(({ name, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`text-sm transition-all duration-300 flex items-center group ${
                      pathname === href
                        ? "text-secondary font-semibold translate-x-2"
                        : "text-white/80 hover:text-secondary hover:translate-x-2"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 bg-secondary rounded-full mr-3 transition-all duration-300 ${
                        pathname === href
                          ? "opacity-100 scale-125"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    ></span>
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
              <div className="w-1 h-6 bg-secondary rounded-full"></div>
              Your Account
            </h4>
            <ul className="space-y-3">
              {quickLinks.map(({ name, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/80 hover:text-secondary transition-all duration-300 flex items-center group hover:translate-x-2"
                  >
                    <span className="w-1.5 h-1.5 bg-secondary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span>© 2025 Chalava.</span>
                <Heart className="w-4 h-4 text-red-400 fill-current animate-pulse" />
                <span>Handmade with love in India</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/60 hidden sm:block font-medium">
                Follow us:
              </span>
              <div className="flex items-center gap-2">
                {socialLinks.map(({ name, href, icon, color }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-white/80 ${color} transition-all duration-300 hover:scale-110 hover:bg-white/20 hover:rotate-6 border border-white/10 hover:border-white/30`}
                    aria-label={`Follow us on ${name}`}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Scroll to Top */}
            <button
              onClick={scrollToTop}
              className="w-11 h-11 bg-secondary/20 hover:bg-secondary text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group border border-secondary/30 hover:border-secondary"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
