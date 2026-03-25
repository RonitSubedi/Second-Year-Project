import { NavLink, useNavigate } from "react-router-dom";
import { UserCircle } from "lucide-react";
import logo from "../assets/Logo.png";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.isAdmin;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isDriver = user.role === "driver";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="IIC Logo" className="navbar-logo" />
        <div className="navbar-title">
          <span className="navbar-college">Itahari International College</span>
          <span className="navbar-subtitle">Bus Management System</span>
        </div>
      </div>

      <ul className="navbar-links">
        {isDriver ? (
          <>
            <li><span style={{color:"#f59e0b",fontWeight:800}}>🚌 Driver Panel</span></li>
            <li><span style={{color:"#94a3b8",fontSize:"0.82rem"}}>{user.assignedRoute} Route</span></li>
          </>
        ) : isAdmin ? (
          <>
            <li><NavLink to="/admin">Dashboard</NavLink></li>
            <li><NavLink to="/admin/students">Students</NavLink></li>
            <li><NavLink to="/admin/registrations">Bus Registrations</NavLink></li>
            <li><NavLink to="/admin/payments">Payments</NavLink></li>
            <li><NavLink to="/admin/feedback">Feedback</NavLink></li>
            <li><NavLink to="/admin/bus-tracking">🗺 Bus Tracking</NavLink></li>
          </>
        ) : isDriver ? null : (
          <>
            <li><NavLink to="/home">Home</NavLink></li>
            <li><NavLink to="/dashboard">My Dashboard</NavLink></li>
            <li><NavLink to="/morning">Morning Shift</NavLink></li>
            <li><NavLink to="/day">Day Shift</NavLink></li>
            <li><NavLink to="/payment">Payment</NavLink></li>
            <li><NavLink to="/feedback">Feedback</NavLink></li>
            <li><NavLink to="/bus-tracker">🚌 Live Tracker</NavLink></li>
          </>
        )}
        <li>
          <span className="navbar-user"><UserCircle size={16} style={{verticalAlign:"middle", marginRight:"4px"}} />{user.name || "User"}</span>
        </li>
        <li>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
