import React, { useState } from 'react';
import './Cart.css';

const Cart = ({ cartItems, updateQuantity, removeItem }) => {
    const [coupon, setCoupon] = useState('');
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 1000 ? 0 : 50;
    const total = subtotal + shipping;

    return (
        <div className="cart-container">
            <h2>Your Cart</h2>
            {cartItems.length === 0 ? (
                <p className="empty-cart">Your cart is empty.</p>
            ) : (
                <>
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image} alt={item.name} />
                                <div className="item-details">
                                    <h3>{item.name}</h3>
                                    <p>₹{item.price}</p>
                                    <div className="quantity-controls">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                            −
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                                            +
                                        </button>
                                    </div>
                                    <button onClick={() => removeItem(item.id)} className="remove-btn">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                        <div className="coupon-section">
                            <input
                                type="text"
                                placeholder="Enter coupon code"
                                value={coupon}
                                onChange={(e) => setCoupon(e.target.value)}
                            />
                            <button>Apply</button>
                        </div>
                        <div className="totals">
                            <p>Subtotal: <span>₹{subtotal}</span></p>
                            <p>Shipping: <span>₹{shipping}</span></p>
                            <p className="total">Total: <span>₹{total}</span></p>
                        </div>
                        <button className="checkout-btn">Proceed to Checkout</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;