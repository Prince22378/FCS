import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/ReturnsRefunds.css';

const ReturnsRefunds = () => {
    const [eligibleOrders, setEligibleOrders] = useState([]);
    const [returnRequests, setReturnRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('request');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eligibleRes, requestsRes] = await Promise.all([
                    api.get('/api/buyer/returns/eligible-orders'),
                    api.get('/api/buyer/returns/requests')
                ]);
                setEligibleOrders(eligibleRes.data.orders);
                setReturnRequests(requestsRes.data.requests);
            } catch (error) {
                console.error('Error fetching return data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/buyer/returns/request', {
                orderId: selectedOrder,
                reason: returnReason,
                notes: additionalNotes
            });
            setReturnRequests(prev => [response.data.request, ...prev]);
            setEligibleOrders(prev => prev.filter(order => order.id !== selectedOrder));
            setSelectedOrder(null);
            setReturnReason('');
            setAdditionalNotes('');
        } catch (error) {
            console.error('Error submitting return request:', error);
        }
    };

    const cancelReturnRequest = async (requestId) => {
        try {
            await api.delete(`/api/buyer/returns/request/${requestId}`);
            setReturnRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (error) {
            console.error('Error cancelling return request:', error);
        }
    };

    return (
        <div className="returns-refunds">
            <h2>Returns & Refunds</h2>

            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
                    onClick={() => setActiveTab('request')}
                >
                    Request Return
                </button>
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Return History
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading return information...</div>
            ) : activeTab === 'request' ? (
                <div className="request-return">
                    <div className="return-policy">
                        <h3>Return Policy</h3>
                        <ul>
                            <li>Items must be returned within 30 days of delivery</li>
                            <li>Products must be unused and in original condition</li>
                            <li>Some items are non-returnable (e.g., perishables, personal care)</li>
                            <li>Refunds will be processed within 5-7 business days</li>
                        </ul>
                    </div>

                    {eligibleOrders.length > 0 ? (
                        <form onSubmit={handleSubmitRequest} className="return-form">
                            <div className="form-group">
                                <label>Select Order to Return</label>
                                <select
                                    value={selectedOrder || ''}
                                    onChange={(e) => setSelectedOrder(e.target.value)}
                                    required
                                >
                                    <option value="">Choose an order</option>
                                    {eligibleOrders.map(order => (
                                        <option key={order.id} value={order.id}>
                                            Order #{order.id} - {order.products[0].name} {order.products.length > 1 ? `+ ${order.products.length - 1} more` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedOrder && (
                                <>
                                    <div className="form-group">
                                        <label>Reason for Return</label>
                                        <select
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                            required
                                        >
                                            <option value="">Select a reason</option>
                                            <option value="wrong-item">Wrong Item Received</option>
                                            <option value="damaged">Item Damaged/Defective</option>
                                            <option value="not-as-described">Not as Described</option>
                                            <option value="changed-mind">Changed My Mind</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Additional Notes</label>
                                        <textarea
                                            value={additionalNotes}
                                            onChange={(e) => setAdditionalNotes(e.target.value)}
                                            rows="3"
                                            placeholder="Provide any additional details about your return"
                                        />
                                    </div>

                                    <button type="submit" className="submit-btn">
                                        Submit Return Request
                                    </button>
                                </>
                            )}
                        </form>
                    ) : (
                        <div className="no-eligible">
                            <p>No orders are eligible for return at this time.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="return-history">
                    {returnRequests.length === 0 ? (
                        <div className="no-returns">
                            <p>You haven't made any return requests yet.</p>
                        </div>
                    ) : (
                        <div className="requests-list">
                            {returnRequests.map(request => (
                                <div key={request.id} className="request-card">
                                    <div className="request-header">
                                        <div className="request-id">Request #{request.id}</div>
                                        <div className="request-date">
                                            {new Date(request.date).toLocaleDateString()}
                                        </div>
                                        <div className={`request-status ${request.status.toLowerCase()}`}>
                                            {request.status}
                                        </div>
                                    </div>

                                    <div className="request-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Order ID:</span>
                                            <span className="detail-value">#{request.orderId}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Reason:</span>
                                            <span className="detail-value">
                                                {request.reason
                                                    .split('-')
                                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                    .join(' ')}
                                            </span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Refund Amount:</span>
                                            <span className="detail-value">₹{request.refundAmount.toFixed(2)}</span>
                                        </div>
                                        {request.notes && (
                                            <div className="detail-item">
                                                <span className="detail-label">Notes:</span>
                                                <span className="detail-value">{request.notes}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="request-actions">
                                        {request.status === 'Pending' && (
                                            <button
                                                className="cancel-btn"
                                                onClick={() => cancelReturnRequest(request.id)}
                                            >
                                                Cancel Request
                                            </button>
                                        )}
                                        {request.status === 'Approved' && (
                                            <div className="approval-info">
                                                <p>Please ship your return to:</p>
                                                <address>
                                                    Returns Center<br />
                                                    123 Return Street<br />
                                                    Mumbai, 400001<br />
                                                    India
                                                </address>
                                            </div>
                                        )}
                                        {request.status === 'Completed' && (
                                            <div className="completion-info">
                                                <p>Refund completed on {new Date(request.completionDate).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReturnsRefunds;