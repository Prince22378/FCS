import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import '../../styles/RecentOrders.css';

const RecentOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentOrders = async () => {
            try {
                const response = await api.get('/api/buyer/orders/recent');
                setOrders(response.data.orders);
            } catch (error) {
                console.error('Error fetching recent orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentOrders();
    }, []);

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'status-delivered';
            case 'shipped': return 'status-shipped';
            case 'processing': return 'status-processing';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    return (
        <div className="recent-orders">
            <h2>Recent Orders</h2>
            {loading ? (
                <div className="loading">Loading your recent orders...</div>
            ) : (
                <>
                    {orders.length === 0 ? (
                        <div className="no-orders">
                            <p>You haven't placed any orders yet.</p>
                            <Link to="/products" className="shop-btn">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="orders-table-container">
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Product</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td>#{order.id}</td>
                                            <td>
                                                <div className="product-info">
                                                    <img src={order.product.image} alt={order.product.name} className="product-image" />
                                                    <span>{order.product.name}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(order.date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <Link to={`/track-order/${order.id}`} className="action-btn track-btn">
                                                        Track
                                                    </Link>
                                                    {order.status.toLowerCase() === 'delivered' && (
                                                        <button className="action-btn return-btn">
                                                            Return
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RecentOrders;