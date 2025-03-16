import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";
import loginImage from "../assets/login_welcome.png";
import registerImage from "../assets/register_welcome.png";

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
      // console.log(username, password);
      const res = await api.post(route, { email, password });
      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
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
        <p>
          {method === "login" ? "New here? " : "Already have an account? "}
          <a href={method === "login" ? "/register" : "/login"}>
            {method === "login" ? "Sign Up" : "Login"}
          </a>
        </p>
      </div>
    </div>
  );
}

export default Form;
