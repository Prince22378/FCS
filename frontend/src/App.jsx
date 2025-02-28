// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Homepage from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Inbox from "./pages/Inbox.jsx";
import MessageDetail from "./pages/MessageDetail.jsx";
import AdminRedirect from "./pages/AdminRedirect.jsx";
import "./styles/global.css";

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
  const hideNavbarOn = ["/login", "/register"];

  return !hideNavbarOn.includes(location.pathname) ? <Navbar /> : null;
};

function App() {
  return (
    <BrowserRouter>
      <NavbarWrapper />
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/inbox" 
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/message/:id" 
          element={
            <ProtectedRoute>
              <MessageDetail />
            </ProtectedRoute>
          } 
        />
        <Route path="/admin" element={<AdminRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
