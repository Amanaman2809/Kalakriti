'use client';

import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  CheckCircle,
  Users,
  Globe,
  Package,
  Heart,
  Star,
  Palette
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

const faqData: FAQ[] = [
  {
    id: "handmade-products",
    question: "Are all products on Kalakriti handmade?",
    answer: "Yes, every product listed on Kalakriti is 100% handmade, carefully crafted by verified artisans and creators. We celebrate authentic craftsmanship and ensure every item reflects originality and skill. Each piece goes through our quality verification process before being listed.",
    category: "Products",
    keywords: ["handmade", "authentic", "artisan", "quality", "craftsmanship"]
  },
  {
    id: "international-shipping",
    question: "Can I place an order from outside India?",
    answer: "Yes! Kalakriti offers international shipping to most countries worldwide. Simply choose your destination at checkout, and we'll handle the rest with care. We work with trusted shipping partners to ensure your handcrafted treasures reach you safely.",
    category: "Shipping",
    keywords: ["international", "worldwide", "shipping", "global", "delivery"]
  },
  {
    id: "delivery-time",
    question: "How long will it take to receive my order?",
    answer: "Orders within India typically arrive within 5–7 business days. International orders may take 10–15 business days, depending on your location and customs processing. We provide tracking information once your order ships so you can monitor its progress.",
    category: "Shipping",
    keywords: ["delivery", "shipping time", "tracking", "business days", "customs"]
  },
  {
    id: "artist-onboarding",
    question: "I'm an artist. How can I sell on Kalakriti?",
    answer: "We welcome artists and creators to join our platform! Please visit our 'Sell With Us' section to apply. After a quick review and onboarding process, you'll be able to list your creations for a global audience. We provide support throughout your journey with us.",
    category: "Artists",
    keywords: ["artist", "sell", "onboarding", "creators", "platform"]
  },
  {
    id: "artist-recognition",
    question: "Do artists get full credit for their work?",
    answer: "Absolutely. Every product features the artist's name and profile prominently. We strongly believe in recognizing the creators behind the work and helping them grow their brand and identity. Artists retain full ownership and recognition of their creative work.",
    category: "Artists",
    keywords: ["credit", "recognition", "artist profile", "ownership", "brand"]
  },
  {
    id: "payment-options",
    question: "What payment options do you support?",
    answer: "We accept all major credit and debit cards, UPI, Net Banking, digital wallets, and COD (Cash on Delivery) within India. International customers can use international cards and PayPal. All transactions are secured with industry-standard encryption.",
    category: "Payment",
    keywords: ["payment", "cards", "UPI", "COD", "PayPal", "secure"]
  },
  {
    id: "custom-artwork",
    question: "Do you offer custom artwork?",
    answer: "Yes! Many of our artists accept commissions for custom work. Look for the 'Request Customization' option on the product page or contact us directly to arrange a custom order. Custom pieces typically take 2-4 weeks depending on complexity.",
    category: "Products",
    keywords: ["custom", "commission", "personalized", "bespoke", "artwork"]
  },
  {
    id: "order-tracking",
    question: "How can I track my order?",
    answer: "As soon as your order ships, you'll receive a tracking link via email and SMS. You can also track it anytime via your account dashboard. We provide real-time updates on your order's journey from our workshop to your doorstep.",
    category: "Orders",
    keywords: ["tracking", "order status", "dashboard", "updates", "shipment"]
  },
  {
    id: "return-policy",
    question: "What is your return policy?",
    answer: "We offer a 7-day return window for damaged or incorrect items. Since most of our products are handmade, minor variations are expected and celebrated as part of their authentic charm. For detailed information, please refer to our Return Policy page.",
    category: "Returns",
    keywords: ["return", "policy", "damaged", "exchange", "handmade variations"]
  },
  {
    id: "gift-packaging",
    question: "Is gift packaging available?",
    answer: "Yes, we offer beautiful gift wrapping and personalized notes at checkout. Our gift packaging celebrates the handcrafted nature of our products and makes them perfect for special occasions. It's a wonderful way to surprise your loved ones with something truly unique.",
    category: "Services",
    keywords: ["gift wrap", "packaging", "personalized", "special occasions", "surprise"]
  },
  {
    id: "bulk-orders",
    question: "Do you offer bulk or corporate gifting options?",
    answer: "Yes, we specialize in curated bulk orders and corporate gifting with a personal touch. We can create custom collections that reflect your brand values or occasion. Reach out to our support team for specialized catalogs and customization options.",
    category: "Services",
    keywords: ["bulk", "corporate", "gifting", "custom collections", "business"]
  },
  {
    id: "product-care",
    question: "How should I care for my handmade products?",
    answer: "Each product comes with specific care instructions. Generally, handmade items should be handled gently and stored in a cool, dry place. For textiles, avoid direct sunlight and harsh chemicals. For pottery and ceramics, hand washing is recommended. Detailed care instructions are included with every order.",
    category: "Products",
    keywords: ["care", "maintenance", "cleaning", "storage", "instructions"]
  }
];

