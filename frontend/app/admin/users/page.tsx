"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Download,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    UserCheck,
    UserX,
    Calendar,
    Mail,
    Phone,
    Shield
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "USER" | "ADMIN";
    createdAt: string;
    updatedAt: string;
}
  
export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = async (showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            else setLoading(true);

            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            setUsers(data.users || data || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.phone && user.phone.includes(searchTerm));

        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        };
        return date.toLocaleDateString('en-GB', options);
    };
    // Export users data to CSV
    const exportToCSV = () => {
        if (filteredUsers.length === 0) {
            toast.error("No users to export");
            return;
        }

        const headers = ["Name", "Email", "Phone", "Role", "Created At", "Last Updated"];
        const csvContent = [
            headers.join(","),
            ...filteredUsers.map(user => [
                `"${user.name}"`,
                `"${user.email}"`,
                `"${user.phone || 'N/A'}"`,
                `"${user.role}"`,
                `"${new Date(user.createdAt).toLocaleDateString()}"`,
                `"${new Date(user.updatedAt).toLocaleDateString()}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Users data exported successfully");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Users Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage and view all registered users ({filteredUsers.length} total)
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchUsers(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search users by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as "ALL" | "USER" | "ADMIN")}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="USER">Users</option>
                            <option value="ADMIN">Admins</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">User</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Email</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Phone</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Role</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-900">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="break-all">{user.email}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        {user.phone ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {user.phone}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">Not provided</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.role === 'ADMIN'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            <Shield className="w-3 h-3" />
                                            {user.role}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-3 h-3 text-gray-400" />
                                            {formatDate(user.createdAt)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">No users found</p>
                        <p className="text-gray-500">
                            {searchTerm || roleFilter !== "ALL"
                                ? "Try adjusting your search or filter criteria"
                                : "No users have registered yet"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
