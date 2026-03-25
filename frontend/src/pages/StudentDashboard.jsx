import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
import socket from "../socket";
import { CheckCircle, XCircle, CreditCard, Route, Clock, Pencil, Bus, Pin, Calendar, AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import "../styles/StudentDashboard.css";

function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [payments, setPayments] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busStatus, setBusStatus] = useState(null); // live bus status for student's route
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profRes, regRes, payRes] = await Promise.all([
          api.get("/user/profile"),
          api.get("/registration/my").catch(() => ({ data: null })),
          api.get("/payment/history").catch(() => ({ data: [] })),
        ]);
        setProfile(profRes.data);
        setEditForm(profRes.data);
        setRegistration(regRes.data);
        setPayments(payRes.data);

        // After loading registration, fetch initial bus location for student's route
        if (regRes.data) {
          const route = regRes.data.today_route || regRes.data.route;
          if (route) {
            api.get(`/bus-location/${route}`)
              .then(r => { if (r.data) setBusStatus({ ...r.data, route }); })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Listen for live bus updates via socket
  useEffect(() => {
    socket.on("bus:location_update", (data) => {
      setRegistration(reg => {
        if (!reg) return reg;
        const myRoute = reg.today_route || reg.route;
        if (myRoute === data.route) {
          setBusStatus({ ...data, route: data.route });
        }
        return reg;
      });
    });
    socket.on("bus:offline", ({ route }) => {
      setRegistration(reg => {
        if (!reg) return reg;
        const myRoute = reg.today_route || reg.route;
        if (myRoute === route) {
          setBusStatus(prev => prev ? { ...prev, isLive: false } : null);
        }
        return reg;
      });
    });
    socket.emit("client:get_locations");
    socket.on("bus:all_locations", (data) => {
      setRegistration(reg => {
        if (!reg) return reg;
        const myRoute = reg.today_route || reg.route;
        if (myRoute && data[myRoute]) {
          setBusStatus({ ...data[myRoute], route: myRoute });
        }
        return reg;
      });
    });

    return () => {
      socket.off("bus:location_update");
      socket.off("bus:offline");
      socket.off("bus:all_locations");
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/user/profile", {
        name: editForm.name,
        phone: editForm.phone,
        studentId: editForm.student_id,
        semester: editForm.semester,
        department: editForm.department,
      });
      setProfile({ ...profile, ...editForm });
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...user, name: editForm.name }));
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch {
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-page">
        <Navbar />
        <div className="dash-loading"><div className="spinner" /><p>Loading your dashboard...</p></div>
      </div>
    );
  }

  // Compute expiry info
  const expiresAt = registration?.expires_at ? new Date(registration.expires_at) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

  // Check if latest payment is expired (no active registration but has payment history)
  const latestPayment = payments[0];
  const latestExpired = latestPayment?.expires_at && new Date(latestPayment.expires_at) < new Date();

  return (
    <div className="dash-page">
      <Navbar />

      <div className="dash-header">
        <div className="dash-header-content">
          <div className="dash-avatar">{profile?.name?.[0]?.toUpperCase() || "S"}</div>
          <div>
            <h1>Welcome, {profile?.name}!</h1>
            <p>{profile?.email} &nbsp;|&nbsp; {profile?.department || "—"} &nbsp;|&nbsp; {profile?.semester || "—"}</p>
          </div>
        </div>
      </div>

      <div className="dash-container">

        {/* Expiry warning banner */}
        {registration && isExpiringSoon && (
          <div className="expiry-banner warning">
            <AlertTriangle size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            Your bus pass expires in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong> on {expiresAt.toLocaleDateString()}.
            &nbsp;<button className="renew-link" onClick={() => navigate("/payment")}>Renew Now →</button>
          </div>
        )}

        {!registration && latestExpired && (
          <div className="expiry-banner expired">
            <AlertTriangle size={18} style={{ marginRight: 8, verticalAlign: "middle" }} />
            Your bus pass has <strong>expired</strong>. Please renew to continue using the bus service.
            &nbsp;<button className="renew-link" onClick={() => navigate("/payment")}>Renew Now →</button>
          </div>
        )}

        <div className="status-cards">
          <div className={`status-card ${registration ? "card-green" : "card-red"}`}>
            <span className="status-card-icon">
              {registration ? <CheckCircle size={26} /> : <XCircle size={26} />}
            </span>
            <div>
              <p className="status-card-label">Bus Registration</p>
              <p className="status-card-value">{registration ? "Active" : "Not Registered"}</p>
            </div>
          </div>
          <div className={`status-card ${registration ? "card-green" : latestExpired ? "card-red" : "card-gray"}`}>
            <span className="status-card-icon"><CreditCard size={26} /></span>
            <div>
              <p className="status-card-label">Payment Status</p>
              <p className="status-card-value">{registration ? "Paid & Active" : latestExpired ? "Expired" : "Pending"}</p>
            </div>
          </div>
          <div className="status-card card-blue">
            <span className="status-card-icon"><Route size={26} /></span>
            <div>
              <p className="status-card-label">Route</p>
              <p className="status-card-value">{registration?.route || "—"}</p>
            </div>
          </div>
          <div className="status-card card-purple">
            <span className="status-card-icon"><Clock size={26} /></span>
            <div>
              <p className="status-card-label">Today's Shift</p>
              <p className="status-card-value capitalize">
                {registration?.today_shift
                  ? registration.today_shift + " Shift"
                  : registration?.shift
                  ? registration.shift + " Shift"
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="dash-grid">
          {/* Live Bus Status Widget */}
          {registration && (
            <div className="dash-card full-width-card" style={{ padding: "1.25rem 1.5rem" }}>
              <div className="card-header" style={{ marginBottom: "0.75rem" }}>
                <h2><Bus size={17} style={{ verticalAlign: "middle", marginRight: 6 }} />Live Bus Status</h2>
                <span className={`live-badge-sm ${busStatus?.isLive ? "live" : "offline-sm"}`}>
                  {busStatus?.isLive
                    ? <><span className="live-dot-sm"></span>Live</>
                    : busStatus
                    ? <><WifiOff size={11} style={{ marginRight: 3 }} />Offline</>
                    : <><Wifi size={11} style={{ marginRight: 3 }} />Waiting...</>
                  }
                </span>
              </div>
              {busStatus?.isLive ? (
                <div className="bus-status-row">
                  <span className="bus-status-pill live-pill">🚌 {busStatus.route} bus is LIVE right now</span>
                  <span className="bus-status-info">{busStatus.shift === "morning" ? "🌅 Morning Shift" : "☀️ Day Shift"}</span>
                  <button className="reg-btn" style={{ marginLeft: "auto", padding: "6px 14px", fontSize: "0.82rem" }} onClick={() => navigate("/bus-tracker")}>
                    Track Now →
                  </button>
                </div>
              ) : busStatus ? (
                <div className="bus-status-row">
                  <span className="bus-status-pill offline-pill">⚠️ {busStatus.route} bus is currently offline</span>
                  <span className="bus-status-info">Driver not sharing location</span>
                </div>
              ) : (
                <div className="bus-status-row">
                  <span className="bus-status-pill wait-pill">📡 Waiting for {registration.today_route || registration.route} bus location...</span>
                  <button className="reg-btn" style={{ marginLeft: "auto", padding: "6px 14px", fontSize: "0.82rem" }} onClick={() => navigate("/bus-tracker")}>
                    Open Tracker →
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="dash-card">
            <div className="card-header">
              <h2>My Profile</h2>
              {!editMode
                ? <button className="edit-btn" onClick={() => setEditMode(true)}><Pencil size={14} style={{verticalAlign:"middle",marginRight:4}} />Edit</button>
                : <div className="edit-actions">
                    <button className="save-btn" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "✓ Save"}</button>
                    <button className="cancel-btn" onClick={() => { setEditMode(false); setEditForm(profile); }}>✕ Cancel</button>
                  </div>
              }
            </div>

            <div className="profile-grid">
              {[
                { label: "Full Name", key: "name", type: "text" },
                { label: "Email", key: "email", type: "email", readOnly: true },
                { label: "Phone", key: "phone", type: "text" },
                { label: "Student ID", key: "student_id", type: "text" },
                { label: "Semester", key: "semester", type: "text" },
                { label: "Department", key: "department", type: "text" },
              ].map(({ label, key, type, readOnly }) => (
                <div className="profile-field" key={key}>
                  <label>{label}</label>
                  {editMode && !readOnly
                    ? <input type={type} value={editForm[key] || ""} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} />
                    : <span>{profile?.[key] || "—"}</span>
                  }
                </div>
              ))}
              <div className="profile-field">
                <label>Member Since</label>
                <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          </div>

          <div className="dash-card">
            <div className="card-header">
              <h2>Bus Registration</h2>
              {registration && (
                <button className="edit-btn" onClick={() => navigate("/payment")}>
                  <RefreshCw size={14} style={{verticalAlign:"middle",marginRight:4}} />Change Shift
                </button>
              )}
            </div>

            {registration ? (
              <div className="reg-details">
                <div className="reg-badge active-badge">Active Registration</div>
                {[
                  ["Shift (Today)", (registration.today_shift || registration.shift)
                    ? ((registration.today_shift || registration.shift).charAt(0).toUpperCase() + (registration.today_shift || registration.shift).slice(1)) + " Shift"
                    : "—"],
                  ["Route", registration.today_route || registration.route],
                  ["Bus Stop", registration.today_bus_stop || registration.bus_stop],
                  ["Amount Paid", `Rs. ${registration.amount}`],
                  ["Transaction ID", registration.transaction_id],
                  ["Payment Method", registration.payment_method?.replace("_"," ")],
                  ["Registered On", new Date(registration.payment_date).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div className="reg-row" key={label}>
                    <span>{label}</span>
                    <strong className="capitalize">{value || "—"}</strong>
                  </div>
                ))}

                {/* Expiry row */}
                <div className="reg-row">
                  <span><Calendar size={13} style={{verticalAlign:"middle",marginRight:4}} />Pass Expires</span>
                  <strong style={{ color: isExpiringSoon ? "#dc2626" : "#16a34a" }}>
                    {expiresAt ? expiresAt.toLocaleDateString() : "—"}
                    {daysLeft !== null ? ` (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left)` : ""}
                  </strong>
                </div>

                <div className="reg-note">
                  <p><Pin size={13} style={{verticalAlign:"middle",marginRight:4}} />Show your Student ID at bus entry. You can change your shift daily from the Payment page.</p>
                </div>
                <button className="reg-btn" style={{marginTop:"1rem", background:"#2563eb"}} onClick={() => navigate("/bus-tracker")}>
                  🚌 Track My Bus Live →
                </button>
              </div>
            ) : (
              <div className="no-reg">
                <span className="no-reg-icon"><Bus size={48} /></span>
                <h3>{latestExpired ? "Pass Expired" : "No Active Registration"}</h3>
                <p>
                  {latestExpired
                    ? "Your monthly bus pass has expired. Renew to continue using the bus service."
                    : "You haven't registered for a bus yet. Pay the monthly fee to get your bus pass."}
                </p>
                <button className="reg-btn" onClick={() => navigate("/payment")}>
                  {latestExpired ? "Renew Pass →" : "Register & Pay Now"}
                </button>
              </div>
            )}
          </div>

          <div className="dash-card full-width-card">
            <div className="card-header">
              <h2>Payment History</h2>
            </div>

            {payments.length > 0 ? (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Shift</th>
                      <th>Route</th>
                      <th>Paid On</th>
                      <th>Expires On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const exp = p.expires_at ? new Date(p.expires_at) : null;
                      const expired = exp && exp < new Date();
                      return (
                        <tr key={p.id}>
                          <td className="mono">{p.transaction_id}</td>
                          <td>Rs. {p.amount}</td>
                          <td className="capitalize">{p.payment_method?.replace("_"," ")}</td>
                          <td className="capitalize">{p.shift || "—"}</td>
                          <td>{p.route || "—"}</td>
                          <td>{new Date(p.created_at).toLocaleDateString()}</td>
                          <td style={{ color: expired ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                            {exp ? exp.toLocaleDateString() : "—"}
                            {expired ? " ⚠ Expired" : ""}
                          </td>
                          <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p><CreditCard size={16} style={{verticalAlign:"middle",marginRight:6}} />No payment records found.</p>
                <button className="reg-btn" onClick={() => navigate("/payment")}>Make a Payment</button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
