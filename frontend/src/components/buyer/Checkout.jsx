import React, { useState } from 'react';
import './Checkout.css';

const Checkout = () => {
    const [paymentMethod, setPaymentMethod] = useState('upi');
    const [address, setAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Order placed successfully!');
    };

    return (
        <div className="checkout-container">
            <h2>Checkout</h2>
            <div className="checkout-grid">
                <div className="shipping-address">
                    <h3>Shipping Address</h3>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={address.fullName}
                            onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Street Address"
                            value={address.street}
                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                            required
                        />
                        <div className="address-row">
                            <input
                                type="text"
                                placeholder="City"
                                value={address.city}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={address.state}
                                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                required
                            />
                        </div>
                        <div className="address-row">
                            <input
                                type="text"
                                placeholder="ZIP Code"
                                value={address.zip}
                                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Phone"
                                value={address.phone}
                                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                required
                            />
                        </div>
                    </form>
                </div>
                <div className="payment-method">
                    <h3>Payment Method</h3>
                    <div className="payment-options">
                        <label>
                            <input
                                type="radio"
                                name="payment"
                                value="upi"
                                checked={paymentMethod === 'upi'}
                                onChange={() => setPaymentMethod('upi')}
                            />
                            UPI
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="payment"
                                value="card"
                                checked={paymentMethod === 'card'}
                                onChange={() => setPaymentMethod('card')}
                            />
                            Credit/Debit Card
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="payment"
                                value="cod"
                                checked={paymentMethod === 'cod'}
                                onChange={() => setPaymentMethod('cod')}
                            />
                            Cash on Delivery
                        </label>
                    </div>
                    {paymentMethod === 'upi' && (
                        <div className="upi-details">
                            <input type="text" placeholder="Enter UPI ID" />
                        </div>
                    )}
                    {paymentMethod === 'card' && (
                        <div className="card-details">
                            <input type="text" placeholder="Card Number" />
                            <div className="card-row">
                                <input type="text" placeholder="MM/YY" />
                                <input type="text" placeholder="CVV" />
                            </div>
                        </div>
                    )}
                    <button className="place-order-btn" onClick={handleSubmit}>
                        Place Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;