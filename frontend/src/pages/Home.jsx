import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { CreditCard, LayoutDashboard, MessageSquare, Map, Sunrise, Sun, MapPin } from "lucide-react";
import busImg from "../assets/bus.png";
import morningImg from "../assets/morning.jpg";
import dayImg from "../assets/day.jpg";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/");
  }, [navigate]);

  const routes = [
    { name: "Dharan", stops: 12, color: "#1d4ed8" },
    { name: "Biratnagar", stops: 19, color: "#7c3aed" },
    { name: "Damak", stops: 18, color: "#059669" },
    { name: "Inaruwa", stops: 15, color: "#dc2626" },
  ];

  return (
    <div className="home-page">
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-badge">IIC Transport Services</span>
            <h1>College Bus<br />Management System</h1>
            <p>Safe, reliable, and punctual transport connecting students from across the region to Itahari International College.</p>
            <div className="hero-actions">
              <Link to="/payment" className="btn-primary">Register for Bus</Link>
              <Link to="/dashboard" className="btn-outline">My Dashboard</Link>
            </div>
          </div>
          <div className="hero-img">
            <img src={busImg} alt="Bus" />
          </div>
        </div>
      </section>

      <div className="welcome-strip">
        <span>Welcome back, <strong>{user.name || "Student"}</strong> — Choose your shift below</span>
      </div>

      <section className="shifts-section">
        <h2 className="section-title">Select Your Shift</h2>
        <div className="shifts-grid">
          <div className="shift-card shift-morning">
            <img src={morningImg} alt="Morning Shift" className="shift-img" />
            <div className="shift-info">
              <span className="shift-badge morning-badge">Morning Shift</span>
              <h3><Sunrise size={18} style={{verticalAlign:"middle", marginRight:6}} />Morning Shift</h3>
              <p className="shift-time">Departure: <strong>6:00 AM</strong></p>
              <p className="shift-desc">Early morning pickup from all routes. Reach college before classes begin.</p>
              <Link to="/morning" className="shift-btn">View Route & Times →</Link>
            </div>
          </div>

          <div className="shift-card shift-day">
            <img src={dayImg} alt="Day Shift" className="shift-img" />
            <div className="shift-info">
              <span className="shift-badge day-badge">Day Shift</span>
              <h3><Sun size={18} style={{verticalAlign:"middle", marginRight:6}} />Day Shift</h3>
              <p className="shift-time">Departure: <strong>11:00 AM</strong></p>
              <p className="shift-desc">Midday pickup for afternoon classes. All four routes available.</p>
              <Link to="/day" className="shift-btn">View Route & Times →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="routes-section">
        <h2 className="section-title">Available Routes</h2>
        <div className="routes-grid">
          {routes.map((r) => (
            <div className="route-card" key={r.name} style={{ borderTop: `4px solid ${r.color}` }}>
              <div className="route-icon" style={{ color: r.color }}><MapPin size={28} /></div>
              <h3>{r.name}</h3>
              <p>{r.stops} pickup stops</p>
              <div className="route-tag">Both Shifts</div>
            </div>
          ))}
        </div>
      </section>

      <section className="quick-section">
        <h2 className="section-title">Quick Access</h2>
        <div className="quick-grid">
          <Link to="/payment" className="quick-card">
            <span className="quick-icon"><CreditCard size={28} /></span>
            <h4>Pay Bus Fee</h4>
            <p>Pay your semester bus fee and register your seat</p>
          </Link>
          <Link to="/dashboard" className="quick-card">
            <span className="quick-icon"><LayoutDashboard size={28} /></span>
            <h4>My Dashboard</h4>
            <p>View your registration, payment status and details</p>
          </Link>
          <Link to="/feedback" className="quick-card">
            <span className="quick-icon"><MessageSquare size={28} /></span>
            <h4>Feedback</h4>
            <p>Share your experience or report any issues</p>
          </Link>
          <Link to="/morning" className="quick-card">
            <span className="quick-icon"><Map size={28} /></span>
            <h4>Live Route Map</h4>
            <p>View live map for each route and track bus stops</p>
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <p>© 2026 Itahari International College — Bus Management System</p>
        <p>Powered by IIC Transport Division</p>
      </footer>
    </div>
  );
}

export default Home;
