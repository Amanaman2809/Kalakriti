'use client';

import React from 'react';

export default function AboutPage() {
  return (
    <div className="px-6 py-10 max-w-4xl mx-auto text-gray-800">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">About Us</h1>
      
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-primary text-center">कलाकृति</h2>
      <p className="italic text-center mb-8 text-gray-600">जहाँ कला सिर्फ काम नहीं, एक विरासत है।</p>

      <div className="space-y-6 leading-relaxed">
        <p>
          <strong>Kalakriti</strong> isn’t just a business — it’s a legacy that began decades ago in the vibrant lanes of Jaipur,
          the Pink City of India, where every street whispers a story, every wall reflects a culture, and every home nurtures creativity.
        </p>

        <p>
          What started as a family-led tradition of handcrafting and showcasing local art has now evolved into a platform that aims
          to bring that same emotion, detail, and heritage to a global audience.
        </p>

        <p>
          Handcrafted art has always held a timeless place in India's cultural identity — telling stories through brushstrokes,
          colors, and textures. At Kalakriti, we carry this heritage forward by curating and presenting original artworks,
          crafts, and expressions from artists across the country.
        </p>

        <p>
          The idea of Kalakriti was not a spontaneous leap. Having observed creative communities and their struggles closely —
          especially how emerging artists often lack access to recognition and reach — we felt the need for a space that
          doesn’t just sell art, but celebrates it.
        </p>

        <p>
          In today's digital world where everything is one click away, we envisioned Kalakriti as more than just an online art platform.
          It’s a <strong>canvas of stories</strong> — a place to showcase the people, process, and passion behind every masterpiece.
        </p>

        <p>
          We believe every brushstroke has a backstory, every creation is rooted in emotion, and every artist has a journey worth sharing.
          Too often, we overlook what lies behind a beautiful artwork — the days of thought, the silence of focus, and the heritage
          techniques passed down through generations.
        </p>

        <p>
          <strong>At Kalakriti, we want our audience to see not just the final creation, but the soul within it.</strong>
        </p>

        <p>
          Our mission is simple — to bring forward the essence of Indian creativity in a way that connects artists with art lovers,
          collectors, and storytellers around the globe. Whether it's a traditional painting from Rajasthan or a modern sketch from
          a college dorm — every piece has a place at Kalakriti.
        </p>

        <p>
          Based in the culturally rich city of Jaipur, Rajasthan, our roots are deeply tied to tradition, yet our eyes are set on the future.
          From our office at:
        </p>

        <div className="bg-gray-50 p-4 rounded shadow text-sm">
          <p className="mb-1">📍 <strong>Address:</strong></p>
          <p>
            P. NO. 5-A, Laxmi Vihar, Vaishali Marg, Meenawala, <br />
            Jaipur, Rajasthan – 302034
          </p>
        </div>

        <p>
          We operate with a small but passionate team committed to building a bridge between art and audience,
          emotion and expression, creator and collector.
        </p>

        <p className="font-semibold text-primary">
          Kalakriti is where tradition meets technology — and where creativity finds its canvas.
        </p>

        <p>
          We welcome you to explore, feel, and fall in love with art — again.
        </p>
      </div>
    </div>
  );
}
