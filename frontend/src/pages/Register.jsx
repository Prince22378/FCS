import { useState, useEffect } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "../styles/Form.css";
import LoadingIndicator from "../components/LoadingIndicator";
import { Link } from "react-router-dom";
import registerImage from "../assets/register_welcome.png";
import ReCAPTCHA from "react-google-recaptcha";

// Function to derive private key from password
async function derivePrivateKey(password) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Hash the password using SHA-256
  const hashedBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);

  return hashedBuffer; // This will be used as the private key
}

// Function to generate public key from private key (ECDSA)
import { ec as EC } from "elliptic";

const ec = new EC("p256"); // P-256 (same as "prime256v1")

async function generatePublicKey(privateKeyBuffer) {
  try {
    // console.log("Private Key Buffer:", privateKeyBuffer);

    // Convert ArrayBuffer to hex string
    const privateKeyHex = Array.from(new Uint8Array(privateKeyBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // console.log("Private Key Hex:", privateKeyHex);

    // Generate key pair from private key
    const key = ec.keyFromPrivate(privateKeyHex, "hex");

    // Get public key in hex format
    const publicKeyHex = key.getPublic("hex");

    // console.log("Public Key Hex:", publicKeyHex);

    return { publicKey: publicKeyHex };
  } catch (error) {
    console.error("Error in generateKeyPair:", error);
    throw error;
  }
}



function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleSendOtp = async () => {
    if (resendCount >= 5) {
      alert(
        "You've reached the maximum resend attempts. Please refresh and try again later."
      );

      if (!recaptchaToken) {
        alert("Please complete the reCAPTCHA.");
        return;
      }
      return;
    }

    setSendingOtp(true);
    try {
      await api.post("/api/send-otp/", { email, recaptcha: recaptchaToken });
      setOtpSent(true);
      setResendCountdown(30);
      setResendCount(resendCount + 1);
      alert("OTP sent to your email!, if not received check spam folder before resending");
    } catch (error) {
      alert(
        error.response?.data?.error ||
          "Failed to send OTP. Make sure reCAPTCHA is correct."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/verify-otp/", { email, otp });
      if (res.data.verified) {
        setOtpVerified(true);
        alert("OTP verified! Please complete your registration.");
      } else {
        alert("Invalid or Expired OTP");
      }
    } catch (error) {
      alert("Error verifying OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Derive private key from password
      const privateKeyBuffer = await derivePrivateKey(password);

      // Generate public key
      // console.log(privateKeyBuffer);
      const { publicKey } = await generatePublicKey(privateKeyBuffer);
      // console.log(publicKey);
      await api.post("/api/register/", {
        email,
        username,
        password,
        password2,
        otp,
        public_key: publicKey,
      });
      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      const errorData = error.response?.data || {};
      let message = "Error:\n";
      for (const field in errorData) {
        message += `${field}: ${errorData[field].join(", ")}\n`;
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="left-section">
        <img src={registerImage} alt="Welcome" className="auth-image" />
      </div>
      <div className="right-section">
        <form onSubmit={handleSubmit}>
          <h1>Register</h1>

          {/* Email and CAPTCHA */}
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            disabled={otpSent || otpVerified}
          />

          {!otpSent && (
            <>
              <ReCAPTCHA
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // TODO: Replace with your site key
                onChange={(token) => setRecaptchaToken(token)}
              />
              <button
                type="button"
                className="form-button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <>
                    Sending
                    <span className="spinner" />
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </>
          )}

          {/* OTP Verification */}
          {otpSent && !otpVerified && (
            <>
              <div className="otp-group">
                <input
                  className="form-input"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
                <button
                  type="button"
                  className="verify-btn"
                  onClick={handleVerifyOtp}
                >
                  Verify OTP
                </button>

                <div className="resend-wrapper">
                  <small className="otp-timer-text">
                    {resendCountdown > 0
                      ? `Resend OTP in ${resendCountdown}s`
                      : "You can now resend OTP"}
                  </small>
                  <button
                    type="button"
                    className="resend-small-btn"
                    onClick={handleSendOtp}
                    disabled={
                      resendCountdown > 0 || resendCount >= 5 || sendingOtp
                    }
                  >
                    {sendingOtp ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      "Resend OTP"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Registration Form */}
          {otpVerified && (
            <>
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
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Confirm Password"
              />
              <button className="form-button" type="submit">
                Register
              </button>
            </>
          )}

          {loading && <LoadingIndicator />}
          <p className="form-text">
            Already registered?{" "}
            <Link to="/login" className="form-link">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
