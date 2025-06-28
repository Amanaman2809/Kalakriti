import palace from '@/public/palace.jpg';
import { MoveRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import React from "react";

function HeroSection() {
  return (
    <section className="relative w-full min-h-[500px] md:h-[70vh] xl:h-[80vh] overflow-hidden">
      {/* Background Image with centered positioning */}
      <div className="absolute inset-0 z-0">
        <Image
          src={palace}
          alt="Traditional Indian craftsmanship"
          fill
          priority
          quality={100}
          className="object-cover object-center brightness-75"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          style={{
            objectPosition: "50% 30%" // Adjust vertical centering (50% is center)
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-2xl text-white px-4 py-8 sm:px-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 leading-tight">
            Kalakriti
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-8 leading-relaxed max-w-lg">
            Discover unique handmade pieces that tell stories of tradition, culture, and exceptional craftsmanship.
          </p>
          <Link 
            href="/category" 
            className="group inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-primary font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            Explore Craftsmanship
            <MoveRight className="ml-1 transition-transform duration-300 group-hover:translate-x-1" size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;