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
        <Route path="marketplace/buyer" element={<BuyerMarketplace />} />


        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
