import React, { useState, useEffect } from 'react';
import api from '../../api';  // ✅ Use your custom axios instance
import '../../styles/Cart.css';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.get('/api/cart/');
        setCartItems(response.data);
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      }
    };

    fetchCart();
  }, []);

  const updateQuantity = async (id, quantity) => {
    try {
      await api.put(`/api/cart/${id}/`, { quantity });
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (id) => {
    try {
      await api.delete(`/api/cart/${id}/`);
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 1000 ? 0 : 50;
  const total = subtotal + shipping;

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} />
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p>₹{item.price}</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="remove-btn">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <div className="totals">
              <p>Subtotal: <span>₹{subtotal}</span></p>
              <p>Shipping: <span>₹{shipping}</span></p>
              <p className="total">Total: <span>₹{total}</span></p>
            </div>
            <button onClick={() => navigate('/buyer/checkout', {
              state: {
                totalAmount: total,
                sellerUsername: cartItems[0]?.seller_username,
              }
            })}>
              Go to Checkout
            </button>

          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
