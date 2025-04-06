import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import '../styles/SellerOrders.css';

const SellerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/api/seller/orders/');
                setOrders(response.data.orders);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(order => order.status === filter);

    const updateOrderStatus = async (orderId, status) => {
        try {
            await api.put(`/api/seller/orders/${orderId}`, { status });
            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status } : order
            ));
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'completed': return 'status-completed';
            case 'shipped': return 'status-shipped';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    return (
        <div className="seller-orders">
            <h1>Your Orders</h1>

            <div className="filter-buttons">
                <button
                    onClick={() => setFilter('all')}
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('shipped')}
                    className={`filter-btn ${filter === 'shipped' ? 'active' : ''}`}
                >
                    Shipped
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                >
                    Completed
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading orders...</div>
            ) : (
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>{order.buyer_name}</td>
                                    <td>₹{order.total_amount}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/seller/orders/${order.id}`} className="view-link">
                                            View
                                        </Link>
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'shipped')}
                                                className="status-action"
                                            >
                                                Ship Order
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SellerOrders;