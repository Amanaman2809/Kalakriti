"use client";

import Image from "next/image";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Instagram, Facebook, Twitter } from "lucide-react";
import SocialLink from "@/utils/SocialLink";
import React from "react";

export default function Contact() {
  return (
    <main className="px-6 py-10 md:px-16 lg:px-32 bg-gray-50">
      {/* Hero Section */}
      <section className="text-center mb-16 relative bg-white rounded-xl shadow-sm p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Connect With Kalakriti
          </h1>
          <p className="text-gray-600 mb-6">
            Have questions about our handmade treasures or need assistance with
            your order? We're here to help!
          </p>
          <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4">
            <Image
              src="/planes.jpg"
              width={100}
              height={100}
              alt="Decorative pattern"
            />
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Contact Information */}
        <div className="bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 border-b pb-2">
            Our Details
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Email</h3>
                <a
                  href="mailto:kalakriti@handicrafts.com"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  kalakriti@handicrafts.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Phone</h3>
                <p className="text-gray-600">+91 82091 01822</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Visit Us</h3>
                <address className="not-italic text-gray-600">
                  Shop No. 30, Abhinandan Vihar
                  <br />
                  Near Rukmani Garden, Bajri Mandi Road
                  <br />
                  Vaishali Nagar, Jaipur, Rajasthan - 302034
                </address>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-10">
            <h3 className="font-medium text-gray-700 mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <SocialLink
                href="https://instagram.com/kalakriti"
                icon={<Instagram className="w-5 h-5" />}
                label="Instagram"
                className="hover:text-pink-600"
              />
              <SocialLink
                href="https://facebook.com/kalakriti"
                icon={<Facebook className="w-5 h-5" />}
                label="Facebook"
                className="hover:text-blue-600"
              />
              <SocialLink
                href="https://twitter.com/kalakriti"
                icon={<Twitter className="w-5 h-5" />}
                label="Twitter"
                className="hover:text-primary"
              />
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 border-b pb-2">
            Send Us a Message
          </h2>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="How can we help you?"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Map Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">
          Find Us in Jaipur
        </h2>
        <div className="bg-white p-4 rounded-xl shadow-sm overflow-hidden">
          <div className="aspect-w-16 aspect-h-9 w-full h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56958.97703717588!2d75.7368576!3d26.885141299999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              className="rounded-lg"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="bg-white p-8 rounded-xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 border-b pb-2">
          Business Hours
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2 border-b border-primary w-fit">Store Hours</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex justify-between">
                <span>Monday - Friday</span>
                <span>10:00 AM - 8:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday</span>
                <span>10:00 AM - 9:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday</span>
                <span>11:00 AM - 7:00 PM</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2 border-b border-primary w-fit">Customer Support</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex justify-between">
                <span>Email Response</span>
                <span>Within 24 hours</span>
              </li>
              <li className="flex justify-between">
                <span>Phone Support</span>
                <span>10:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
