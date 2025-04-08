import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/Checkout.css';
import axios from 'axios';


const Checkout = () => {
    const location = useLocation();
    const { totalAmount = 0, sellerUsername = '' } = location.state || {};

    const [upiId, setUpiId] = useState('');
    const [address, setAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!upiId) {
            setError("Please enter your UPI ID.");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('https://192.168.2.245/api/process-payment/', {
                upiId,
                amount: totalAmount,
                address,
                sellerUsername,  // ✅ Send sellerUsername here
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`
                  }
            });

            if (response.data.success) {
                alert('Payment successful! Your order has been placed.');
                // Optional: Redirect to order confirmation
                // navigate('/order-confirmation');
            } else {
                setError("Payment failed. Please try again.");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Payment processing failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="checkout-container">
            <h2>Checkout</h2>
            <div className="total-amount">
                <h3>Total Amount: ₹{typeof totalAmount === 'number' ? totalAmount.toFixed(2) : '0.00'}</h3>
            </div>

            {error && <div className="error-message">{error}</div>}

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
                        <input
                            type="email"
                            placeholder="Email"
                            value={address.email}
                            onChange={(e) => setAddress({ ...address, email: e.target.value })}
                            required
                        />
                        <h3>UPI Payment</h3>
                        <input
                            type="text"
                            placeholder="Enter UPI ID"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            required
                        />
                        <button type="submit" className="place-order-btn" disabled={loading}>
                            {loading ? 'Processing Payment...' : 'Place Order & Pay'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
