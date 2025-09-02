"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageCircle,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  Star,
  Users,
  Award,
  Heart,
} from "lucide-react";
import { Instagram, Facebook, Twitter, Youtube, Linkedin } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    if (
      formData.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - replace with your actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would typically send the form data to your API
      console.log("Form submitted:", formData);

      setIsSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.", {
        duration: 5000,
        position: "top-center",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 py-16">
        <div className="absolute inset-0 bg-white/70"></div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-text">
              Get in Touch with <span className="text-primary">Chalava</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Have questions about our handcrafted treasures? Need help with
              your order? We're here to help you discover the perfect piece for
              your collection.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>Quick Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>Personal Service</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-silver" />
                <span>Expert Guidance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            {/* Contact Details */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-accent">
              <h2 className="text-2xl font-bold text-text mb-6 flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                Contact Information
              </h2>

              <div className="space-y-6">
                <ContactInfo
                  icon={<Mail className="w-5 h-5 text-primary" />}
                  title="Email Us"
                  content="Chalava@handicrafts.com"
                  link="mailto:Chalava@handicrafts.com"
                />

                <ContactInfo
                  icon={<Phone className="w-5 h-5 text-primary" />}
                  title="Call Us"
                  content="+91 82091 01822"
                  link="tel:+918209101822"
                />

                <ContactInfo
                  icon={<MapPin className="w-5 h-5 text-primary" />}
                  title="Visit Our Store"
                  content={
                    <address className="not-italic">
                      Shop No. 30, Abhinandan Vihar
                      <br />
                      Near Rukmani Garden, Bajri Mandi Road
                      <br />
                      Vaishali Nagar, Jaipur, Rajasthan - 302034
                    </address>
                  }
                />
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-accent">
              <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                Business Hours
              </h3>

              <div className="space-y-3">
                <HoursItem day="Monday - Friday" hours="10:00 AM - 8:00 PM" />
                <HoursItem day="Saturday" hours="10:00 AM - 9:00 PM" />
                <HoursItem day="Sunday" hours="11:00 AM - 7:00 PM" />
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  📞 Customer Support: 10:00 AM - 6:00 PM
                </p>
                <p className="text-sm text-green-600 mt-1">
                  ✉️ Email Response: Within 24 hours
                </p>
              </div>
            </div>

            {/* Social Links */}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-accent">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text mb-2">
                  Send Us a Message
                </h2>
                <p className="text-gray-600">
                  Whether you have questions about our products, need custom
                  work, or want to visit our store, we'd love to hear from you.
                </p>
              </div>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-text mb-2">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We'll get back to you within 24
                    hours.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Your Name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={errors.name}
                      placeholder="Enter your full name"
                      required
                    />

                    <FormField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={errors.phone}
                      placeholder="+91 12345 67890"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      >
                        <option value="">Select a subject</option>
                        <option value="product-inquiry">Product Inquiry</option>
                        <option value="custom-order">Custom Order</option>
                        <option value="store-visit">Store Visit</option>
                        <option value="wholesale">Wholesale Inquiry</option>
                        <option value="support">Customer Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <FormField
                    label="Your Message"
                    name="message"
                    type="textarea"
                    value={formData.message}
                    onChange={handleInputChange}
                    error={errors.message}
                    placeholder="Tell us how we can help you..."
                    required
                    rows={10}
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <p className="text-sm text-gray-500 text-center">
                    By sending this message, you agree to our Privacy Policy and
                    Terms of Service.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text mb-4">
              Find Us in the Pink City
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Visit our beautiful store in Jaipur to experience our handcrafted
              collections in person. Our artisans and staff are always happy to
              share the stories behind each piece.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-accent overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 w-full h-96 rounded-xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56958.97703717588!2d75.7368576!3d26.885141299999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-text text-center mb-8">
            Why Choose Chalava?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TrustIndicator
              icon={<Users className="w-8 h-8 text-primary" />}
              title="Personal Service"
              description="Each customer receives individual attention and expert guidance from our knowledgeable team."
            />
            <TrustIndicator
              icon={<Award className="w-8 h-8 text-silver" />}
              title="Authentic Craftsmanship"
              description="Every piece is handcrafted by skilled artisans using traditional techniques passed down through generations."
            />
            <TrustIndicator
              icon={<Heart className="w-8 h-8 text-red-500" />}
              title="Customer Satisfaction"
              description="Over 10,000+ happy customers worldwide trust us for authentic Indian handicrafts."
            />
          </div>
        </div>
        <div className="bg-white p-8">
          <h3 className="text-xl text-center font-bold text-text mb-6">
            Follow Our Journey
          </h3>

          <div className="flex gap-4 justify-center">
            <SocialLink
              href="https://instagram.com/Chalava"
              icon={<Instagram className="w-5 h-5" />}
              label="Instagram"
              className="bg-pink-50 hover:bg-pink-100 text-pink-600 hover:text-pink-700"
            />
            <SocialLink
              href="https://facebook.com/Chalava"
              icon={<Facebook className="w-5 h-5" />}
              label="Facebook"
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
            />
            <SocialLink
              href="https://youtube.com/@Chalava"
              icon={<Youtube className="w-5 h-5" />}
              label="YouTube"
              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
            />
            <SocialLink
              href="https://linkedin.com/company/Chalava"
              icon={<Linkedin className="w-5 h-5" />}
              label="LinkedIn"
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
            />
          </div>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Stay updated with our latest handcrafted collections and artisan
            stories
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
const ContactInfo = ({
  icon,
  title,
  content,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
  link?: string;
}) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">{icon}</div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      {link ? (
        <a
          href={link}
          className="text-gray-600 hover:text-primary transition-colors"
        >
          {content}
        </a>
      ) : (
        <div className="text-gray-600">{content}</div>
      )}
    </div>
  </div>
);

const HoursItem = ({ day, hours }: { day: string; hours: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="font-medium text-gray-700">{day}</span>
    <span className="text-gray-600">{hours}</span>
  </div>
);

const SocialLink = ({
  href,
  icon,
  label,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  className: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex items-center justify-center gap-2 p-3 rounded-lg transition-all font-medium text-sm ${className}`}
  >
    {icon}
    <span>{label}</span>
  </a>
);

const FormField = ({
  label,
  name,
  type,
  value,
  onChange,
  error,
  placeholder,
  required = false,
  rows,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows || 4}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none ${
          error ? "border-red-300" : "border-gray-300"
        }`}
        placeholder={placeholder}
        required={required}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
          error ? "border-red-300" : "border-gray-300"
        }`}
        placeholder={placeholder}
        required={required}
      />
    )}
    {error && (
      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

const TrustIndicator = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
      {icon}
    </div>
    <h4 className="text-lg font-semibold text-text mb-2">{title}</h4>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);