const categories = [
  { name: "All", icon: <HelpCircle className="w-4 h-4" />, color: "text-primary" },
  { name: "Products", icon: <Package className="w-4 h-4" />, color: "text-blue-600" },
  { name: "Shipping", icon: <Globe className="w-4 h-4" />, color: "text-green-600" },
  { name: "Artists", icon: <Palette className="w-4 h-4" />, color: "text-purple-600" },
  { name: "Payment", icon: <CheckCircle className="w-4 h-4" />, color: "text-orange-600" },
  { name: "Orders", icon: <Star className="w-4 h-4" />, color: "text-yellow-600" },
  { name: "Returns", icon: <Users className="w-4 h-4" />, color: "text-red-600" },
  { name: "Services", icon: <Heart className="w-4 h-4" />, color: "text-pink-600" },
];

export default function FAQsPage() {
  const [activeIndex, setActiveIndex] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>(faqData);
  const contentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    let filtered = faqData;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }
    setFilteredFAQs(filtered);
  }, [selectedCategory]);

  const toggleFAQ = (id: string) => {
    setActiveIndex(activeIndex === id ? null : id);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 py-20">
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-text">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about our handmade products, shipping,
            artist partnerships, and more. We're here to help you discover the perfect handcrafted treasures.
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>12 Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span>Quick Answers</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${selectedCategory === category.name
                    ? 'bg-primary text-white shadow-lg scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                  }`}
              >
                <span className={selectedCategory === category.name ? 'text-white' : category.color}>
                  {category.icon}
                </span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        {filteredFAQs.length > 0 ? (
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isActive={activeIndex === faq.id}
                onClick={() => toggleFAQ(faq.id)}
                contentRef={(el) => (contentRefs.current[faq.id] = el)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-text mb-2">No FAQs found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse all categories.
            </p>
          </div>
        )}

        {/* Contact Support Section */}
        <div className="mt-16 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 mb-10">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-text mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Can't find what you're looking for? Our friendly support team is here to help!
              Reach out and we'll get back to you within 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// FAQ Item Component
const FAQItem = ({
  faq,
  isActive,
  onClick,
  contentRef
}: {
  faq: FAQ;
  isActive: boolean;
  onClick: () => void;
  contentRef: (el: HTMLDivElement | null) => void;
}) => {
  const categoryConfig = categories.find(cat => cat.name === faq.category);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
      <button
        className={`w-full flex justify-between items-center p-6 text-left focus:outline-none transition-all duration-200 ${isActive ? 'bg-primary/5' : 'hover:bg-gray-50'
          }`}
        onClick={onClick}
      >
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-3 mb-2">
            {categoryConfig && (
              <span className={`${categoryConfig.color}`}>
                {categoryConfig.icon}
              </span>
            )}
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {faq.category}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-text leading-relaxed">
            {faq.question}
          </h2>
        </div>
        <ChevronDown
          className={`w-6 h-6 text-primary transform transition-transform duration-300 flex-shrink-0 ${isActive ? 'rotate-180' : ''
            }`}
        />
      </button>

      <div
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-6 pb-6">
          <div className="pt-2 border-t border-gray-100">
            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>

            {/* Keywords */}
            <div className="mt-4 flex flex-wrap gap-2">
              {faq.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

