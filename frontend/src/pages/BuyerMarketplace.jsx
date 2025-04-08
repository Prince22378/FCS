import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import '../styles/BuyerMarketplace.css';

const BuyerMarketplace = ({ cartItems = [], updateQuantity = () => {}, removeItem = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/buyer/products', label: 'Browse Products', icon: '🛍️' },
    { path: '/buyer/orders', label: 'My Orders', icon: '📦' },
    { path: '/buyer/cart', label: `My Cart ${cartItems.length > 0 ? `(${cartItems.length})` : ''}`, icon: '🛒' },
    { path: '/buyer/profile', label: 'My Profile', icon: '👤' },
  ];

  return (
    <div className="buyer-dashboard">
      <div className="dashboard-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>Buyer Dashboard</h3>
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`sidebar-btn ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="outlet-container">
            <Outlet context={{ cartItems, updateQuantity, removeItem }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerMarketplace;