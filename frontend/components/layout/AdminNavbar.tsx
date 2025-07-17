"use client";
import {
    CircleUser,
    LayoutDashboard,
    Package,
    ShoppingCart,
    Menu,
    X,
    LogOut,
    Settings,
    Users,
    LineChart,
    User
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function AdminNavbar() {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<any>(null);
    // Close profile menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
            setIsProfileMenuOpen(false);
        }
    };

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData) {
            router.push("/admin/login");
        } else {
            setUser(JSON.parse(userData));
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
    };

    return (
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
                                Kalakriti Admin
                            </span>
                        </Link>
                    </div>


                    {/* User Profile */}
                    <div className="flex items-center">
                        <p className=" mr-2">{user?.name}</p>
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary focus:outline-none"
                            >
                                <CircleUser className="h-5 w-5" />
                            </button>

                            {isProfileMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white focus:outline-none z-50">
                                    <div className="py-1">
                                        <div className="px-4 py-2 text-sm text-gray-700 flex items-center">
                                            <User className="h-4 w-4 mr-2"/>
                                            Edit Profile
                                        </div>
                                        <div className="px-4 py-2 text-sm text-gray-700 border-gray-200 border-b flex items-center">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Account Setting
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
    );
}