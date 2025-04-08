// src/App.jsx
import React, { useState } from "react";  // <-- Added useState import here
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Login.jsx";
import Homepage from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import VerifiedRoute from "./components/VerifiedRoute.jsx";
import "./styles/global.css";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import FriendPage from './pages/FriendPage';
import ChatroomPage from "./pages/ChatRoomPage.jsx";
import ReportsLogs from "./pages/ReportsLogs";
import UserManagement from "./pages/UserManagement.jsx";
import Marketplace from './pages/Marketplace.jsx';
import BuyerMarketplace from './pages/BuyerMarketplace.jsx';
import SellerDashboard from './pages/SellerDashboard.jsx';
import SellerListings from './pages/SellerListings.jsx';
import CreateListing from "./pages/CreateListing.jsx";
import SellerOrders from "./pages/SellerOrders.jsx";
import WithdrawEarnings from "./pages/WithdrawEarnings.jsx";

import InvoicesBilling from "./components/buyer/InvoicesBilling.jsx"
import PaymentMethods from "./components/buyer/PaymentMethods.jsx"
import OrderHistory from "./components/buyer/OrderHistory.jsx";
import RecentOrders from "./components/buyer/RecentOrders.jsx";
import ReturnsRefunds from "./components/buyer/ReturnsRefunds.jsx";
import SavedAddresses from "./components/buyer/SavedAddresses.jsx";
import TrackOrder from "./components/buyer/TrackOrder.jsx"
import Wishlist from "./components/buyer/Wishlist.jsx"
import Products from './components/buyer/Products';
import Cart from './components/buyer/Cart.jsx'
import BuyerProfile from './components/buyer/BuyerProfile';
import ProductDetail from "./components/buyer/ProductDetail.jsx";
import Checkout from './components/buyer/Checkout';

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

const NavbarWrapper = () => {
  const location = useLocation();
  const hideNavbarOn = ["/login", "/register", "/admin-dashboard"];

  return !hideNavbarOn.includes(location.pathname) ? <Navbar /> : null;
};

function App() {
  const [cartItems, setCartItems] = useState([]);

  const updateQuantity = (id, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports_logs"
          element={
            <ProtectedRoute>
              <ReportsLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user_management"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <FriendPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatroomPage />
            </ProtectedRoute>
          }
        />

        {/* Seller routes - require verification */}
        <Route
          path="/seller"
          element={
            <VerifiedRoute>
              <SellerDashboard />
            </VerifiedRoute>
          }
        />
        <Route
          path="/seller/listings"
          element={
            <VerifiedRoute>
              <SellerListings />
            </VerifiedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <VerifiedRoute>
              <SellerOrders />
            </VerifiedRoute>
          }
        />
        <Route
          path="/seller/listings/create"
          element={
            <VerifiedRoute>
              <CreateListing />
            </VerifiedRoute>
          }
        />
        <Route
          path="/seller/withdraw"
          element={
            <VerifiedRoute>
              <WithdrawEarnings />
            </VerifiedRoute>
          }
        />

        <Route
          path="/buyer"
          element={
            <VerifiedRoute>
              <BuyerMarketplace
                cartItems={cartItems}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            </VerifiedRoute>
          }
        >
          <Route path="orders" element={<RecentOrders />} />
          <Route
            path="cart"
            element={
              <Cart
                cartItems={cartItems}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            }
          />
          <Route path="checkout" element={<Checkout />} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="returns" element={<ReturnsRefunds />} />
          <Route path="addresses" element={<SavedAddresses />} />
          <Route path="payments" element={<PaymentMethods />} />
          <Route path="invoices" element={<InvoicesBilling />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="profile" element={<BuyerProfile />} />

          <Route
            path="products"
            element={
              <Products
                addToCart={addToCart}
                cartItems={cartItems}
              />
            }
          />
          {/* 🔥 New nested route for product detail */}
          <Route path="products/:id" element={<ProductDetail />} />
        </Route>


        {/* Public marketplace routes */}
        <Route
          path="/marketplace"
          element={
            <Marketplace
              addToCart={addToCart}
              cartItems={cartItems}
            />
          }
        />
        <Route
          path="/products"
          element={
            <Products
              addToCart={addToCart}
              cartItems={cartItems}
            />
          }
        />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;