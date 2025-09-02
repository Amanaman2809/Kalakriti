"use client";
import { CircleUser, Menu, X, LogOut, Settings, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import EditProfileModal from "@/pages/EditProfile";

interface User {
  name: string;
  email: string;
  phone: string;
}

export default function AdminNavbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Close profile menu when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (
      profileMenuRef.current &&
      !profileMenuRef.current.contains(event.target as Node)
    ) {
      setIsProfileMenuOpen(false);
    }
  };

  // Fetch user data from API
  const fetchUserData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        localStorage.setItem("user_details", JSON.stringify(userData.user));
      } else if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user_details");
        router.push("/admin/login");
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have user data in localStorage first
    const storedUser = localStorage.getItem("user_details");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
    } else {
      // If not, fetch from API
      fetchUserData();
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_details");
    router.push("/admin/login");
  };

  const handleProfileUpdate = (updatedData: any) => {
    // Update the user data in state and localStorage
    setUser(updatedData);
    localStorage.setItem("user_details", JSON.stringify(updatedData));
  };

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center">
                <Image
                  src="/logo_sm.png"
                  width={40}
                  height={40}
                  alt="Admin Logo"
                  className="h-8 w-8"
                />
                <span className="ml-2 text-lg font-bold text-gray-800 hidden sm:inline">
                  Chalava Admin
                </span>
              </Link>
            </div>
            <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button and logo */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mr-4 text-gray-500 hover:text-primary focus:outline-none md:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              <Link href="/admin" className="flex items-center">
                <Image
                  src="/logo_sm.png"
                  width={40}
                  height={40}
                  alt="Admin Logo"
                  className="h-8 w-8"
                />
                <span className="ml-2 text-lg font-bold text-gray-800 hidden sm:inline">
                  Chalava Admin
                </span>
              </Link>
            </div>

            {/* User Profile */}
            <div className="flex items-center">
              <p className="mr-2 text-sm text-gray-700 hidden sm:block">
                {user?.name}
              </p>
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary focus:outline-none"
                >
                  <CircleUser className="h-5 w-5" />
                </button>

                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white focus:outline-none z-50 border border-gray-200">
                    <div className="py-1">
                      <div
                        className="px-4 py-2 text-sm text-gray-700 flex items-center cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </div>
                      <div className="px-4 py-2 text-sm text-gray-700 border-gray-200 border-b flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Account Settings
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userData={user || { name: "", email: "", phone: "" }}
        onUpdate={handleProfileUpdate}
      />
    </>
  );
}
