import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import '../styles/BuyerMarketplace.css';

const BuyerMarketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname;

  return (
    <div className="buyer-dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>🛍️ Orders</h3>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/orders' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/orders')}
            >
              Recent Orders
            </button>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/track' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/track')}
            >
              Track Your Order
            </button>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/history' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/history')}
            >
              Order History
            </button>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/returns' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/returns')}
            >
              Returns & Refunds
            </button>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/products' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/products')}
            >
              Browse Products
            </button>
          </div>

          <div className="sidebar-section">
            <h3>💳 Account</h3>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/addresses' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/addresses')}
            >
              Saved Addresses
            </button>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/payments' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/payments')}
            >
              Payment Methods
            </button>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/invoices' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/invoices')}
            >
              Invoices & Billing
            </button>
          </div>

          <div className="sidebar-section">
            <h3>❤️ Wishlist</h3>
            <button
              className={`sidebar-btn ${activeTab === '/buyer/wishlist' ? 'active' : ''}`}
              onClick={() => navigate('/buyer/wishlist')}
            >
              Your Saved Items
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="dashboard-header">
            <h1>Welcome back, Customer!</h1>
            <div className="quick-stats">
              <div className="stat-card">
                <span className="stat-value">5</span>
                <span className="stat-label">Active Orders</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">12</span>
                <span className="stat-label">Wishlist Items</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">₹1,250</span>
                <span className="stat-label">Pending Refunds</span>
              </div>
            </div>
          </div>

          {/* Route content */}
          <div className="outlet-container">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerMarketplace;
