'use client';

import Link from 'next/link';
import React, { useState } from 'react';

export default function FAQsPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Are all products on Kalakriti handmade?",
      answer:
        "Yes, every product listed on Kalakriti is 100% handmade, carefully crafted by verified artisans and creators. We celebrate authentic craftsmanship and ensure every item reflects originality and skill.",
    },
    {
      question: "Can I place an order from outside India?",
      answer:
        "Yes! Kalakriti offers international shipping to most countries. Simply choose your destination at checkout, and we'll handle the rest with care.",
    },
    {
      question: "How long will it take to receive my order?",
      answer:
        "Orders within India typically arrive within 5–7 business days. International orders may take 10–15 business days, depending on your location and customs processing.",
    },
    {
      question: "I'm an artist. How can I sell on Kalakriti?",
      answer:
        "We welcome artists and creators to join our platform. Please visit the 'Sell With Us' section to apply. After a quick review and onboarding, you'll be able to list your creations for a global audience.",
    },
    {
      question: "Do artists get full credit for their work?",
      answer:
        "Absolutely. Every product features the artist's name and profile. We strongly believe in recognizing the creators behind the work and helping them grow their brand and identity.",
    },
    {
      question: "What payment options do you support?",
      answer:
        "We accept all major credit and debit cards, UPI, Net Banking, Wallets, and COD (Cash on Delivery) within India. International customers can use international cards and PayPal.",
    },
    {
      question: "Do you offer custom artwork?",
      answer:
        "Yes! Many of our artists accept commissions for custom work. Look for the 'Request Customization' option on the product page or contact us directly to arrange a custom order.",
    },
    {
      question: "How can I track my order?",
      answer:
        "As soon as your order ships, you'll receive a tracking link via email and SMS. You can also track it anytime via your account dashboard.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a 7-day return window for damaged or incorrect items. Since most of our products are handmade, minor variations are expected and celebrated. For more details, refer to our Return Policy page.",
    },
    {
      question: "Is gift packaging available?",
      answer:
        "Yes, we offer gift wrapping and personalized notes at checkout. It's a great way to surprise your loved ones with something truly special.",
    },
    {
      question: "Do you offer bulk or corporate gifting options?",
      answer:
        "Yes, we specialize in curated bulk orders and corporate gifting with a personal touch. Reach out to our support team for catalogs and customization options.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-background min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-text/80 max-w-2xl mx-auto">
            Find answers to common questions about our handmade products, shipping, and more.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-secondary rounded-xl overflow-hidden transition-all duration-200"
            >
              <button
                className={`w-full flex justify-between items-center p-6 text-left focus:outline-none ${
                  activeIndex === index ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => toggleFAQ(index)}
              >
                <h2 className="text-lg md:text-xl font-semibold text-text">
                  {faq.question}
                </h2>
                <svg
                  className={`w-6 h-6 text-primary transform transition-transform duration-200 ${
                    activeIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  activeIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="p-6 pt-0 text-text/80">
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-accent rounded-xl p-8">
          <h3 className="text-xl font-semibold text-text mb-4">
            Still have questions?
          </h3>
          <p className="text-text/80 mb-6">
            We're happy to help! Contact our support team for personalized assistance.
          </p>
          <Link href={'/contact'} className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-full transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}