import React, { useState } from 'react';
import axios from 'axios';

const PaymentMethods = () => {
  const [upiId, setUpiId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP to the user's email (using your Django backend)
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await axios.post('/api/send-payment-otp/', { upiId });
      setOtpSent(true);
      alert('OTP sent to your registered email!');
    } catch (error) {
      alert('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and process payment
  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/verify-payment-otp/', { upiId, otp });
      if (response.data.success) {
        setPaymentSuccess(true);
        // Optional: Trigger order confirmation API
        await axios.post('/api/confirm-payment/', { upiId });
      } else {
        alert('Invalid OTP!');
      }
    } catch (error) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-methods">
      <h2>UPI Payment</h2>
      {!paymentSuccess ? (
        <>
          <input
            type="text"
            placeholder="Enter UPI ID (e.g., 9876543210@ybl)"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            disabled={otpSent}
          />
          {!otpSent ? (
            <button onClick={handleSendOtp} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Processing...' : 'Verify & Pay'}
              </button>
            </>
          )}
        </>
      ) : (
        <div className="success-message">
          Payment Successful! Order confirmed.
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;