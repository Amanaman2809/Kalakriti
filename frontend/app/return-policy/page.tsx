import Link from "next/link";
import {
  RotateCcw,
  Clock,
  AlertCircle,
  CreditCard,
  XCircle,
  CheckCircle,
  Mail,
  Package,
  ArrowLeft,
  Phone,
} from "lucide-react";

export const metadata = {
  title: "Return Policy | Kalakriti - Handcrafted Treasures",
  description:
    "Comprehensive return policy for our handcrafted products. Learn about our 7-day return window, store credit policy, and process for returns.",
  keywords:
    "return policy, refund, store credit, handmade products, return process",
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 py-20">
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <RotateCcw className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-text">
              Return Policy
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            We want you to be completely satisfied with your handcrafted
            purchase. Please review our return policy below to understand your
            options.
          </p>

          {/* Quick Summary */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full">
            <Clock className="w-5 h-5" />
            <span className="font-semibold">
              7-Day Return Window • Store Credit Only
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-2">
        {/* Important Notice */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">
                Important Notice
              </h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                <strong>We do not offer cash refunds.</strong> All eligible
                returns are processed as store credit valid for 5 months. Please
                read the full policy below before making your purchase.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-accent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text">
                1. Eligibility for Returns
              </h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  Returns are only accepted within <strong>7 days</strong> from
                  the date of delivery.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  Items must be{" "}
                  <strong>unused, unopened, and in original condition</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>
                  We do not accept returns on{" "}
                  <strong>sale, clearance, or customized items</strong>.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-accent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-text">
                2. Non-Refundable Items
              </h2>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Shipping fees</strong> are non-refundable.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Gift cards, digital downloads</strong>, and certain
                  other items may be excluded from returns.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  Items returned without <strong>original packaging</strong> or
                  in a condition that cannot be resold may incur a restocking
                  fee of up to <strong>50%</strong> of the purchase price.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-accent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-text">
                3. Restocking Fee
              </h2>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 mb-4">
              <p className="text-orange-800 font-medium">
                A restocking fee of <strong>20%-50%</strong> may apply depending
                on the product&apos;s condition and packaging.
              </p>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  Returns of <strong>opened or used items</strong> may incur
                  higher restocking fees.
                </span>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-accent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-text">
                4. Process for Returns
              </h2>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Step 1: Contact Customer Service
                </h4>
                <p className="text-blue-700 text-sm">
                  Contact our customer service team at <strong>[email]</strong>{" "}
                  within 7 days of receiving your order, providing your order
                  number and the reason for return.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-2">
                    📋 Required Information:
                  </h5>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Order number</li>
                    <li>• Reason for return</li>
                    <li>• Photos (if damaged/defective)</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-800 mb-2">
                    ⚠️ Important Notes:
                  </h5>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• All returns must be pre-approved</li>
                    <li>• Unauthorized returns will be rejected</li>
                    <li>• Customer pays return shipping</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-accent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-text">
                5. Store Credit Only
              </h2>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-green-800 mb-2">
                🎁 Store Credit Details:
              </h4>
              <ul className="text-green-700 space-y-2">
                <li>
                  • <strong>Valid for 5 months</strong> from the date of issue
                </li>
                <li>
                  • <strong>Non-transferable</strong> - can only be used by you
                </li>
                <li>
                  • <strong>Full purchase price</strong> minus restocking
                  fees/shipping
                </li>
                <li>
                  • Delivered via <strong>email coupon</strong> to your
                  registered address
                </li>
              </ul>
            </div>
            <p className="text-gray-600 text-sm">
              <strong>Note:</strong> Refunds are not provided under any
              circumstances. All eligible returns will be issued as store credit
              only.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-accent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-text">
                6. Final Sale and Exceptions
              </h2>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-purple-800 font-medium">
                Products purchased during{" "}
                <strong>
                  promotional sales, flash sales, or special discount events
                </strong>
                are final sale and cannot be returned, exchanged, or refunded.
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              We may make exceptions in rare circumstances, but these will be
              evaluated on a case-by-case basis and are not guaranteed.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-accent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-text">
                7. Processing Timeline
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-teal-50 rounded-lg p-4">
                <h4 className="font-semibold text-teal-800 mb-2">
                  ⏱️ Processing Time:
                </h4>
                <p className="text-teal-700 text-sm">
                  Store credit coupon will be issued within{" "}
                  <strong>7 business days</strong> of receiving and inspecting
                  the returned item.
                </p>
              </div>
              <div className="bg-teal-50 rounded-lg p-4">
                <h4 className="font-semibold text-teal-800 mb-2">
                  📧 Delivery Method:
                </h4>
                <p className="text-teal-700 text-sm">
                  Store credit will be sent to your{" "}
                  <strong>registered email address</strong>
                  as a digital coupon code.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Agreement Notice */}
        <div className="mt-12 bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <p className="text-gray-700 text-center">
            <strong>
              By completing your purchase, you agree to these terms.
            </strong>
            <br />
            All sales are final unless eligible for return as per this policy.
          </p>
        </div>

        {/* Contact and Navigation */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="bg-primary/5 rounded-2xl p-6">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Need Help?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Have questions about returns or need assistance? Our customer
              service team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </Link>
          </div>

          <div className="bg-secondary/5 rounded-2xl p-6">
            <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-secondary" />
              Continue Shopping
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Browse our collection of handcrafted products from talented
              artisans.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Link>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="my-8 text-center">
          <Link
            href="/faqs"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            View Return FAQs
          </Link>
        </div>
      </div>
    </div>
  );
}
