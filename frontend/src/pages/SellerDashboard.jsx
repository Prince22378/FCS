import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import "../styles/SellerDashboard.css";

const SellerDashboard = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        pendingOrders: 0,
        completedOrders: 0,
        balance: 0
    });
    const [listings, setListings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [listingsRes, ordersRes, statsRes] = await Promise.all([
                    api.get('/api/seller/listings/'),
                    api.get('/api/seller/orders/'),
                    api.get('/api/seller/stats/')
                ]);

                setListings(listingsRes.data.listings);
                setOrders(ordersRes.data.orders);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* 1️⃣ Overview Section */}
            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">📊 Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <StatCard title="Total Sales" value={`₹${stats.totalSales.toLocaleString()}`} />
                    <StatCard title="Pending Orders" value={stats.pendingOrders} />
                    <StatCard title="Available Balance" value={`₹${stats.balance.toLocaleString()}`} />
                </div>
                <div className="flex space-x-4">
                    <Link to="/seller/listings/create" className="btn-primary">
                        ➕ Add Product
                    </Link>
                    <Link to="/seller/orders" className="btn-secondary">
                        📦 View Orders
                    </Link>
                    <button className="btn-success">💰 Withdraw Earnings</button>
                </div>
            </section>

            {/* 2️⃣ Recent Orders */}
            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">📦 Recent Orders</h2>
                <OrdersTable orders={orders.slice(0, 5)} />
                <Link to="/seller/orders" className="text-blue-600 hover:underline mt-2 block">
                    View all orders →
                </Link>
            </section>

            {/* 3️⃣ Product Management */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">🛍️ Your Products</h2>
                    <Link to="/seller/listings" className="text-blue-600 hover:underline">
                        Manage All →
                    </Link>
                </div>
                <ListingsGrid listings={listings.slice(0, 4)} />
            </section>
        </div>
    );
};

// Helper components
const StatCard = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

const OrdersTable = ({ orders }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
                <tr>
                    <th className="py-2 px-4 text-left">Order ID</th>
                    <th className="py-2 px-4 text-left">Buyer</th>
                    <th className="py-2 px-4 text-left">Date</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                </tr>
            </thead>
            <tbody>
                {orders.map(order => (
                    <tr key={order.id} className="border-b">
                        <td className="py-3 px-4">#{order.id}</td>
                        <td className="py-3 px-4">{order.buyer_name}</td>
                        <td className="py-3 px-4">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.status}
                            </span>
                        </td>
                        <td className="py-3 px-4">
                            <button className="text-blue-600 hover:underline mr-2">
                                View
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ListingsGrid = ({ listings }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.map(listing => (
            <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
                <img
                    src={listing.thumbnail || '/default-listing.jpg'}
                    alt={listing.title}
                    className="w-full h-40 object-cover"
                />
                <div className="p-4">
                    <h3 className="font-bold truncate">{listing.title}</h3>
                    <p className="text-gray-600">₹{listing.price}</p>
                    <div className="flex justify-between mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${listing.status === 'active' ? 'bg-green-100 text-green-800' :
                            listing.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {listing.status}
                        </span>
                        <Link
                            to={`/seller/listings/edit/${listing.id}`}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            Edit
                        </Link>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export default SellerDashboard;