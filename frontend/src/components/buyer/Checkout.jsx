import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/Checkout.css';
import axios from 'axios';


const Checkout = () => {
    const location = useLocation();
    const totalAmount = location.state?.totalAmount ?? 0;  // ✅ safely extract it
    const [upiId, setUpiId] = useState('');
    const [address, setAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: ''
    });
    const [step, setStep] = useState(1); // 1: Address/UPI, 2: OTP Verification
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
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
            // Send request to backend to send OTP
            // await axios.post('http://localhost:8000/api/send-payment-otp/', {
            //     upiId,
            //     email: address.email
            //   });
              
            await axios.post('http://localhost:8000/api/send-payment-otp/', {
                upiId,
                email: address.email
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                setOtpSent(true);
                setStep(2);
            } else {
                setError("Failed to send OTP. Please try again.");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        setError('');

        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('/api/verify-payment-otp/', {
                otp,
                email: address.email // You might want to add email to address state
            });

            if (response.data.verified) {
                // Proceed with payment confirmation
                const paymentResponse = await axios.post('/api/confirm-payment/', {
                    upiId,
                    amount: totalAmount,
                    address
                });

                if (paymentResponse.data.success) {
                    alert('Payment successful! Your order has been placed.');
                    // Redirect to order confirmation page
                } else {
                    setError("Payment failed. Please try again.");
                }
            } else {
                setError("Invalid OTP. Please try again.");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Verification failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        setError('');
        try {
            setLoading(true);
            const response = await axios.post('/api/send-payment-otp/', {
                upiId,
                email: address.email
            });

            if (response.data.success) {
                setOtpSent(true);
                alert('New OTP has been sent to your email.');
            } else {
                setError("Failed to resend OTP. Please try again.");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to resend OTP. Please try again.");
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
                {step === 1 ? (
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
                                value={address.email || ''}
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
                                {loading ? 'Sending OTP...' : 'Verify Payment'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="otp-verification">
                        <h3>OTP Verification</h3>
                        <p>We've sent a 6-digit OTP to your email address.</p>
                        <form onSubmit={verifyOtp}>
                            <input
                                type="text"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength="6"
                                required
                            />
                            <div className="otp-actions">
                                <button type="submit" className="verify-otp-btn" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                <button type="button" className="resend-otp-btn" onClick={resendOtp} disabled={loading}>
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Checkout;