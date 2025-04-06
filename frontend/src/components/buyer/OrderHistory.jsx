import React, { useState, useEffect } from 'react';
import api from '../../api';
import '../../styles/OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const response = await api.get('/api/buyer/orders/history');
        setOrders(response.data.orders);
      } catch (error) {
        console.error('Error fetching order history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status.toLowerCase() === filter;
    const matchesYear = new Date(order.date).getFullYear() === selectedYear;
    return matchesFilter && matchesYear;
  });

  const years = Array.from(
    new Set(orders.map(order => new Date(order.date).getFullYear()))
  ).sort((a, b) => b - a);

  const downloadInvoice = async (orderId) => {
    try {
      const response = await api.get(`/api/buyer/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  return (
    <div className="order-history">
      <div className="history-header">
        <h2>Order History</h2>
        <div className="history-controls">
          <div className="filter-control">
            <label>Filter by status:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Orders</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div className="year-control">
            <label>Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="year-select"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading your order history...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found for the selected criteria</p>
        </div>
      ) : (
        <div className="orders-container">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">Order #{order.id}</div>
                <div className="order-date">
                  {new Date(order.date).toLocaleDateString()}
                </div>
                <div className={`order-status ${order.status.toLowerCase()}`}>
                  {order.status}
                </div>
              </div>
              
              <div className="order-products">
                {order.products.slice(0, 3).map(product => (
                  <div key={product.id} className="product-item">
                    <img src={product.image} alt={product.name} className="product-image" />
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p>Qty: {product.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.products.length > 3 && (
                  <div className="more-items">
                    +{order.products.length - 3} more items
                  </div>
                )}
              </div>
              
              <div className="order-footer">
                <div className="order-total">
                  Total: ₹{order.total.toFixed(2)}
                </div>
                <div className="order-actions">
                  <button 
                    className="invoice-btn"
                    onClick={() => downloadInvoice(order.id)}
                  >
                    Download Invoice
                  </button>
                  {order.status.toLowerCase() === 'delivered' && (
                    <button className="return-btn">
                      Return Items
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;