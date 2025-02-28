import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";
import { Link } from "react-router-dom";

function RegisterForm({ route, method }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      const res = await api.post(route, { email, username, password, password2 });
      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (error) {
        if (error.response) {
            const errorData = error.response.data;
            let errorMessage = "Error:\n";
        
            // Loop through all error fields and concatenate the messages
            for (const field in errorData) {
              if (Array.isArray(errorData[field])) {
                errorMessage += `${field}: ${errorData[field].join(", ")}\n`;
              } else {
                errorMessage += `${field}: ${errorData[field]}\n`;
              }
            }
        
            alert(errorMessage.trim()); // Show error messages
          } else if (error.request) {
            alert("No response received from the server.");
            console.log("No response received:", error.request);
          } else {
            alert(error.message);
            console.log("Request error:", error.message);
          }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h1>{name}</h1>
      <input
        className="form-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        className="form-input"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        className="form-input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <input
        className="form-input"
        type="text"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        placeholder="Confirm Password"
      />
      {loading && <LoadingIndicator/>}
      <button className="form-button" type="submit">
        {name}
      </button>
      <p className="form-text">
        Already registered?{" "}
        <Link to="/login" className="form-link">
          Login
        </Link>
      </p>
    </form>
  );
}

export default RegisterForm
