import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import '../../styles/Wishlist.css';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await api.get('/api/buyer/wishlist');
        setWishlist(response.data.items);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/api/buyer/wishlist/${productId}`);
      setWishlist(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  return (
    <div className="wishlist">
      <h2>Your Wishlist</h2>
      
      {loading ? (
        <div className="loading">Loading your wishlist...</div>
      ) : wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <p>Your wishlist is empty</p>
          <Link to="/products" className="browse-btn">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map(item => (
            <div key={item.id} className="wishlist-item">
              <div className="item-image">
                <Link to={`/products/${item.id}`}>
                  <img src={item.image} alt={item.name} />
                </Link>
                {item.onSale && (
                  <span className="sale-badge">Sale</span>
                )}
              </div>
              <div className="item-details">
                <h3>
                  <Link to={`/products/${item.id}`}>{item.name}</Link>
                </h3>
                <div className="price">
                  {item.onSale ? (
                    <>
                      <span className="original-price">₹{item.originalPrice}</span>
                      <span className="sale-price">₹{item.price}</span>
                    </>
                  ) : (
                    <span>₹{item.price}</span>
                  )}
                </div>
                <div className="item-actions">
                  <button className="add-to-cart">
                    Add to Cart
                  </button>
                  <button 
                    className="remove-item"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;