import palace from "@/public/palace.jpg";
import { MoveRight, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";

function HeroSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <section className="relative w-full min-h-[600px] md:h-[75vh] xl:h-[85vh] overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 transform hover:scale-105 transition-transform duration-7000 ease-out">
          <Image
            src={palace}
            alt="Traditional Indian craftsmanship"
            fill
            priority
            quality={100}
            className="object-cover object-center"
            sizes="100vw"
            style={{
              objectPosition: "50% 35%",
            }}
          />
        </div>

        {/* Enhanced gradient overlay with animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-primary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Animated particles background */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-secondary animate-float"
              style={{
                width: Math.random() * 20 + 5 + "px",
                height: Math.random() * 20 + 5 + "px",
                top: Math.random() * 100 + "%",
                left: Math.random() * 100 + "%",
                animationDelay: Math.random() * 5 + "s",
                animationDuration: Math.random() * 10 + 10 + "s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Animated decorative elements */}
      <div className="absolute top-20 right-10 text-secondary/20 hidden lg:block animate-pulse-slow">
        <Sparkles size={80} />
      </div>
      <div className="absolute bottom-32 right-32 text-secondary/20 hidden lg:block animate-ping-slow">
        <Sparkles size={60} />
      </div>
      <div className="absolute top-1/3 left-10 text-secondary/10 hidden lg:block animate-bounce-slow">
        <Sparkles size={50} />
      </div>

      {/* Content with staggered animations */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-3xl text-white">
          {/* Animated Badge */}
          <div
            className={`inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm border border-secondary/30 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6 transition-all duration-700 ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <Sparkles className="w-4 h-4" />
            Authentic Indian Craftsmanship
          </div>

          {/* Main heading with staggered animation */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span
              className={`block transition-all duration-1000 delay-100 ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              Chalava
            </span>
            <span
              className={`block text-secondary text-2xl sm:text-3xl md:text-4xl font-normal mt-2 italic transition-all duration-1000 delay-300 ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            >
              Where Art Meets Heritage
            </span>
          </h1>

          {/* Description with fade-in */}
          <p
            className={`text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed max-w-2xl text-gray-100 transition-all duration-1000 delay-500 ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            Discover unique handmade pieces that tell stories of tradition,
            culture, and exceptional craftsmanship passed down through
            generations.
          </p>

          {/* CTA Buttons with hover animations */}
          <div
            className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-all duration-1000 delay-700 ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <Link
              href="/category"
              className="group relative overflow-hidden inline-flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/90 text-primary font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-[1.02] text-lg"
            >
              <span className="relative z-10">Explore Collection</span>
              <MoveRight
                className="transition-transform duration-300 group-hover:translate-x-1 relative z-10"
                size={24}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>

            <Link
              href="/about"
              className="group inline-flex items-center justify-center gap-2 border-2 border-white/30 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:bg-white/10 hover:border-white/50 hover:shadow-lg"
            >
              Our Story
            </Link>
          </div>

          {/* Stats with counter animation */}
          <div
            className={`grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20 transition-all duration-1000 delay-900 ${isMounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <div className="text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-secondary">
                <Counter target={500} duration={2000} />
              </div>
              <div className="text-sm text-gray-200">Unique Products</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-secondary">
                <Counter target={50} duration={2000} />
              </div>
              <div className="text-sm text-gray-200">Master Artisans</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-bold text-secondary">
                <Counter target={1000} duration={2000} />
              </div>
              <div className="text-sm text-gray-200">Happy Customers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Counter component for animated numbers
const Counter = ({
  target,
  duration,
}: {
  target: number;
  duration: number;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 20);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 20);

    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count}+</span>;
};

export default HeroSection;
