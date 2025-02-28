import react from "react"
import {BrowserRouter, Routes, Route, Navigate, useLocation} from "react-router-dom"
import Login from './pages/Login';
import Home from './pages/Home';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import MessageDetail from "./pages/MessageDetail";


function Logout(){
  localStorage.clear()
  return <Navigate to="/login"/>
}

function RegisterAndLogout(){
  localStorage.clear()
  return <Register />
}

const NavbarWrapper = () => {
  const location = useLocation();
  const hideNavbarOn = ["/login", "/register"];

  return !hideNavbarOn.includes(location.pathname) ? <Navbar /> : null;
};


function App() {

  return (
    <BrowserRouter>
    <NavbarWrapper/>
    <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
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
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
