// src/App.jsx
import React from "react";
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
import "./styles/global.css";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import FriendPage from './pages/FriendPage';
import ChatroomPage from "./pages/ChatRoomPage.jsx";
import ReportsLogs from "./pages/ReportsLogs";
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
  return (
    <BrowserRouter>
      {/* <NavbarWrapper /> */}
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

        <Route path="/seller" element={<SellerDashboard />} />
        <Route path="/seller/listings" element={<SellerListings />} />


        <Route path="/marketplace" element={<Marketplace />} />

        <Route path="/seller/listings" element={<SellerListings />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
        <Route path="/seller/listings/create" element={<CreateListing />} />
        <Route path="/seller/withdraw" element={<WithdrawEarnings />} />
        <Route path="/buyer" element={<BuyerMarketplace />}>
          <Route path="orders" element={<RecentOrders />} />
          <Route path="track" element={<TrackOrder />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="returns" element={<ReturnsRefunds />} />
          <Route path="addresses" element={<SavedAddresses />} />
          <Route path="payments" element={<PaymentMethods />} />
          <Route path="invoices" element={<InvoicesBilling />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="products" element={<Products />} />
        </Route>
        <Route path="/products" element={<Products />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
