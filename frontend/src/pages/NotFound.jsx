import { useNavigate } from "react-router-dom";
import { Bus } from "lucide-react";
import "../styles/NotFound.css";

function NotFound() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleHome = () => {
    if (!isLoggedIn) return navigate("/");
    navigate(user.isAdmin ? "/admin" : "/home");
  };

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-icon"><Bus size={56} /></div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or may have been moved.</p>
        <div className="notfound-actions">
          <button onClick={handleHome} className="notfound-btn-primary">
            {isLoggedIn ? "Go to Dashboard" : "Go to Login"}
          </button>
          <button onClick={() => navigate(-1)} className="notfound-btn-outline">
            ← Go Back
          </button>
        </div>
        <p className="notfound-footer">IIC Bus Management System</p>
      </div>
    </div>
  );
}

export default NotFound;
