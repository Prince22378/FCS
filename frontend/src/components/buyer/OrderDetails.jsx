import React from 'react';
import './OrderDetails.css';

const OrderDetails = ({ order }) => {
    return (
        <div className="order-details-container">
            <h2>Order #{order.id}</h2>
            <div className="order-status">
                <p>Status: <span className={`status-${order.status.toLowerCase()}`}>{order.status}</span></p>
                <p>Date: {new Date(order.date).toLocaleDateString()}</p>
            </div>
            <div className="order-grid">
                <div className="order-items">
                    <h3>Items</h3>
                    {order.items.map((item) => (
                        <div key={item.id} className="order-item">
                            <img src={item.image} alt={item.name} />
                            <div className="item-info">
                                <h4>{item.name}</h4>
                                <p>₹{item.price} x {item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="order-summary">
                    <h3>Summary</h3>
                    <div className="summary-row">
                        <p>Subtotal:</p>
                        <p>₹{order.subtotal}</p>
                    </div>
                    <div className="summary-row">
                        <p>Shipping:</p>
                        <p>₹{order.shipping}</p>
                    </div>
                    <div className="summary-row total">
                        <p>Total:</p>
                        <p>₹{order.total}</p>
                    </div>
                    <div className="shipping-address">
                        <h3>Shipping Address</h3>
                        <p>{order.address.fullName}</p>
                        <p>{order.address.street}</p>
                        <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
                        <p>Phone: {order.address.phone}</p>
                    </div>
                    <button className="track-order-btn">Track Order</button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;