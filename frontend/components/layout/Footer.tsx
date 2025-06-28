"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Facebook, Instagram, Twitter } from "lucide-react";
import SocialLink from "@/utils/SocialLink";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Category", href: "/about" },
  { name: "About", href: "/services" },
  { name: "Contact", href: "/contact" },
];

function Footer() {
  const pathname = usePathname();

  return (
    <footer className="bg-primary text-accent py-10 px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Top: Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_sm.png"
              width={50}
              height={50}
              alt="Logo"
              className="rounded-lg"
            />
            <p className="text-xl font-semibold">Ⓒ 2025 Kalakriti</p>
          </div>
          <p className="text-md font-medium mt-2 sm:mt-0">
            Handmade with care in India
          </p>
        </div>

        {/* Middle: Nav Links */}
        <div className="flex justify-center gap-6 mb-6 flex-wrap">
          {navLinks.map(({ name, href }) => (
            <Link
              key={href}
              href={href}
              className={`transition-all duration-300 text-sm sm:text-base rounded-sm px-3 py-1 border-2 ${
                pathname === href
                  ? "text-primary font-bold bg-secondary border-accent"
                  : "text-accent border-primary hover:font-semibold"
              }`}
            >
              {name}
            </Link>
          ))}
        </div>

        <hr className="border-accent mb-6 opacity-40" />

        {/* Bottom: Contact + Social */}
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          {/* Contact */}
          <a
            href="mailto:kalakriti@handicrafts.com"
            className="flex items-center gap-3"
          >
            <Image
              src="/waving-hand.svg"
              width={30}
              height={30}
              alt="hello"
              className="py-1"
            />
            <p className="text-lg font-semibold">kalakriti@handicrafts.com</p>
          </a>

          {/* Socials */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <SocialLink
              href="https://x.com/vx6Fid"
              icon={<Instagram className="w-4 h-4" />}
              label="Instagram"
            />
            <SocialLink
              href="https://www.linkedin.com/in/achaltiwari/"
              icon={<Facebook className="w-4 h-4" />}
              label="Facebook"
            />
            <SocialLink
              href="https://x.com/vx6Fid"
              icon={<Twitter className="w-4 h-4" />}
              label="Twitter"
            />
            <SocialLink
              href="https://github.com/vx6Fid"
              icon={
                <Image
                  src="/pinterest.svg"
                  width={20}
                  height={20}
                  alt="pinterest logo"
                  className="py-1"
                />
              }
              label="Pinterest"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
