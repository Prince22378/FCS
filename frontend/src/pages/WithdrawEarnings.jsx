import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/WithdrawEarnings.css';

const WithdrawEarnings = () => {
    const [balance, setBalance] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await api.get('/api/seller/stats/');
                setBalance(response.data.balance);
            } catch (error) {
                console.error('Error fetching balance:', error);
                setError('Failed to load balance information');
            } finally {
                setLoading(false);
            }
        };
        fetchBalance();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (parseFloat(withdrawAmount) > balance) {
            setError('Amount exceeds available balance');
            return;
        }

        try {
            await api.post('/api/seller/withdraw/', {
                amount: parseFloat(withdrawAmount),
                payment_method: paymentMethod
            });
            setSuccess(`Withdrawal request for ₹${withdrawAmount} submitted successfully`);
            setError('');
            setWithdrawAmount('');
            // Refresh balance
            const response = await api.get('/api/seller/stats/');
            setBalance(response.data.balance);
        } catch (error) {
            console.error('Error submitting withdrawal:', error);
            setError('Failed to submit withdrawal request');
            setSuccess('');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold mb-6">Withdraw Earnings</h1>
                
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 className="text-lg font-semibold mb-4">Available Balance</h2>
                    <p className="text-3xl font-bold mb-6">₹{balance.toLocaleString()}</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2">Amount to Withdraw (₹)</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full p-2 border rounded"
                                min="0.01"
                                step="0.01"
                                max={balance}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="upi">UPI</option>
                                <option value="paypal">PayPal</option>
                            </select>
                        </div>

                        {error && <div className="error-message mb-4">{error}</div>}
                        {success && <div className="success-message mb-4">{success}</div>}

                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                        >
                            Request Withdrawal
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Recent Withdrawals</h2>
                    <p className="text-gray-500">No recent withdrawals</p>
                </div>
            </div>
        </div>
    );
};

export default WithdrawEarnings;