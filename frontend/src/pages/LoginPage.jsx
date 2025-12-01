// =====================================================================
// 🔐 LOGIN PAGE (Direct Login - No OTP)
// =====================================================================

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { loginInit, storeAuthData } from "../api/auth";
import "./LoginPage.css";

const FALLBACK_CODES = {
  LOGIN_FAILED: "EL001",
  SERVER_ERROR: "EA010",
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState(""); // error or success

  const [msgTables, setMsgTables] = useState({
    user_error: {},
    user_information: {},
    user_validation: {},
  });

  const navigate = useNavigate();

  // ============================================================
  // Normalize Message Tables
  // ============================================================
  const normalize = (arr, type) => {
    const map = {};
    if (!Array.isArray(arr)) return map;

    arr.forEach((item) => {
      if (!item) return;

      if (type === "error" && item.error_code)
        map[item.error_code.toUpperCase()] = item.error_message;

      if (type === "info" && item.information_code)
        map[item.information_code.toUpperCase()] = item.information_text;

      if (type === "validation" && item.validation_code)
        map[item.validation_code.toUpperCase()] = item.validation_message;
    });

    return map;
  };

  // ============================================================
  // Load Message Tables From localStorage
  // ============================================================
  useEffect(() => {
    try {
      const e = JSON.parse(localStorage.getItem("user_error") || "[]");
      const i = JSON.parse(localStorage.getItem("user_information") || "[]");
      const v = JSON.parse(localStorage.getItem("user_validation") || "[]");

      setMsgTables({
        user_error: normalize(e, "error"),
        user_information: normalize(i, "info"),
        user_validation: normalize(v, "validation"),
      });
    } catch {
      setMsgTables({ user_error: {}, user_information: {}, user_validation: {} });
    }
  }, []);

  const getErrorText = (code) =>
    msgTables.user_error[(code || "").toUpperCase()] ||
    "Invalid credentials.";

  // ============================================================
  // REDIRECT HANDLER
  // ============================================================
  const handleRedirect = async (data) => {
  const roleId = Number(data?.role_id);

  // Admin redirect
  if (data?.is_admin || (roleId && roleId !== 2)) {
    navigate("/admin/dashboard", { replace: true });
    return;
  }

  // Normal user → check address using cookie-based auth
  try {
    const res = await fetch("http://127.0.0.1:8000/api/addresses/check/", {
      method: "GET",
      credentials: "include",   // 🔥 send cookie with request
      headers: {
        "Content-Type": "application/json",
      },
    });

    const addrData = await res.json().catch(() => ({}));

    if (res.ok && addrData?.has_address) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/addresses", { replace: true });
    }
  } catch {
    navigate("/addresses", { replace: true });
  }
};


  // ============================================================
  // LOGIN HANDLER
  // ============================================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setType("");

    if (!username.trim() || !password.trim()) {
      setMessage("Username and password are required.");
      setType("error");
      return;
    }

    try {
      const result = await loginInit(username, password);
      const { ok, data } = result;

      if (!ok) {

const code = data?.code || FALLBACK_CODES.LOGIN_FAILED;

const msg =
  data?.message ||                    // backend message
  getErrorText(code) ||               // DB message table
  "Invalid credentials.";             // last fallback

setMessage(msg);

        setType("error");
        return;
      }

      // Store tokens + user info
      storeAuthData(data);

      setMessage("Login successful!");
      setType("success");

      setTimeout(() => handleRedirect(data), 600);

    } catch (err) {
      setMessage(getErrorText(FALLBACK_CODES.SERVER_ERROR));
      setType("error");
    }
  };

  // ============================================================
  // UI Rendering
  // ============================================================
  return (
    <div className="auth-wrapper">
      <div className="login-container">
        <h2>Login</h2>

        <form onSubmit={handleLogin} className="login-form">
          <input
            className="login-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              className="login-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </span>
          </div>

          {message && (
            <p className={type === "error" ? "error-text" : "success-text"}>
              {message}
            </p>
          )}

          <button className="login-button">Login</button>
        </form>

        <div className="login-links">
          <p><Link to="/forgot-password">Forgot password?</Link></p>
          <p>Don’t have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}
