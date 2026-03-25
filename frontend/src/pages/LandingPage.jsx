import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import {
  Clock,
  CreditCard,
  LayoutDashboard,
  Shield,
  MapPin,
  Timer,
  Sunrise,
  Sun,
} from "lucide-react";
import logo from "../assets/logo.jpg";
import "../styles/LandingPage.css";

function LandingPage() {
  const [studentCount, setStudentCount] = useState(null);

  useEffect(() => {
    api
      .get("/auth/student-count")
      .then((res) => setStudentCount(res.data))
      .catch(() => {});
  }, []);

  const STUDENT_LIMIT = 1400;
  const registered = studentCount?.registered ?? null;

  const routes = [
    { name: "Dharan", stops: 12, duration: "45 min", color: "#2563eb" },
    { name: "Biratnagar", stops: 19, duration: "35 min", color: "#7c3aed" },
    { name: "Damak", stops: 18, duration: "50 min", color: "#059669" },
    { name: "Inaruwa", stops: 15, duration: "40 min", color: "#dc2626" },
  ];

  const features = [
    {
      icon: <Shield size={28} />,
      title: "Safe & Tracked",
      desc: "GPS-monitored buses with trained drivers ensuring every student arrives safely.",
    },
    {
      icon: <Clock size={28} />,
      title: "Always On Time",
      desc: "Strict departure schedules with real-time updates to keep you informed.",
    },
    {
      icon: <CreditCard size={28} />,
      title: "Easy Payments",
      desc: "Hassle-free monthly fee payments with instant digital confirmation.",
    },
    {
      icon: <LayoutDashboard size={28} />,
      title: "Your Dashboard",
      desc: "Track your seat, payment status, and shift details all in one place.",
    },
  ];

  const stats = [
    {
      value: registered !== null ? registered.toLocaleString() : "...",
      label: "Active Students",
    },
    { value: "4", label: "Major Routes" },
    { value: "2", label: "Daily Shifts" },
    { value: "100%", label: "Safety Record" },
  ];

  return (
    <div className="landing-page">
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <img src={logo} alt="logo" className="lp-logo" />
            </div>
            <div>
              <span className="lp-brand-name">IIC </span>
              <span className="lp-brand-sub">
                Itahari International College
              </span>
            </div>
          </div>
          <div className="lp-nav-links">
            <a href="#routes">Routes</a>
            <a href="#features">Features</a>
            <Link to="/login" className="lp-btn-outline">
              Sign In
            </Link>
            <Link to="/register" className="lp-btn-solid">
              Register
            </Link>
          </div>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-circle lp-circle-1"></div>
          <div className="lp-hero-circle lp-circle-2"></div>
          <div className="lp-hero-circle lp-circle-3"></div>
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span>●</span> Official IIC Bus Management System
          </div>
          <h1 className="lp-hero-title">
            Your Journey to
            <br />
            <span className="lp-hero-highlight">Knowledge</span>
            <br />
            Starts Here
          </h1>
          <p className="lp-hero-desc">
            Safe, punctual, and comfortable transport for every student of
            Itahari International College — covering Dharan, Biratnagar, Damak
            and Inaruwa.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register" className="lp-cta-primary">
              Get Started →
            </Link>
            <Link to="/login" className="lp-cta-secondary">
              Sign In to Portal
            </Link>
          </div>
        </div>

        <div className="lp-hero-visual">
          <div className="lp-bus-card">
            <div className="lp-bus-card-header">
              <span className="lp-bus-card-title">Live Service Status</span>
              <span className="lp-live-badge">
                <span className="lp-live-dot"></span>All Routes Active
              </span>
            </div>
            <div className="lp-route-list">
              <div className="lp-route-item">
                <span className="lp-dot green"></span>Inaruwa – IIC Campus
              </div>
              <div className="lp-route-connector"></div>
              <div className="lp-route-item">
                <span className="lp-dot yellow"></span>Dharan Bazaar – IIC
                Campus
              </div>
              <div className="lp-route-connector"></div>
              <div className="lp-route-item">
                <span className="lp-dot blue"></span>Biratnagar Bus Park – IIC
                Campus
              </div>
              <div className="lp-route-connector"></div>
              <div className="lp-route-item">
                <span className="lp-dot green"></span>Damak Chowk – IIC Campus
              </div>
            </div>
          </div>
          <div className="lp-mini-stats">
            <div className="lp-mini-stat">
              <div className="lp-mini-stat-val">
                {registered !== null ? registered.toLocaleString() : "..."}
              </div>
              <div className="lp-mini-stat-lbl">Students</div>
              {registered !== null && (
                <div className="lp-mini-seat-bar">
                  <div
                    className="lp-mini-seat-fill"
                    style={{
                      width: `${Math.min((registered / STUDENT_LIMIT) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              )}
            </div>
            <div className="lp-mini-stat">
              <div className="lp-mini-stat-val">4</div>
              <div className="lp-mini-stat-lbl">Routes</div>
            </div>
            <div className="lp-mini-stat">
              <div className="lp-mini-stat-val">2</div>
              <div className="lp-mini-stat-lbl">Shifts/Day</div>
            </div>
            <div className="lp-mini-stat">
              <div className="lp-mini-stat-val">100%</div>
              <div className="lp-mini-stat-lbl">On-Time</div>
            </div>
          </div>
          {registered !== null && (
            <div className="lp-seat-counter">
              <span className="lp-seat-count">{registered}</span>
              <span className="lp-seat-sep">/</span>
              <span className="lp-seat-total">{STUDENT_LIMIT}</span>
              <span className="lp-seat-label">students registered</span>
              {studentCount?.isFull ? (
                <span className="lp-seat-badge full">Registration Closed</span>
              ) : (
                <span className="lp-seat-badge open">
                  {studentCount?.remaining} seats left
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="lp-stats-strip">
        {stats.map((s, i) => (
          <div key={i} className="lp-stat">
            <span className="lp-stat-value">{s.value}</span>
            <span className="lp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <section className="lp-section" id="routes">
        <div className="lp-section-inner">
          <div className="lp-section-tag">Coverage</div>
          <h2 className="lp-section-title">Routes We Cover</h2>
          <p className="lp-section-sub">
            Multiple well-established routes ensuring every student is connected
            to campus.
          </p>
          <div className="lp-routes-grid">
            {routes.map((r, i) => (
              <div
                className="lp-route-card-big"
                key={i}
                style={{ "--accent": r.color }}
              >
                <div className="lp-route-icon">
                  <MapPin size={32} color={r.color} />
                </div>
                <h3>{r.name}</h3>
                <div className="lp-route-meta">
                  <span>
                    <MapPin
                      size={13}
                      style={{ verticalAlign: "middle", marginRight: 3 }}
                    />
                    {r.stops} Stops
                  </span>
                  <span>
                    <Timer
                      size={13}
                      style={{ verticalAlign: "middle", marginRight: 3 }}
                    />
                    ~{r.duration}
                  </span>
                </div>
                <div className="lp-route-bar">
                  <div
                    className="lp-route-fill"
                    style={{ width: `${(r.stops / 20) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-shifts">
        <div className="lp-section-inner">
          <div className="lp-section-tag light">Schedule</div>
          <h2 className="lp-section-title light">Two Daily Shifts</h2>
          <div className="lp-shifts-grid">
            <div className="lp-shift-block morning">
              <div className="lp-shift-icon">
                <Sunrise size={36} />
              </div>
              <h3>Morning Shift</h3>
              <div className="lp-shift-time">6:00 AM Departure</div>
              <p>
                Ideal for early classes. Buses depart from all routes promptly
                at 6 AM.
              </p>
            </div>
            <div className="lp-shift-block day">
              <div className="lp-shift-icon">
                <Sun size={36} />
              </div>
              <h3>Day Shift</h3>
              <div className="lp-shift-time">10:00 AM Departure</div>
              <p>
                Perfect for late-start students. Comfortable mid-morning
                commute.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-tag">Why Choose Us</div>
          <h2 className="lp-section-title">Everything You Need</h2>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div className="lp-feature-card" key={i}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta-section">
        <div className="lp-cta-inner">
          <h2>Ready to Board?</h2>
          <div className="lp-cta-btns">
            <Link to="/register" className="lp-cta-primary large">
              Create Free Account
            </Link>
            <Link to="/login" className="lp-cta-secondary large">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-icon">
              <img
                src={logo}
                alt="logo"
                className="lp-logo-footer"
              />
            </span>
            <span>
              <strong>IIC Bus Management System</strong>
              <br />
              Itahari International College, Nepal
            </span>
          </div>
          <div className="lp-footer-links">
            <Link to="/login">Student Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
        <div className="lp-footer-bottom">
          © {new Date().getFullYear()} Itahari International College. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
