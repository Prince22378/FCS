import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/InvoicesBilling.css';

const InvoicesBilling = () => {
    const [invoices, setInvoices] = useState([]);
    const [billingHistory, setBillingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('invoices');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invoicesRes, billingRes] = await Promise.all([
                    api.get('/api/buyer/invoices'),
                    api.get('/api/buyer/billing-history')
                ]);
                setInvoices(invoicesRes.data.invoices);
                setBillingHistory(billingRes.data.history);
            } catch (error) {
                console.error('Error fetching invoice data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const downloadInvoice = async (invoiceId) => {
        try {
            const response = await api.get(`/api/buyer/invoices/${invoiceId}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading invoice:', error);
        }
    };

    const filteredInvoices = invoices.filter(invoice =>
        new Date(invoice.date).getFullYear() === selectedYear
    );

    const years = Array.from(
        new Set(invoices.map(invoice => new Date(invoice.date).getFullYear()))
    ).sort((a, b) => b - a);

    return (
        <div className="invoices-billing">
            <h2>Invoices & Billing</h2>

            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invoices')}
                >
                    Invoices
                </button>
                <button
                    className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('billing')}
                >
                    Billing History
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading invoice information...</div>
            ) : activeTab === 'invoices' ? (
                <div className="invoices-container">
                    <div className="year-filter">
                        <label>Filter by year:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    {filteredInvoices.length === 0 ? (
                        <div className="no-invoices">
                            <p>No invoices found for the selected year</p>
                        </div>
                    ) : (
                        <table className="invoices-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Order #</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td>{invoice.number}</td>
                                        <td>{new Date(invoice.date).toLocaleDateString()}</td>
                                        <td>{invoice.orderId}</td>
                                        <td>₹{invoice.amount.toFixed(2)}</td>
                                        <td>
                                            <span className={`status ${invoice.status.toLowerCase()}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="download-btn"
                                                onClick={() => downloadInvoice(invoice.id)}
                                            >
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className="billing-container">
                    {billingHistory.length === 0 ? (
                        <div className="no-billing">
                            <p>No billing history found</p>
                        </div>
                    ) : (
                        <table className="billing-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Payment Method</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billingHistory.map(item => (
                                    <tr key={item.id}>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                        <td>
                                            {item.description}
                                            {item.invoiceId && (
                                                <span className="invoice-id">Invoice #{item.invoiceId}</span>
                                            )}
                                        </td>
                                        <td>{item.paymentMethod}</td>
                                        <td className={`amount ${item.amount < 0 ? 'negative' : 'positive'}`}>
                                            {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`status ${item.status.toLowerCase()}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvoicesBilling;