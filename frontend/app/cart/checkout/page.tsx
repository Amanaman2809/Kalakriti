"use client";

import { useState, useEffect, ChangeEvent, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { CartItem, Address } from "@/utils/types";
import { fetchCartItems } from "@/utils/product";
import { getAddresses, addAddress, deleteAddress, updateAddress, AddressInput } from "@/utils/address";
import {
  Loader2,
  ChevronRight,
  X,
  Check,
  Edit,
  Plus,
  ArrowLeft,
  Shield,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  User,
  AlertTriangle
} from "lucide-react";

const url = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!url) throw new Error("API base URL is not set");

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState({
    cart: true,
    address: true,
    placingOrder: false
  });
  const [errors, setErrors] = useState({
    cart: null as string | null,
    address: null as string | null,
    order: null as string | null
  });
  const [addressForm, setAddressForm] = useState({
    show: false,
    mode: "add" as "add" | "edit",
    editingId: null as string | null
  });
  const [addressData, setAddressData] = useState<AddressInput>({
    street: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    phone: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enhanced fetch data with better error handling
  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      try {
        const [cartData, addressData] = await Promise.all([
          fetchCartItems(),
          getAddresses().catch(err => {
            console.warn("Failed to load addresses:", err);
            return []; // Return empty array on address fetch failure
          })
        ]);

        setCartItems(cartData);
        setAddresses(addressData);

        if (addressData.length > 0) {
          setSelectedAddress(addressData[0].id);
        } else {
          setAddressForm({ show: true, mode: "add", editingId: null });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load data";
        console.error("Fetch error:", error);
        setErrors(prev => ({
          ...prev,
          cart: error instanceof Error ? error.message : "Failed to load cart",
          address: error instanceof Error ? error.message : "Failed to load addresses"
        }));
        toast.error(errorMessage);
      }
     finally {
        setIsLoading(prev => ({
          ...prev,
          cart: false,
          address: false
        }));
      }
    };

    fetchData();
  }, [mounted]);

  // Calculate order totals with proper formatting
  const calculateTotals = useCallback(() => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const shipping = subtotal >= 999 ? 0 : 99;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  }, [cartItems]);

  const { subtotal, shipping, tax, total } = calculateTotals();

  // Handle address form input changes
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setAddressData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  // Prepare form for adding new address
  const handleAddNewAddress = useCallback(() => {
    setAddressData({
      street: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
      phone: "",
    });
    setAddressForm({ show: true, mode: "add", editingId: null });
  }, []);

  // Prepare form for editing address
  const handleEditAddress = useCallback((address: Address) => {
    setAddressData({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      phone: address.phone,
    });
    setAddressForm({ show: true, mode: "edit", editingId: address.id });
  }, []);

  // Save address with enhanced error handling
  const handleSaveAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(prev => ({ ...prev, address: true }));
      setErrors(prev => ({ ...prev, address: null }));

      let newSelectedAddress = selectedAddress;

      if (addressForm.mode === "add") {
        const added = await addAddress(addressData);
        newSelectedAddress = added.id;
        toast.success("Address added successfully", {
          duration: 2000,
          position: 'top-center'
        });
      } else if (addressForm.mode === "edit" && addressForm.editingId) {
        await updateAddress(addressForm.editingId, addressData);
        toast.success("Address updated successfully", {
          duration: 2000,
          position: 'top-center'
        });
      }

      // Refresh addresses
      const updatedAddresses = await getAddresses();
      setAddresses(updatedAddresses);
      setSelectedAddress(newSelectedAddress);
      setAddressForm({ show: false, mode: "add", editingId: null });
    } catch (err: any) {
      setErrors(prev => ({
        ...prev,
        address: err.message || "Failed to save address"
      }));
      toast.error(err.message || "Failed to save address");
    } finally {
      setIsLoading(prev => ({ ...prev, address: false }));
    }
  };

  // Delete address with confirmation
  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      setIsLoading(prev => ({ ...prev, address: true }));
      await deleteAddress(id);

      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      setAddresses(updatedAddresses);

      if (selectedAddress === id) {
        setSelectedAddress(updatedAddresses[0]?.id || null);
      }
      toast.success("Address deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address");
    } finally {
      setIsLoading(prev => ({ ...prev, address: false }));
    }
  };

  // Enhanced order placement with better error handling
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, placingOrder: true }));
      setErrors(prev => ({ ...prev, order: null }));

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login to continue");
        router.push('/login');
        return;
      }

      const response = await fetch(`${url}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addressId: selectedAddress,
          paymentMode: paymentMethod.toUpperCase()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to place order';

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const res = await response.json();
      const orderId = res?.order?.id;

      toast.success("🎉 Order placed successfully!", {
        duration: 3000,
        position: 'top-center'
      });

      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      setErrors(prev => ({
        ...prev,
        order: err.message || 'Failed to place order'
      }));
      toast.error(err.message || "Failed to place order");
    } finally {
      setIsLoading(prev => ({ ...prev, placingOrder: false }));
    }
  };

  if (!mounted || isLoading.cart) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <Shield className="h-16 w-16 text-primary/20" />
              <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-4 left-4" />
            </div>
            <p className="mt-6 text-lg text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errors.cart) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">Failed to load cart</h3>
              <p className="text-red-600 mb-6">{errors.cart}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
                >
                  Try Again
                </button>
                <Link
                  href="/cart"
                  className="bg-white text-primary border border-primary px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors font-medium"
                >
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-full hover:bg-accent transition-colors"
            title="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-primary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-text">Secure Checkout</h1>
            <p className="text-gray-600 mt-1">Review your order and complete payment</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address Section */}
            <AddressSection
              addresses={addresses}
              selectedAddress={selectedAddress}
              addressForm={addressForm}
              addressData={addressData}
              isLoading={isLoading}
              errors={errors}
              onSelectAddress={setSelectedAddress}
              onAddNew={handleAddNewAddress}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              onSave={handleSaveAddress}
              onInputChange={handleInputChange}
              onCancel={() => setAddressForm({ show: false, mode: "add", editingId: null })}
            />

            {/* Payment Method Section */}
            {selectedAddress && (
              <PaymentSection
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
              />
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              total={total}
              selectedAddress={selectedAddress}
              paymentMethod={paymentMethod}
              isLoading={isLoading.placingOrder}
              error={errors.order}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Address Section Component
const AddressSection = ({
  addresses,
  selectedAddress,
  addressForm,
  addressData,
  isLoading,
  errors,
  onSelectAddress,
  onAddNew,
  onEdit,
  onDelete,
  onSave,
  onInputChange,
  onCancel
}: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <MapPin className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-text">Shipping Address</h2>
      </div>
      {!addressForm.show && (
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          {addresses.length > 0 ? "Add New" : "Add Address"}
        </button>
      )}
    </div>

    {errors.address && (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{errors.address}</p>
      </div>
    )}

    {addressForm.show ? (
      <AddressForm
        addressData={addressData}
        mode={addressForm.mode}
        isLoading={isLoading.address}
        onSave={onSave}
        onInputChange={onInputChange}
        onCancel={onCancel}
      />
    ) : isLoading.address ? (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ) : addresses.length === 0 ? (
      <EmptyAddressState onAddNew={onAddNew} />
    ) : (
      <AddressList
        addresses={addresses}
        selectedAddress={selectedAddress}
        onSelect={onSelectAddress}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )}
  </div>
);

// Address Form Component
const AddressForm = ({ addressData, mode, isLoading, onSave, onInputChange, onCancel }: any) => (
  <form onSubmit={onSave} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <User className="h-4 w-4 inline mr-1" />
          Street Address
        </label>
        <input
          type="text"
          name="street"
          value={addressData.street}
          onChange={onInputChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          placeholder="Enter your street address"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          name="city"
          value={addressData.city}
          onChange={onInputChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          placeholder="Enter city"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <input
          type="text"
          name="state"
          value={addressData.state}
          onChange={onInputChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          placeholder="Enter state"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
        <input
          type="text"
          name="postalCode"
          value={addressData.postalCode}
          onChange={onInputChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          placeholder="Enter postal code"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <input
          type="text"
          name="country"
          value={addressData.country}
          onChange={onInputChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          placeholder="Enter country"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Phone className="h-4 w-4 inline mr-1" />
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={addressData.phone}
          onChange={onInputChange}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          placeholder="Enter phone number"
        />
      </div>
    </div>

    <div className="flex gap-3 pt-4">
      <button
        type="submit"
        disabled={isLoading}
        className="flex-1 bg-primary text-white py-3 rounded-xl hover:bg-primary/90 disabled:opacity-70 font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : (
          mode === "add" ? "Save Address" : "Update Address"
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"
      >
        Cancel
      </button>
    </div>
  </form>
);

// Address List Component
const AddressList = ({ addresses, selectedAddress, onSelect, onEdit, onDelete }: any) => (
  <div className="space-y-4">
    {addresses.map((address: Address) => (
      <div
        key={address.id}
        className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${selectedAddress === address.id
            ? "border-primary bg-primary/5 shadow-md"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
          }`}
        onClick={() => onSelect(address.id)}
      >
        <div className="flex justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{address.street}</h3>
            <p className="text-gray-600 mt-1">
              {address.city}, {address.state}, {address.country} - {address.postalCode}
            </p>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {address.phone}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(address);
              }}
              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Edit address"
            >
              <Edit className="h-4 w-4" />
            </button>
            {addresses.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(address.id);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete address"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {selectedAddress === address.id && (
          <div className="mt-3 flex items-center gap-2 text-primary">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Selected for delivery</span>
          </div>
        )}
      </div>
    ))}
  </div>
);

