import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/WithdrawEarnings.css';

const WithdrawEarnings = () => {
    const [balance, setBalance] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankDetails, setBankDetails] = useState({
        account_number: '',
        ifsc_code: '',
        account_holder_name: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [balanceRes, bankRes] = await Promise.all([
                    api.get('/api/seller/balance'),
                    api.get('/api/seller/bank-details')
                ]);
                setBalance(balanceRes.data.balance);
                if (bankRes.data) {
                    setBankDetails(bankRes.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setMessage({ text: 'Error loading data', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBankDetailsChange = (e) => {
        const { name, value } = e.target;
        setBankDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitBankDetails = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/seller/bank-details', bankDetails);
            setMessage({ text: 'Bank details saved successfully', type: 'success' });
        } catch (error) {
            setMessage({ text: 'Error saving bank details', type: 'error' });
            console.error('Error saving bank details:', error);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
            setMessage({ text: 'Please enter a valid amount', type: 'error' });
            return;
        }
        if (parseFloat(withdrawAmount) > balance) {
            setMessage({ text: 'Amount exceeds available balance', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/seller/withdraw', { amount: parseFloat(withdrawAmount) });
            setMessage({
                text: `Withdrawal request of ₹${withdrawAmount} submitted successfully`,
                type: 'success'
            });
            setBalance(prev => prev - parseFloat(withdrawAmount));
            setWithdrawAmount('');
        } catch (error) {
            setMessage({ text: 'Error processing withdrawal', type: 'error' });
            console.error('Error processing withdrawal:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="withdraw-earnings">
            <h1>Withdraw Earnings</h1>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="withdraw-grid">
                <div className="balance-card">
                    <h2>Your Balance</h2>
                    <p className="balance-amount">₹{balance.toLocaleString()}</p>
                    <p className="balance-label">Available for withdrawal</p>

                    <form onSubmit={handleWithdraw} className="withdraw-form">
                        <div className="form-group">
                            <label>Withdrawal Amount (₹)</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || balance <= 0}
                            className="btn btn-primary"
                        >
                            {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
                        </button>
                    </form>
                </div>

                <div className="bank-card">
                    <h2>Bank Details</h2>
                    <form onSubmit={handleSubmitBankDetails} className="bank-form">
                        <div className="form-group">
                            <label>Account Holder Name</label>
                            <input
                                type="text"
                                name="account_holder_name"
                                value={bankDetails.account_holder_name}
                                onChange={handleBankDetailsChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Account Number</label>
                            <input
                                type="text"
                                name="account_number"
                                value={bankDetails.account_number}
                                onChange={handleBankDetailsChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>IFSC Code</label>
                            <input
                                type="text"
                                name="ifsc_code"
                                value={bankDetails.ifsc_code}
                                onChange={handleBankDetailsChange}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-secondary">
                            Save Bank Details
                        </button>
                    </form>
                </div>
            </div>

            <div className="history-card">
                <h2>Withdrawal History</h2>
                <div className="history-placeholder">
                    <p>No withdrawal history yet</p>
                </div>
            </div>
        </div>
    );
};

export default WithdrawEarnings;