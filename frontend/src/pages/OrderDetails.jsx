import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/OrderDetails.css';

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/api/seller/orders/${id}/`);
                setOrder(response.data);
            } catch (error) {
                console.error('Error fetching order:', error);
                navigate('/seller/orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, navigate]);

    const updateStatus = async (newStatus) => {
        try {
            await api.patch(`/api/seller/orders/${id}/`, { status: newStatus });
            setOrder({ ...order, status: newStatus });
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    if (loading) return <div className="loading">Loading order details...</div>;
    if (!order) return <div>Order not found</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Order Details #{order.id}</h1>
                    <button
                        onClick={() => navigate('/seller/orders')}
                        className="btn-secondary"
                    >
                        Back to Orders
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Order Information</h2>
                            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                            <p><strong>Status:</strong> 
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {order.status}
                                </span>
                            </p>
                            <p><strong>Total:</strong> ₹{order.price_at_purchase}</p>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Buyer Information</h2>
                            <p><strong>Name:</strong> {order.buyer_name}</p>
                            <p><strong>Contact:</strong> {order.buyer_email || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2">Product</h2>
                        <div className="flex items-center">
                            <img 
                                src={order.listing_thumbnail || '/default-listing.jpg'} 
                                alt={order.listing_title}
                                className="w-16 h-16 object-cover rounded mr-4"
                            />
                            <div>
                                <p className="font-medium">{order.listing_title}</p>
                                <p>₹{order.price_at_purchase}</p>
                            </div>
                        </div>
                    </div>

                    {order.status === 'pending' && (
                        <div className="flex space-x-4">
                            <button
                                onClick={() => updateStatus('completed')}
                                className="btn-success"
                            >
                                Mark as Completed
                            </button>
                            <button
                                onClick={() => updateStatus('cancelled')}
                                className="btn-danger"
                            >
                                Cancel Order
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;