// Payment Section Component
const PaymentSection = ({ paymentMethod, onPaymentMethodChange }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-accent p-6">
    <div className="flex items-center gap-3 mb-6">
      <CreditCard className="h-6 w-6 text-primary" />
      <h2 className="text-xl font-semibold text-text">Payment Method</h2>
    </div>
    <div className="space-y-4">
      {[
        {
          id: "cod",
          title: "Cash on Delivery",
          description: "Pay when you receive your order",
          icon: "💵"
        },
        {
          id: "online",
          title: "Online Payment",
          description: "Pay securely with your card",
          icon: "💳"
        }
      ].map((method) => (
        <div
          key={method.id}
          className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${paymentMethod === method.id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
          onClick={() => onPaymentMethodChange(method.id)}
        >
          <div className="flex items-center gap-4">
            <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${paymentMethod === method.id ? "border-primary bg-primary" : "border-gray-300"
              }`}>
              {paymentMethod === method.id && <Check className="h-3 w-3 text-white" />}
            </div>
            <div className="text-2xl">{method.icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{method.title}</h3>
              <p className="text-gray-600 text-sm">{method.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Order Summary Component
const OrderSummary = ({
  cartItems,
  subtotal,
  shipping,
  tax,
  total,
  selectedAddress,
  paymentMethod,
  isLoading,
  error,
  onPlaceOrder
}: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-accent p-6 sticky top-8">
    <h2 className="text-xl font-semibold text-text mb-6">Order Summary</h2>

    {/* Cart Items */}
    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
      {cartItems.map((item: CartItem) => (
        <div key={item.id} className="flex items-center gap-3 py-2">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-accent">
            <Image
              src={item.product.images?.[0] || "/placeholder-product.png"}
              alt={item.product.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1">{item.product.name}</h3>
            <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
          </div>
          <p className="font-semibold text-sm">
            ₹{(item.product.price * item.quantity).toLocaleString()}
          </p>
        </div>
      ))}
    </div>

    {/* Price Breakdown */}
    <div className="space-y-3 mb-6 border-t pt-4">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>₹{subtotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Shipping</span>
        <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
          {shipping === 0 ? "FREE" : `₹${shipping.toLocaleString()}`}
        </span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Tax (GST 18%)</span>
        <span>₹{tax.toLocaleString()}</span>
      </div>
      {subtotal < 999 && (
        <div className="bg-accent p-3 rounded-lg">
          <p className="text-sm text-primary">
            Add ₹{(999 - subtotal).toLocaleString()} more for FREE shipping!
          </p>
        </div>
      )}
    </div>

    <div className="border-t pt-4 mb-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-text">Total</span>
        <span className="text-2xl font-bold text-primary">₹{total.toLocaleString()}</span>
      </div>
    </div>

    {/* Place Order Button */}
    <button
      onClick={onPlaceOrder}
      disabled={!selectedAddress || !paymentMethod || isLoading}
      className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${!selectedAddress || !paymentMethod
          ? "bg-gray-200 cursor-not-allowed text-gray-500"
          : "bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl"
        }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Processing Order...
        </>
      ) : !selectedAddress ? (
        "Add Address to Continue"
      ) : !paymentMethod ? (
        "Select Payment Method"
      ) : (
        <>
          <Shield className="h-5 w-5" />
          Place Secure Order
          <ChevronRight className="h-5 w-5" />
        </>
      )}
    </button>

    {error && (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm text-center">{error}</p>
      </div>
    )}

    {/* Trust Indicators */}
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Shield className="h-4 w-4 text-green-600" />
        <span>Secure SSL encrypted payment</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Truck className="h-4 w-4 text-blue-600" />
        <span>Free shipping on orders above ₹999</span>
      </div>
    </div>

    <p className="text-xs text-gray-500 text-center mt-4">
      By placing your order, you agree to our Terms of Service and Privacy Policy
    </p>
  </div>
);

// Empty states
const EmptyCart = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-6">
      <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
        <Shield className="h-12 w-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-text mb-4">Your cart is empty</h2>
      <p className="text-gray-600 mb-8">Add some products to your cart before proceeding to checkout</p>
      <Link
        href="/products"
        className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors font-medium"
      >
        Browse Products
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  </div>
);

const EmptyAddressState = ({ onAddNew }: any) => (
  <div className="text-center py-8">
    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-700 mb-2">No addresses found</h3>
    <p className="text-gray-500 mb-6">Please add a shipping address to continue with your order</p>
    <button
      onClick={onAddNew}
      className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
    >
      Add Your First Address
    </button>
  </div>
);
