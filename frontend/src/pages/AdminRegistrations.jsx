import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import { Bus, CheckCircle, XCircle, Search } from "lucide-react";
import "../styles/AdminStudents.css";

function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRoute, setFilterRoute] = useState("");
  const [filterShift, setFilterShift] = useState("");

  useEffect(() => {
    api.get("/registration/all")
      .then((res) => { setRegistrations(res.data); setFiltered(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = [...registrations];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.student_id?.toLowerCase().includes(q) ||
        r.route?.toLowerCase().includes(q)
      );
    }
    if (filterRoute) data = data.filter(r => r.route === filterRoute);
    if (filterShift) data = data.filter(r => r.shift === filterShift);
    setFiltered(data);
  }, [search, filterRoute, filterShift, registrations]);

  if (loading) {
    return (
      <div className="as-page"><Navbar />
        <div className="as-loading"><div className="spinner" /><p>Loading registrations...</p></div>
      </div>
    );
  }

  const morning = registrations.filter(r => r.shift === "morning").length;
  const day = registrations.filter(r => r.shift === "day").length;

  return (
    <div className="as-page">
      <Navbar />

      <div className="as-header">
        <h1>Bus Registrations</h1>
        <p>View all active bus registrations</p>
      </div>

      <div className="as-container">

        <div className="as-summary">
          <div className="sum-card">
            <span className="sum-icon"><Bus size={22} /></span>
            <div><p className="sum-label">Total Registrations</p><p className="sum-val">{registrations.length}</p></div>
          </div>
          <div className="sum-card">
            <span className="sum-icon"><CheckCircle size={22} /></span>
            <div><p className="sum-label">Morning Shift</p><p className="sum-val">{morning}</p></div>
          </div>
          <div className="sum-card">
            <span className="sum-icon"><XCircle size={22} /></span>
            <div><p className="sum-label">Day Shift</p><p className="sum-val">{day}</p></div>
          </div>
          <div className="sum-card">
            <span className="sum-icon"><Search size={22} /></span>
            <div><p className="sum-label">Showing</p><p className="sum-val">{filtered.length}</p></div>
          </div>
        </div>

        <div className="as-filters">
          <input
            className="search-input"
            placeholder="Search by name, email, student ID, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)}>
            <option value="">All Routes</option>
            <option>Biratnagar</option><option>Damak</option><option>Dharan</option><option>Inaruwa</option>
          </select>
          <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}>
            <option value="">All Shifts</option>
            <option value="morning">Morning</option>
            <option value="day">Day</option>
          </select>
          <button className="clear-btn" onClick={() => { setSearch(""); setFilterRoute(""); setFilterShift(""); }}>
            Clear Filters
          </button>
        </div>

        <div className="as-table-wrap">
          <table className="as-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Shift</th>
                <th>Route</th>
                <th>Bus Stop</th>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Registered On</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="empty-row">No registrations found</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td className="name-cell">
                    <div className="avatar-sm">{r.name?.[0]?.toUpperCase() || "?"}</div>
                    {r.name}
                  </td>
                  <td>{r.email}</td>
                  <td>{r.student_id || "—"}</td>
                  <td className="capitalize">{r.shift}</td>
                  <td>{r.route}</td>
                  <td>{r.bus_stop}</td>
                  <td className="mono">{r.transaction_id}</td>
                  <td>Rs. {r.amount}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default AdminRegistrations;
