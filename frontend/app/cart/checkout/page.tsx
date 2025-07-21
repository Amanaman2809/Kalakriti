"use client";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CartItem, Address } from "@/utils/types";
import { fetchCartItems } from "@/utils/product";
import { getAddresses, addAddress, deleteAddress, updateAddress } from "@/utils/address";
import { AddressInput } from "@/utils/address";
import { Loader2, ChevronRight, X, Check, Edit, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

const url = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!url) throw new Error("API base URL is not set");

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online" | null>(null);
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
    country: "",
    postalCode: "",
    phone: "",
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartData, addressData] = await Promise.all([
          fetchCartItems(),
          getAddresses()
        ]);
        setCartItems(cartData);
        setAddresses(addressData);
        if (addressData.length > 0) {
          console.log(addressData);
          setSelectedAddress(addressData[0].id);
        } else {
          setAddressForm({ show: true, mode: "add", editingId: null });
        }
      } catch (err: any) {
        setErrors(prev => ({
          ...prev,
          cart: err.message || "Failed to load cart",
          address: err.message || "Failed to load addresses"
        }));
        toast.error(err.message || "Failed to load data");
      } finally {
        setIsLoading(prev => ({
          ...prev,
          cart: false,
          address: false
        }));
      }
    };

    fetchData();
  }, []);

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  };

  const { subtotal, shipping, tax, total } = calculateTotals();

  // Handle address form input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAddressData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Prepare form for adding new address
  const handleAddNewAddress = () => {
    setAddressData({
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
    });
    setAddressForm({ show: true, mode: "add", editingId: null });
  };

  // Prepare form for editing address
  const handleEditAddress = (address: Address) => {
    setAddressData({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      phone: address.phone,
    });
    setAddressForm({ show: true, mode: "edit", editingId: address.id });
  };

  // Save address (add or edit)
  const handleSaveAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(prev => ({ ...prev, address: true }));
      setErrors(prev => ({ ...prev, address: null }));

      let updatedAddresses = [...addresses];
      let newSelectedAddress = selectedAddress;

      if (addressForm.mode === "add") {
        const added = await addAddress(addressData);
        updatedAddresses = [added, ...addresses];
        newSelectedAddress = added.id;
        toast.success("Address added successfully");
      } else if (addressForm.mode === "edit" && addressForm.editingId) {
        const updated = await updateAddress(addressForm.editingId, addressData);
        updatedAddresses = addresses.map(addr =>
          addr.id === addressForm.editingId ? updated : addr
        );
        toast.success("Address updated successfully");
      }

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
      setErrors(prev => ({
        ...prev,
        address: err.message || "Failed to delete address"
      }));
      toast.error(err.message || "Failed to delete address");
    } finally {
      setIsLoading(prev => ({ ...prev, address: false }));
    }
  };

  // Place order with better error handling
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const { orderId } = await response.json();
      toast.success("Order placed successfully!");
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

  // Loading state
  if (isLoading.cart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4">Loading your cart...</p>
      </div>
    );
  }

  // Error state
  if (errors.cart) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{errors.cart}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some products to your cart first</p>
          <Link
            href="/products"
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Address & Payment */}
        <div className="lg:w-1/2 space-y-6">
          {/* Shipping Address Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Shipping Address</h2>
              {!addressForm.show && (
                <button
                  onClick={handleAddNewAddress}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  {addresses.length > 0 ? "Add New" : "Add Address"}
                </button>
              )}
            </div>

            {errors.address && (
              <div className="mb-4 text-red-500 text-sm">{errors.address}</div>
            )}

            {addressForm.show ? (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Street</label>
                    <input
                      type="text"
                      name="street"
                      value={addressData.street}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={addressData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={addressData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={addressData.postalCode}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={addressData.country}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={addressData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isLoading.address}
                    className="flex-1 bg-primary text-white py-2 rounded-md hover:bg-primary/90 disabled:opacity-70"
                  >
                    {isLoading.address ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      addressForm.mode === "add" ? "Save Address" : "Update Address"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressForm({ show: false, mode: "add", editingId: null })}
                    className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : isLoading.address ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Please add a shipping address to continue
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(address => (
                  <div
                    key={address.id}
                    className={`border rounded-md p-4 cursor-pointer transition-colors ${selectedAddress === address.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => setSelectedAddress(address.id)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{address.street}</h3>
                        <p className="text-sm text-gray-600">
                          {address.city}, {address.state}, {address.country} - {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddress(address);
                          }}
                          className="text-gray-400 hover:text-blue-500"
                          title="Edit address"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {addresses.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(address.id);
                            }}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete address"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {selectedAddress === address.id && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-primary">
                        <Check className="h-4 w-4" />
                        <span>Selected</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Section */}
          {selectedAddress && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <div
                  className={`border rounded-md p-4 cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-primary bg-primary/10" : "border-gray-200 hover:border-gray-300"
                    }`}
                  onClick={() => setPaymentMethod("cod")}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${paymentMethod === "cod" ? "border-primary bg-primary" : "border-gray-300"
                      }`}>
                      {paymentMethod === "cod" && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-medium">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </div>
                  </div>
                </div>
                <div
                  className={`border rounded-md p-4 cursor-pointer transition-colors ${paymentMethod === "online" ? "border-primary bg-primary/10" : "border-gray-200 hover:border-gray-300"
                    }`}
                  onClick={() => setPaymentMethod("online")}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${paymentMethod === "online" ? "border-primary bg-primary" : "border-gray-300"
                      }`}>
                      {paymentMethod === "online" && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-medium">Online Payment</h3>
                      <p className="text-sm text-gray-600">Pay securely with your card</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md border overflow-hidden">
                      <img
                        src={item.product.images[0] || "/placeholder-product.png"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
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
                <span className="text-gray-600">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!selectedAddress || !paymentMethod || isLoading.placingOrder}
              className={`w-full mt-6 py-3 rounded-md font-medium flex items-center justify-center gap-2 ${!selectedAddress || !paymentMethod
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-primary hover:bg-primary/90 text-white"
                }`}
            >
              {isLoading.placingOrder ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {!selectedAddress ? "Add Address to Continue" : "Place Order"}
                  {selectedAddress && <ChevronRight className="h-5 w-5" />}
                </>
              )}
            </button>

            {errors.order && (
              <div className="mt-4 text-red-500 text-sm text-center">
                {errors.order}
              </div>
            )}

            <div className="mt-4 text-center text-sm text-gray-500">
              By placing your order, you agree to our Terms of Service
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}