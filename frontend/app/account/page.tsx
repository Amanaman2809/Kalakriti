"use client";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Trash2,
  Star,
  Plus,
  Save,
  X,
  Home,
  Building,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  address: Address[];
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormData {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

export default function AccountSetting() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [addressForm, setAddressForm] = useState<AddressFormData>({
    street: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    phone: "",
  });

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: "",
    email: "",
    phone: "",
  });

  // Your existing functions here (fetchUserData, fetchAddresses, etc.)
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch user data");

      const data = await response.json();
      setUser(data.user);
      setProfileForm({
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch addresses");

      const data = await response.json();
      if (data.success && user) {
        setUser({ ...user, address: data.data });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch addresses");
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const resetAddressForm = () => {
    setAddressForm({
      street: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
      phone: "",
    });
    setEditingAddressId(null);
    setIsAddingAddress(false);
    setError("");
    setSuccessMessage("");
  };

  const resetProfileForm = () => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
    setIsEditingProfile(false);
    setError("");
    setSuccessMessage("");
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/edit-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to update profile");

      setSuccessMessage("Profile updated successfully!");
      setIsEditingProfile(false);
      fetchUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProcessing(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to add address");

      setSuccessMessage("Address added successfully!");
      resetAddressForm();
      fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add address");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddressId) return;

    setProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/addresses/${editingAddressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to update address");

      setSuccessMessage("Address updated successfully!");
      resetAddressForm();
      fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update address");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/addresses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete address");

      setSuccessMessage("Address deleted successfully!");
      fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/addresses/${id}/set-default`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to set default address");

      setSuccessMessage("Default address updated successfully!");
      fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default address");
    }
  };

  const startEditingAddress = (address: Address) => {
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      phone: address.phone,
    });
    setEditingAddressId(address.id);
    setIsAddingAddress(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gray-700">No user data found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 px-8 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Account Settings</h1>
                <p className="text-white/80">Manage your profile and addresses</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              {successMessage}
            </div>
          )}

          <div className="p-8 space-y-10">
            {/* Profile Information */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  Personal Information
                </h2>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={resetProfileForm}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          name="name"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          required
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          name="email"
                          type="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          required
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        required
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Full Name", value: user.name, icon: User },
                    { label: "Email Address", value: user.email, icon: Mail },
                    { label: "Phone Number", value: user.phone, icon: Phone },
                    { label: "Account Role", value: user.role, icon: User },
                  ].map((field, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3 mb-2">
                        <field.icon className="w-4 h-4 text-gray-600" />
                        <label className="text-sm font-medium text-gray-700">{field.label}</label>
                      </div>
                      <p className="text-gray-900 font-medium">{field.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Address Management */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  Addresses
                </h2>
                <button
                  onClick={() => {
                    resetAddressForm();
                    setIsAddingAddress(true);
                  }}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </button>
              </div>

              {/* Add/Edit Address Form */}
              {(isAddingAddress || editingAddressId) && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6">
                  <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                    {editingAddressId ? (
                      <>
                        <Edit3 className="w-5 h-5" />
                        Edit Address
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add New Address
                      </>
                    )}
                  </h3>

                  <form
                    onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address
                        </label>
                        <div className="relative">
                          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            name="street"
                            value={addressForm.street}
                            onChange={handleAddressChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            required
                            placeholder="Enter street address"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            name="city"
                            value={addressForm.city}
                            onChange={handleAddressChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            required
                            placeholder="Enter city"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State/Province
                        </label>
                        <input
                          name="state"
                          value={addressForm.state}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          required
                          placeholder="Enter state"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          name="country"
                          value={addressForm.country}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          required
                          placeholder="Enter country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postal Code
                        </label>
                        <input
                          name="postalCode"
                          value={addressForm.postalCode}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          required
                          placeholder="Enter postal code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            name="phone"
                            value={addressForm.phone}
                            onChange={handleAddressChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            required
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {editingAddressId ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {editingAddressId ? "Update Address" : "Add Address"}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Address List */}
              <div className="space-y-4">
                {user.address && user.address.length > 0 ? (
                  user.address.map((address) => (
                    <div
                      key={address.id}
                      className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {address.isDefault && (
                              <span className="inline-flex items-center px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Default
                              </span>
                            )}
                            <h4 className="text-lg font-semibold text-text">
                              {address.street}
                            </h4>
                          </div>

                          <div className="text-gray-600 space-y-1">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              {address.city}, {address.state} {address.postalCode}
                            </p>
                            <p className="flex items-center gap-2">
                              <Building className="w-4 h-4 flex-shrink-0" />
                              {address.country}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              {address.phone}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Added: {new Date(address.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-6">
                          {!address.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Set as default"
                            >
                              <Star className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => startEditingAddress(address)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit address"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete address"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No addresses saved</h3>
                    <p className="text-gray-500 mb-4">Add your first address to get started</p>
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Add your first address
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
