'use client';
import { useEffect, useState } from 'react';
import { Truck, Check, Clock, X, ArrowLeft, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Order, OrderStatus } from '@/utils/types';

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Unauthorized - Please login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch orders');

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED': return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold text-red-500 mb-2">Error Loading Orders</h2>
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            <div className="flex justify-center space-x-2">
              <Link
                href="/"
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Home
              </Link>
              {error.includes('Unauthorized') && (
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 flex items-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Orders</h1>
        <Link
          href="/products"
          className="text-primary hover:text-primary/80 flex items-center"
        >
          Shop More <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Truck className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <h3 className="text-md font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">Your order history will appear here</p>
          <Link
            href="/products"
            className="mt-3 inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
           
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-primary/30 transition-colors">
                <div className="p-4 flex justify-between items-center border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.toLowerCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                </div>
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block group"
                >

                  <div className='flex items-center gap-1'>
                    <p className='text-gray-400 hover:text-primary '>
                  
                      Track order or View details
                    </p>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                  </div>
                </Link>
                </div>

                <div className="px-3 py-2 flex items-center gap-4">
                  <div className="flex w-16">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-sm border border-gray-200">
                        <img
                          src={item.product.images[0] || '/placeholder-product.png'}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className=" font-medium text-gray-900 truncate">
                      {order.items[0]?.product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ₹{order.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
        // </Link>
      ))}
    </div>
  )
}
    </div >
  );
}