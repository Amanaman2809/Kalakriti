'use client';

import React from 'react';
import { Heart, Users, Sparkles, MapPin, Award, Palette } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Rajasthani pattern overlays */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <pattern id="rajasthani-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="3" fill="currentColor" />
                <path d="M20,10 L30,20 L20,30 L10,20 Z" fill="none" stroke="currentColor" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#rajasthani-pattern)" className="text-black" />
          </svg>
        </div>

        {/* Floating mandala elements */}
        <div className="absolute top-20 left-10 w-32 h-32 opacity-10 animate-spin-slow">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary" />
            <path d="M50,10 L55,25 L70,20 L60,35 L75,45 L60,50 L75,55 L60,65 L70,80 L55,75 L50,90 L45,75 L30,80 L40,65 L25,55 L40,50 L25,45 L40,35 L30,20 L45,25 Z" fill="currentColor" className="text-primary" />
          </svg>
        </div>

        <div className="absolute bottom-20 right-20 w-24 h-24 opacity-10 animate-pulse">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50,10 Q90,50 50,90 Q10,50 50,10 Z" fill="currentColor" className="text-accent" />
          </svg>
        </div>

        {/* Geometric patterns */}
        <div className="absolute top-1/3 left-0 w-16 h-48 opacity-5">
          <div className="h-full border-l-4 border-primary border-dotted"></div>
        </div>
        <div className="absolute bottom-1/3 right-0 w-16 h-48 opacity-5">
          <div className="h-full border-r-4 border-secondary border-dotted"></div>
        </div>
      </div>

      <div className="relative z-10 px-6 py-10 max-w-6xl mx-auto text-gray-800">
        {/* Hero Section */}
        <div className="text-center mb-16">

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-primary bg-clip-text text-transparent">
            About Kalakriti
          </h1>

          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">कलाकृति</h2>
            <p className="text-lg italic text-gray-600 font-medium">जहाँ कला सिर्फ काम नहीं, एक विरासत है।</p>
          </div>

          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full"></div>
        </div>

        {/* Story Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <Heart className="w-6 h-6 text-primary mr-2" />
                <h3 className="text-xl font-bold text-primary">Our Heritage</h3>
              </div>
              <p className="leading-relaxed text-gray-700">
                <strong>Kalakriti</strong> isn't just a business — it's a legacy that began decades ago in the vibrant lanes of Jaipur,
                the Pink City of India, where every street whispers a story, every wall reflects a culture, and every home nurtures creativity.
              </p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-primary mr-2" />
                <h3 className="text-xl font-bold text-primary">Our Evolution</h3>
              </div>
              <p className="leading-relaxed text-gray-700">
                What started as a family-led tradition of handcrafting and showcasing local art has now evolved into a platform that aims
                to bring that same emotion, detail, and heritage to a global audience.
              </p>
            </div>
          </div>

        </div>

        <div className="mb-16 text-center bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-8 relative overflow-hidden">
          {/* Rajasthani decorative border */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-br-full"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tr from-secondary/25 to-transparent rounded-tl-full"></div>

          {/* Decorative corner elements */}
          <div className="relative z-10">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute w-24 h-24 bg-primary/10 rounded-full animate-pulse-slow"></div>
              <div className="absolute w-20 h-20 bg-primary/15 rounded-full"></div>
              <div className="relative w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Award className="w-10 h-10 text-primary" />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-primary mb-6 tracking-wide">Our Mission</h3>

            <div className="relative max-w-4xl mx-auto">
              {/* Decorative quote marks */}
              <div className="absolute -top-6 -left-6 text-6xl text-primary/10 font-serif">"</div>
              <div className="absolute -bottom-6 -right-6 text-6xl text-primary/10 font-serif">"</div>

              <p className="text-xl text-primary/95 leading-relaxed font-light">
                <span className="font-semibold text-primary">At Kalakriti, we want our audience to see not just the final creation, but the soul within it.</span>
                <br />We believe every brushstroke has a backstory, every creation is rooted in emotion, and every artist has a journey worth sharing.
              </p>
            </div>
          </div>

          {/* Floating decorative elements */}
          <div className="absolute top-8 left-12 w-4 h-4 bg-primary/20 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-10 right-16 w-3 h-3 bg-primary/30 rounded-full animate-float-medium"></div>
          <div className="absolute top-16 right-20 w-2 h-2 bg-primary/40 rounded-full animate-float-fast"></div>
        </div>


          <div className="grid md:grid-cols-3 gap-10 animate-fadeIn my-10">

            {/* Card 1 */}
          <article className="relative bg-white bg-opacity-95 backdrop-blur-md rounded-3xl border-1 border-orange-100 transition-shadow duration-300 overflow-hidden cursor-pointer group">
            <div className="absolute top-0 right-0 w-24 h-24 -z-10 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-br from-silver/20 to-primary/10 rounded-bl-[6rem] rotate-[45deg] translate-x-8 -translate-y-8" />
            </div>

            <div className="relative z-10 p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gold shadow-xl text-white group-hover:scale-110 transition-transform duration-300">
                <Palette className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-semibold text-primary">Canvas of Stories</h3>
              <p className="mt-4 max-w-xs text-gray-700 leading-relaxed tracking-wide font-light">
                In today&apos;s digital age, Kalakriti is a vibrant canvas of stories — showcasing artisans’ passion and tradition woven into every masterpiece.
              </p>
            </div>

            <div className="absolute bottom-6 right-6 -z-10 pointer-events-none opacity-30">
              <svg width={48} height={48} viewBox="0 0 40 40" className="text-silver">
                <path d="M20 0 Q40 20 20 40 Q0 20 20 0 Z" fill="currentColor" />
              </svg>
            </div>
          </article>
            {/* Card 2 */}
          <article className="relative bg-white bg-opacity-95 backdrop-blur-md rounded-3xl border-1 border-orange-100 transition-shadow duration-300 overflow-hidden cursor-pointer group">
            <div className="absolute top-0 right-0 w-24 h-24 -z-10 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-br from-silver/20 to-primary/10 rounded-bl-[6rem] rotate-[45deg] translate-x-8 -translate-y-8" />
            </div>

            <div className="relative z-10 p-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gold shadow-xl text-white group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-semibold text-primary">Supporting Artists</h3>
              <p className="mt-4 max-w-xs text-gray-700 leading-relaxed tracking-wide font-light">
                Empowering emerging artisans by providing a platform for their craft to reach the global audience.
              </p>
            </div>

            <div className="absolute bottom-6 right-6 -z-10 pointer-events-none opacity-30">
              <svg width={48} height={48} viewBox="0 0 40 40" className="text-silver">
                <path d="M20 0 Q40 20 20 40 Q0 20 20 0 Z" fill="currentColor" />
              </svg>
            </div>
          </article>
            {/* Card 3 */}
            <article className="relative bg-white bg-opacity-95 backdrop-blur-md rounded-3xl border-1 border-orange-100 transition-shadow duration-300 overflow-hidden cursor-pointer group">
              <div className="absolute top-0 right-0 w-24 h-24 -z-10 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-br from-silver/20 to-primary/10 rounded-bl-[6rem] rotate-[45deg] translate-x-8 -translate-y-8" />
              </div>

              <div className="relative z-10 p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-full bg-gold shadow-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-primary">Cultural Identity</h3>
                <p className="mt-4 max-w-xs text-gray-700 leading-relaxed tracking-wide font-light">
                  Timeless handcrafted art conveying the rich cultural heritage and vibrant emotions of India.
                </p>
              </div>

              <div className="absolute bottom-6 right-6 -z-10 pointer-events-none opacity-30">
                <svg width={48} height={48} viewBox="0 0 40 40" className="text-silver">
                  <path d="M20 0 Q40 20 20 40 Q0 20 20 0 Z" fill="currentColor" />
                </svg>
              </div>
            </article>
        </div>


        {/* Location Section */}
        <div className="bg-gradient-to-br from-white/90 to-orange-50/90 backdrop-blur-sm rounded-3xl p-10 mb-16 mt-10 border border-orange-100">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center mb-4">
                <MapPin className="w-8 h-8 text-primary mr-3" />
                <h3 className="text-2xl font-bold text-primary">Rooted in Jaipur</h3>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                Based in the culturally rich city of Jaipur, Rajasthan, our roots are deeply tied to tradition, yet our eyes are set on the future.
                We operate with a small but passionate team committed to building a bridge between art and audience, emotion and expression, creator and collector.
              </p>

              <div className="bg-white/80 rounded-xl p-6 shadow-lg border border-orange-200">
                <p className="text-sm text-gray-600 mb-2 font-semibold flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-primary" />
                  Our Address:
                </p>
                <p className="text-gray-800 font-medium">
                  P. NO. 5-A, Laxmi Vihar, Vaishali Marg, Meenawala,<br />
                  Jaipur, Rajasthan – 302034
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 text-center">
                <div className="w-30 h-30 bg-accent/70 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Image
                                src="/logo_sm.png"
                                width={100}
                                height={100}
                                alt="Kalakriti Logo"
                                className="h-20 w-40"
                                priority
                              />
                </div>
                <h4 className="text-xl font-bold text-primary mb-2">Pink City Heritage</h4>
                <p className="text-gray-600 text-sm">
                  Where tradition meets technology and creativity finds its canvas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite 1s;
        }
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite 0.5s;
        }
      `}</style>
    </div>
  );
}
