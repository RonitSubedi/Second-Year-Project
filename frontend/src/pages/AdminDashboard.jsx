import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import { GraduationCap, Bus, DollarSign, BarChart2, Users, MessageSquare, Sunrise, Sun, RefreshCw } from "lucide-react";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = () => {
    setLoading(true);
    api.get("/registration/stats")
      .then((res) => { setStats(res.data); setLastRefresh(new Date()); })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 60 seconds so admin sees real-time shift changes
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="admin-page">
        <Navbar />
        <div className="admin-loading"><div className="spinner" /><p>Loading dashboard...</p></div>
      </div>
    );
  }

  const totalReg       = stats?.totalRegistered?.[0]?.count || 0;
  const totalStudents  = stats?.totalStudents?.[0]?.count   || 0;
  const studentLimit   = stats?.studentLimit?.[0]?.limit_count || 1400;
  const totalRevenue   = stats?.totalRevenue?.[0]?.total    || 0;
  const todayActive    = stats?.todayActive?.[0]?.count     || 0;
  const seatsFilled    = Math.round((totalStudents / studentLimit) * 100);
  const byShift        = stats?.byShift        || [];
  const byRoute        = stats?.byRoute        || [];
  const recentPayments = stats?.recentPayments || [];
  const todayLogs      = stats?.todayShiftLogs || [];

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="admin-page">
      <Navbar />

      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>IIC Bus Management System — Overview</p>
        </div>
        <button className="refresh-btn" onClick={fetchStats} disabled={loading}>
          <RefreshCw size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
          {loading ? "Refreshing..." : "Refresh"}
          <span style={{ fontSize: "0.72rem", display: "block", opacity: 0.7 }}>
            Last: {lastRefresh.toLocaleTimeString()}
          </span>
        </button>
      </div>

      <div className="admin-container">

        {/* ── STAT CARDS ── */}
        <div className="stat-cards">
          <div className="stat-card blue">
            <div className="stat-icon"><GraduationCap size={28} /></div>
            <div>
              <p className="stat-label">Registered Students</p>
              <p className="stat-value">
                {totalStudents}
                <span style={{ fontSize: "0.85rem", fontWeight: 400, opacity: 0.7 }}> / {studentLimit}</span>
              </p>
              <div style={{ marginTop: "6px", height: "6px", background: "rgba(255,255,255,0.3)", borderRadius: "3px" }}>
                <div style={{ height: "100%", width: `${Math.min(seatsFilled, 100)}%`, background: "#fff", borderRadius: "3px" }}></div>
              </div>
              <p style={{ fontSize: "0.72rem", marginTop: "3px", opacity: 0.85 }}>{studentLimit - totalStudents} seats remaining</p>
            </div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon"><Bus size={28} /></div>
            <div>
              <p className="stat-label">Active Bus Passes</p>
              <p className="stat-value">{totalReg}</p>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon"><DollarSign size={28} /></div>
            <div>
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value">Rs. {Number(totalRevenue).toLocaleString()}</p>
            </div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon"><BarChart2 size={28} /></div>
            <div>
              <p className="stat-label">Today's Boarders</p>
              <p className="stat-value">{todayActive}</p>
              <p style={{ fontSize: "0.72rem", marginTop: "2px", opacity: 0.85 }}>logged shift today</p>
            </div>
          </div>
        </div>

        {/* ── TODAY'S LIVE SHIFT & ROUTE BREAKDOWN ── */}
        <div className="today-section">
          <div className="today-header">
            <h2>📅 Today's Live Data — {today}</h2>
            <p>Updates every time a student selects or changes their shift for today.</p>
          </div>

          <div className="admin-grid" style={{ marginTop: "1rem" }}>
            <div className="admin-card">
              <h3><Sunrise size={16} style={{ marginRight: 6, verticalAlign: "middle", color: "#f59e0b" }} />Today's Shift Breakdown</h3>
              {byShift.length === 0 ? (
                <p className="no-data">No shift selections yet today</p>
              ) : (
                <div className="bar-chart">
                  {byShift.map((s) => {
                    const pct = todayActive > 0 ? Math.round((s.count / todayActive) * 100) : 0;
                    return (
                      <div className="bar-item" key={s.shift}>
                        <div className="bar-labels">
                          <span className="capitalize">
                            {s.shift === "morning"
                              ? <><Sunrise size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Morning Shift</>
                              : <><Sun size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Day Shift</>}
                          </span>
                          <span><strong>{s.count}</strong> students ({pct}%)</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill shift-bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="admin-card">
              <h3>🗺️ Today's Route Breakdown</h3>
              {byRoute.length === 0 ? (
                <p className="no-data">No route selections yet today</p>
              ) : (
                <div className="bar-chart">
                  {byRoute.map((r) => {
                    const pct = todayActive > 0 ? Math.round((r.count / todayActive) * 100) : 0;
                    const colors = { Biratnagar: "#7c3aed", Damak: "#059669", Dharan: "#2563eb", Inaruwa: "#dc2626" };
                    return (
                      <div className="bar-item" key={r.route}>
                        <div className="bar-labels">
                          <span>{r.route}</span>
                          <span><strong>{r.count}</strong> students ({pct}%)</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${pct}%`, background: colors[r.route] || "#2563eb" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Today's full student shift log table */}
            <div className="admin-card full-col">
              <h3>👥 Today's Student Shift Log</h3>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1rem" }}>
                Shows which shift each student selected today. Updates live as students change their shift.
              </p>
              {todayLogs.length === 0 ? (
                <p className="no-data">No students have selected a shift yet today.</p>
              ) : (
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Department</th>
                        <th>Semester</th>
                        <th>Today's Shift</th>
                        <th>Route</th>
                        <th>Bus Stop</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayLogs.map((log, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{log.name}</td>
                          <td className="mono">{log.student_id}</td>
                          <td>{log.department}</td>
                          <td>{log.semester}</td>
                          <td>
                            <span className={`shift-badge ${log.shift}`}>
                              {log.shift === "morning"
                                ? <><Sunrise size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />Morning</>
                                : <><Sun size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />Day</>}
                            </span>
                          </td>
                          <td>{log.route}</td>
                          <td>{log.bus_stop}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RECENT PAYMENTS ── */}
        <div className="admin-grid" style={{ marginTop: "1.5rem" }}>
          <div className="admin-card full-col">
            <h3>Recent Payments</h3>
            {recentPayments.length === 0 ? (
              <p className="no-data">No payments yet</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Paid On</th>
                    <th>Expires On</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p, i) => {
                    const exp = p.expires_at ? new Date(p.expires_at) : null;
                    const expired = exp && exp < new Date();
                    return (
                      <tr key={i}>
                        <td>{p.name}</td>
                        <td>{p.email}</td>
                        <td className="mono">{p.transaction_id}</td>
                        <td>Rs. {p.amount}</td>
                        <td className="capitalize">{p.payment_method?.replace("_", " ")}</td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td style={{ color: expired ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                          {exp ? exp.toLocaleDateString() : "—"}
                          {expired ? " ⚠ Expired" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── QUICK LINKS ── */}
        <div className="quick-links">
          <a href="/admin/students" className="ql-card">
            <span className="ql-icon"><Users size={24} /></span>
            <div><h4>Manage Students</h4><p>View all students and their registration status</p></div>
            <span className="ql-arrow">→</span>
          </a>
          <a href="/admin/registrations" className="ql-card">
            <span className="ql-icon"><Bus size={24} /></span>
            <div><h4>Bus Registrations</h4><p>View all active bus registrations by shift and route</p></div>
            <span className="ql-arrow">→</span>
          </a>
          <a href="/admin/payments" className="ql-card">
            <span className="ql-icon"><DollarSign size={24} /></span>
            <div><h4>Payment Details</h4><p>View all payment transactions and revenue</p></div>
            <span className="ql-arrow">→</span>
          </a>
          <a href="/admin/feedback" className="ql-card">
            <span className="ql-icon"><MessageSquare size={24} /></span>
            <div><h4>View Feedback</h4><p>Review and reply to student feedback</p></div>
            <span className="ql-arrow">→</span>
          </a>
          <a href="/admin/bus-tracking" className="ql-card">
            <span className="ql-icon"><Bus size={24} /></span>
            <div><h4>Live Bus Tracking</h4><p>Share and monitor real-time bus locations on the map</p></div>
            <span className="ql-arrow">→</span>
          </a>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
