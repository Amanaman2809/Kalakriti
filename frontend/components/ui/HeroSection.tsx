import palace from '@/public/palace.jpg';
import { MoveRight, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React from "react";

function HeroSection() {
  return (
    <section className="relative w-full min-h-[600px] md:h-[75vh] xl:h-[85vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={palace}
          alt="Traditional Indian craftsmanship"
          fill
          priority
          quality={100}
          className="object-cover object-center"
          sizes="100vw"
          style={{
            objectPosition: "50% 35%"
          }}
        />
        {/* Enhanced gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-primary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 text-secondary/20 hidden lg:block">
        <Sparkles size={80} />
      </div>
      <div className="absolute bottom-32 right-32 text-secondary/20 hidden lg:block">
        <Sparkles size={60} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-3xl text-white">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm border border-secondary/30 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Authentic Indian Craftsmanship
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="block">Kalakriti</span>
            <span className="block text-secondary text-2xl sm:text-3xl md:text-4xl font-normal mt-2 italic">
              Where Art Meets Heritage
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed max-w-2xl text-gray-100">
            Discover unique handmade pieces that tell stories of tradition, culture, and exceptional craftsmanship passed down through generations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link
              href="/category"
              className="group inline-flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/90 text-primary font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-[1.02] text-lg"
            >
              Explore Collection
              <MoveRight className="transition-transform duration-300 group-hover:translate-x-1" size={24} />
            </Link>

            <Link
              href="/about"
              className="group inline-flex items-center justify-center gap-2 border-2 border-white/30 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-white/50"
            >
              Our Story
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
            <div className="text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-secondary">500+</div>
              <div className="text-sm text-gray-200">Unique Products</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-secondary">50+</div>
              <div className="text-sm text-gray-200">Master Artisans</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-secondary">1000+</div>
              <div className="text-sm text-gray-200">Happy Customers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
