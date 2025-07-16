"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    LogOut,
    ChevronUp,
    ChevronDown,
    Menu,
    Eye,
    EyeOff,
    Plus
} from "lucide-react";

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData) {
            router.push("/admin/login");
        } else {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
    };

    // Mock data for dashboard
    const dashboardStats = [
        { title: "Total Sales", value: "$24,560", change: "+12%", trend: "up" },
        { title: "New Orders", value: "142", change: "+5%", trend: "up" },
        { title: "Low Stock", value: "8 Items", change: "Attention", trend: "down" },
    ];

    const recentOrders = [
        { id: "#ORD-001", customer: "John Doe", amount: "$120", status: "Pending" },
        { id: "#ORD-002", customer: "Jane Smith", amount: "$85", status: "Shipped" },
        { id: "#ORD-003", customer: "Robert Johnson", amount: "$220", status: "Delivered" },
    ];

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="h-screen bg-gray-50 overflow-hidden flex">
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white"
            >
                <Menu className="h-6 w-6" />
            </button>

            <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
                <nav className="p-4 mt-20 space-y-2">
                    <button
                        onClick={() => {
                            setActiveTab("dashboard");
                            setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${activeTab === "dashboard" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        <span>Dashboard</span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("products");
                            setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${activeTab === "products" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                        <Package className="h-5 w-5" />
                        <span>Products</span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("orders");
                            setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${activeTab === "orders" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                        <ShoppingCart className="h-5 w-5" />
                        <span>Orders</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 text-gray-700 hover:bg-red-50 hover:text-red-600 mt-8 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-0 md:ml-64 overflow-y-auto">
                <div className="p-6 md:p-8">
                    {activeTab === "dashboard" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {dashboardStats.map((stat, index) => (
                                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                                        <p className="text-2xl font-bold mt-2 text-gray-800">{stat.value}</p>
                                        <div className={`mt-2 text-sm flex items-center ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                                            {stat.change}
                                            {stat.trend === "up" ? (
                                                <ChevronUp className="h-4 w-4 ml-1" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 ml-1" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Orders */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-800">Recent Orders</h3>
                                    <button
                                        onClick={() => setActiveTab("orders")}
                                        className="text-sm text-primary hover:underline flex items-center"
                                    >
                                        View All
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentOrders.map((order, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.status === "Pending" ? "bg-yellow-100 text-yellow-800" : order.status === "Shipped" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-primary hover:underline cursor-pointer">
                                                        View
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "products" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
                                <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center space-x-2 transition-colors">
                                    <Plus className="h-4 w-4" />
                                    <span>Add New Product</span>
                                </button>
                            </div>

                            {/* Product list would go here */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-gray-600">Product list and management interface would be here</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "orders" && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>

                            {/* Order list would go here */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <p className="text-gray-600">Complete order management interface would be here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}