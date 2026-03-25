import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { Bus, Mail, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.role === "admin") {
        navigate("/admin");
      } else if (res.data.role === "driver") {
        navigate("/driver");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle c1"></div>
        <div className="auth-bg-circle c2"></div>
      </div>

      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-brand-icon"><Bus size={24} /></div>
          <div>
            <span className="auth-brand-name">Itahari International College</span>
            <span className="auth-brand-sub">Bus Management System</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your student account</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertTriangle size={16} style={{verticalAlign:"middle", marginRight:6}} />{error}
            </div>
          )}

          <form onSubmit={handleLogin} autoComplete="off">
            <input type="text" name="fake_user" style={{ display: "none" }} />
            <input type="password" name="fake_pass" style={{ display: "none" }} />

            <div className="auth-field">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Mail size={16} /></span>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label>Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><Lock size={16} /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner"></span> : "Sign In →"}
            </button>
          </form>

          <div className="auth-divider"><span>Don't have an account?</span></div>
          <Link to="/register" className="auth-alt-btn">Create New Account</Link>
        </div>

        <Link to="/" className="auth-back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default Login;
