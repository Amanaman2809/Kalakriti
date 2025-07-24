import { ChevronUp, ChevronDown } from 'lucide-react';

export default function AdminDashboard() {
    // Mock data for dashboard
    const dashboardStats = [
        { title: 'Total Sales', value: '$24,560', change: '+12%', trend: 'up' },
        { title: 'New Orders', value: '142', change: '+5%', trend: 'up' },
        { title: 'Low Stock', value: '8 Items', change: 'Attention', trend: 'down' },
    ];

    const recentOrders = [
        { id: '#ORD-001', customer: 'John Doe', amount: '$120', status: 'Pending' },
        { id: '#ORD-002', customer: 'Jane Smith', amount: '$85', status: 'Shipped' },
        { id: '#ORD-003', customer: 'Robert Johnson', amount: '$220', status: 'Delivered' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardStats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                        <p className="text-2xl font-bold mt-2 text-gray-800">{stat.value}</p>
                        <div
                            className={`mt-2 text-sm flex items-center ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                }`}
                        >
                            {stat.change}
                            {stat.trend === 'up' ? (
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
                    <a
                        href="/admin/orders"
                        className="text-sm text-primary hover:underline flex items-center"
                    >
                        View All
                    </a>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentOrders.map((order, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {order.id}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.customer}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.amount}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full font-medium ${order.status === 'Pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : order.status === 'Shipped'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}
                                        >
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
    );
}