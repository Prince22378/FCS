import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN, PRIVATE_KEY } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";
import loginImage from "../assets/login_welcome.png";
import registerImage from "../assets/register_welcome.png";

// Function to derive private key from password
async function derivePrivateKey(password) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Hash the password using SHA-256
  const hashedBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);

  // Convert hashed buffer to a hex string
  return Array.from(new Uint8Array(hashedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function Form({ route, method }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (method === "register" && password !== confirmPassword) {
      alert("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post(route, { email, password });
      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

        const privateKey = await derivePrivateKey(password);
        localStorage.setItem(PRIVATE_KEY, privateKey); // Store private key in hex format
        // console.log("Derived Private Key (Hex):", privateKey); // Debugging output
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      {/* Left Section with Image */}
      <div className="left-section">
        <img
          src={method === "login" ? loginImage : registerImage}
          alt={name}
          className="auth-image"
        />
      </div>

      {/* Right Section (Form) */}
      <div className="right-section">
        <h2>{name}</h2>
        <form onSubmit={handleSubmit}>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {method === "register" && (
            <input
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
            />
          )}
          {loading && <LoadingIndicator />}
          <button className="form-button" type="submit">
            {name}
          </button>
        </form>
        <div className="form-footer-row">
          {method === "login" ? (
            <>
              <div className="footer-left">
                New here? <a href="/register">Sign Up</a>
              </div>
              <div className="footer-right">
                <a href="/forgot-password">Forgot Password?</a>
              </div>
            </>
          ) : (
            <p>
              Already have an account? <a href="/login">Login</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Form;
