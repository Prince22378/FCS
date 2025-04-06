import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import '../../styles/TrackOrder.css';

const TrackOrder = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/api/buyer/orders/${orderId || 'latest'}`);
        setOrder(response.data.order);
      } catch (err) {
        setError('Failed to load order details');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const getStatusIndex = (status) => {
    const statusFlow = ['ordered', 'processed', 'shipped', 'out-for-delivery', 'delivered'];
    return statusFlow.indexOf(status.toLowerCase());
  };

  return (
    <div className="track-order">
      <h2>Track Your Order</h2>
      
      {loading ? (
        <div className="loading">Loading order details...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : order ? (
        <div className="tracking-container">
          <div className="order-summary">
            <div className="summary-item">
              <span className="summary-label">Order ID</span>
              <span className="summary-value">#{order.id}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Estimated Delivery</span>
              <span className="summary-value">
                {new Date(order.estimatedDelivery).toLocaleDateString()}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Shipping To</span>
              <span className="summary-value">
                {order.shippingAddress.line1}, {order.shippingAddress.city}
              </span>
            </div>
          </div>

          <div className="timeline-container">
            <div className="timeline">
              {['Ordered', 'Processed', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, index) => (
                <div 
                  key={step} 
                  className={`timeline-step ${index <= getStatusIndex(order.status) ? 'completed' : ''}`}
                >
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>{step}</h4>
                    {index <= getStatusIndex(order.status) && (
                      <p className="timeline-date">
                        {order.statusUpdates[step.toLowerCase().replace(/ /g, '-')] || 
                         (index === 0 ? new Date(order.date).toLocaleString() : '')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-details">
            <h3>Order Details</h3>
            <div className="products-list">
              {order.products.map(product => (
                <div key={product.id} className="product-item">
                  <img src={product.image} alt={product.name} className="product-image" />
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p>Quantity: {product.quantity}</p>
                    <p>Price: ₹{product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-order">
          <p>No order found to track</p>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;