"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CartItem, Address } from "@/utils/types";
import { fetchCartItems } from "@/utils/product";
import { getAddresses, addAddress, deleteAddress } from "@/utils/user";
import { AddressInput } from "@/utils/user";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online" | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isAddrLoading, setIsAddrLoading] = useState(true);
  const [addrError, setAddrError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressInput>({
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
  });

  // Fetch cart items and addresses on mount.
  useEffect(() => {
    fetchCartItems()
      .then(items => setCartItems(items))
      .catch(err => setCartError(err.message || "Failed to fetch cart items"))
      .finally(() => setIsCartLoading(false));

    getAddresses()
      .then(addrs => setAddresses(addrs))
      .catch(err => setAddrError(err.message || "Failed to fetch addresses"))
      .finally(() => setIsAddrLoading(false));
  }, []);

  // Calculate subtotal from cart items.
  function calculateSubtotal() {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  // Handle inline form change for new address.
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit new address via inline form.
  const handleAddAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const added = await addAddress(newAddress);
      setAddresses(prev => [added, ...prev]);
      setSelectedAddress(added.id);
      setShowAddForm(false);
      // Reset form for future use.
      setNewAddress({
        street: "",
        city: "",
        state: "",
        country: "",
        postalCode: "",
        phone: "",
      });
    } catch (err: any) {
      setAddrError(err.message || "Failed to add address");
    }
  };

  // Remove address (optional: if you want delete functionality inline)
  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      if (selectedAddress === id) setSelectedAddress(null);
    } catch (err: any) {
      setAddrError(err.message || "Failed to delete address");
    }
  };

  if (isCartLoading) return <div className="p-4">Loading cart items...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      {cartError && <div className="text-red-500 mb-4">{cartError}</div>}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side - Address and Payment */}
        <div className="lg:w-1/2 space-y-8">
          {/* Shipping Address Section */}
          <div className="border border-gray-300 p-6 rounded">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            {isAddrLoading ? (
              <div className="text-gray-500">Loading addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="text-gray-500 mb-4">No addresses found.</div>
            ) : (
              <div className="space-y-4">
                {addresses.map(address => (
                  <div
                    key={address.id}
                    className={`border p-4 cursor-pointer rounded ${
                      selectedAddress === address.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedAddress(address.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{address.street}</p>
                        <p className="text-gray-600">
                          {address.city}, {address.state}, {address.country} - {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-500">{address.phone}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address.id);
                        }}
                        className="text-red-500 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {addrError && <div className="mt-2 text-red-500">{addrError}</div>}
            <div className="mt-4">
              {!showAddForm ? (
                <button
                  className="w-full py-2 border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50"
                  onClick={() => setShowAddForm(true)}
                >
                  + Add New Address
                </button>
              ) : (
                <form onSubmit={handleAddAddress} className="space-y-3">
                  <div>
                    <label className="block text-sm">Street</label>
                    <input
                      type="text"
                      name="street"
                      value={newAddress.street}
                      onChange={handleInputChange}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">City</label>
                    <input
                      type="text"
                      name="city"
                      value={newAddress.city}
                      onChange={handleInputChange}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">State</label>
                    <input
                      type="text"
                      name="state"
                      value={newAddress.state}
                      onChange={handleInputChange}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={newAddress.country}
                      onChange={handleInputChange}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={newAddress.postalCode}
                      onChange={handleInputChange}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={newAddress.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full border p-2 rounded"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-2 border border-gray-300 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="border border-gray-300 p-6 rounded">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="space-y-4">
              <div
                className={`border p-4 cursor-pointer rounded ${
                  paymentMethod === "cod" ? "border-primary bg-primary/10" : "border-gray-300"
                }`}
                onClick={() => setPaymentMethod("cod")}
              >
                <h3 className="font-medium">Cash on Delivery</h3>
                <p className="text-gray-600">Pay when you receive your order</p>
              </div>
              <div
                className={`border p-4 cursor-pointer rounded ${
                  paymentMethod === "online" ? "border-primary bg-primary/10" : "border-gray-300"
                }`}
                onClick={() => setPaymentMethod("online")}
              >
                <h3 className="font-medium">Online Payment</h3>
                <p className="text-gray-600">Pay securely with your credit/debit card</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div className="lg:w-1/2">
          <div className="border border-gray-300 p-6 rounded">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.product.images[0] || "/placeholder-product.png"}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover border rounded"
                    />
                    <div>
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹50.00</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>₹{(calculateSubtotal() * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-bold text-lg">
                <span>Total</span>
                <span>
                  ₹{(calculateSubtotal() + 50 + calculateSubtotal() * 0.05).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              className={`w-full mt-6 py-3 text-white font-medium rounded ${
                !selectedAddress || !paymentMethod
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark"
              }`}
              disabled={!selectedAddress || !paymentMethod}
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
