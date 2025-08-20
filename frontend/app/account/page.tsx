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
  Navigation,
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
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
  });
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: "",
    email: "",
    phone: "",
  });

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch user data");

      const data = await response.json();
      setUser(data.user);
      // Initialize profile form with user data
      setProfileForm({
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/addresses", {
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
      setError(
        err instanceof Error ? err.message : "Failed to fetch addresses",
      );
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  // Handle address form changes
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  // Reset address form
  const resetAddressForm = () => {
    setAddressForm({
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
    });
    setEditingAddressId(null);
    setIsAddingAddress(false);
  };

  // Reset profile form to original values
  const resetProfileForm = () => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
    setIsEditingProfile(false);
  };

  // Update profile
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/auth/edit-profile",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileForm),
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to update profile");

      setSuccessMessage("Profile updated successfully!");
      setIsEditingProfile(false);
      fetchUserData(); // Refresh user data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  // Add new address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/addresses", {
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
      fetchAddresses(); // Refresh addresses
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add address");
    }
  };

  // Update address
  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddressId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/addresses/${editingAddressId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(addressForm),
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to update address");

      setSuccessMessage("Address updated successfully!");
      resetAddressForm();
      fetchAddresses(); // Refresh addresses
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update address");
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/addresses/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to delete address");

      setSuccessMessage("Address deleted successfully!");
      fetchAddresses(); // Refresh addresses
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    }
  };

  // Set default address
  const handleSetDefaultAddress = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/addresses/${id}/set-default`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to set default address");

      setSuccessMessage("Default address updated successfully!");
      fetchAddresses(); // Refresh addresses
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set default address",
      );
    }
  };

  // Start editing an address
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-700">No user data found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Account Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your profile information and addresses
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mx-6 mt-6 p-4 bg-green-50 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          <div className="p-6 space-y-8">
            {/* Profile Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h2>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center px-3 py-1 text-primary hover:text-secondary font-medium"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={resetProfileForm}
                    className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user.name}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user.phone}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Address Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Addresses
                </h2>
                <button
                  onClick={() => {
                    resetAddressForm();
                    setIsAddingAddress(true);
                  }}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:text-primary hover:bg-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </button>
              </div>

              {/* Add/Edit Address Form */}
              {(isAddingAddress || editingAddressId) && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-4">
                    {editingAddressId ? "Edit Address" : "Add New Address"}
                  </h3>

                  <form
                    onSubmit={
                      editingAddressId ? handleUpdateAddress : handleAddAddress
                    }
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                        </label>
                        <input
                          name="street"
                          value={addressForm.street}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          name="city"
                          value={addressForm.city}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          name="state"
                          value={addressForm.state}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          name="country"
                          value={addressForm.country}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          name="postalCode"
                          value={addressForm.postalCode}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          name="phone"
                          value={addressForm.phone}
                          onChange={handleAddressChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary hvoer:text-primary flex items-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {editingAddressId ? "Update Address" : "Add Address"}
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
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {address.isDefault ? (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-primary text-xs font-medium rounded-full mr-2">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Default
                              </span>
                            ) : null}
                            <h4 className="text-md font-medium text-gray-900">
                              {address.street}, {address.city}
                            </h4>
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{address.street}</p>
                            <p>
                              {address.city}, {address.state}{" "}
                              {address.postalCode}
                            </p>
                            <p>{address.country}</p>
                            <p className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {address.phone}
                            </p>
                            <p className="text-xs text-gray-500">
                              Added:{" "}
                              {new Date(address.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          {!address.isDefault && (
                            <button
                              onClick={() =>
                                handleSetDefaultAddress(address.id)
                              }
                              className="p-2 text-primary hover:bg-blue-50 rounded-full"
                              title="Set as default"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startEditingAddress(address)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                            title="Edit address"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                            title="Delete address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No addresses saved yet</p>
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="mt-4 text-primary hover:text-primary hover:bg-secondary font-medium"
                    >
                      Add your first address
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
