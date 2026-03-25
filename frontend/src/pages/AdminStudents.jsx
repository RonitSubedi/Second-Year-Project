import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import { Users, CheckCircle, XCircle, List } from "lucide-react";
import "../styles/AdminStudents.css";

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRoute, setFilterRoute] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [filterReg, setFilterReg] = useState("");

  useEffect(() => {
    api.get("/user/students")
      .then((res) => { setStudents(res.data); setFiltered(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = [...students];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q)
      );
    }
    if (filterRoute) data = data.filter(s => s.route === filterRoute);
    if (filterShift) data = data.filter(s => s.shift === filterShift);
    if (filterReg === "registered") data = data.filter(s => s.reg_status === "active");
    if (filterReg === "unregistered") data = data.filter(s => !s.reg_status);
    setFiltered(data);
  }, [search, filterRoute, filterShift, filterReg, students]);

  if (loading) {
    return (
      <div className="as-page"><Navbar />
        <div className="as-loading"><div className="spinner" /><p>Loading students...</p></div>
      </div>
    );
  }

  const registered = students.filter(s => s.reg_status === "active").length;

  return (
    <div className="as-page">
      <Navbar />

      <div className="as-header">
        <h1>Student Management</h1>
        <p>View all registered and unregistered students</p>
      </div>

      <div className="as-container">

        <div className="as-summary">
          <div className="sum-card"><span className="sum-icon"><Users size={22} /></span><div><p className="sum-label">Total Students</p><p className="sum-val">{students.length}</p></div></div>
          <div className="sum-card"><span className="sum-icon"><CheckCircle size={22} /></span><div><p className="sum-label">Registered</p><p className="sum-val">{registered}</p></div></div>
          <div className="sum-card"><span className="sum-icon"><XCircle size={22} /></span><div><p className="sum-label">Unregistered</p><p className="sum-val">{students.length - registered}</p></div></div>
          <div className="sum-card"><span className="sum-icon"><List size={22} /></span><div><p className="sum-label">Showing</p><p className="sum-val">{filtered.length}</p></div></div>
        </div>

        <div className="as-filters">
          <input
            className="search-input"
            placeholder="Search by name, email, student ID..."
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
          <select value={filterReg} onChange={(e) => setFilterReg(e.target.value)}>
            <option value="">All Students</option>
            <option value="registered">Registered Only</option>
            <option value="unregistered">Unregistered Only</option>
          </select>
          <button className="clear-btn" onClick={() => { setSearch(""); setFilterRoute(""); setFilterShift(""); setFilterReg(""); }}>
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
                <th>Department</th>
                <th>Semester</th>
                <th>Shift</th>
                <th>Route</th>
                <th>Bus Stop</th>
                <th>Bus Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="empty-row">No students found</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="name-cell">
                    <div className="avatar-sm">{s.name?.[0]?.toUpperCase() || "?"}</div>
                    {s.name}
                  </td>
                  <td>{s.email}</td>
                  <td>{s.student_id || "—"}</td>
                  <td>{s.department || "—"}</td>
                  <td>{s.semester || "—"}</td>
                  <td className="capitalize">{s.shift || "—"}</td>
                  <td>{s.route || "—"}</td>
                  <td>{s.bus_stop || "—"}</td>
                  <td>
                    {s.reg_status === "active" ? (
                      <span className="badge active">Active</span>
                    ) : (
                      <span className="badge inactive">Not Registered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default AdminStudents;
