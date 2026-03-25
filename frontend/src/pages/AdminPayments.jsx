import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import { DollarSign, CheckCircle, CreditCard, Search } from "lucide-react";
import "../styles/AdminStudents.css";
import "../styles/AdminPayments.css";

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterShift, setFilterShift] = useState("");

  useEffect(() => {
    api.get("/payment/all")
      .then((res) => { setPayments(res.data); setFiltered(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = [...payments];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.student_id?.toLowerCase().includes(q) ||
        p.transaction_id?.toLowerCase().includes(q)
      );
    }
    if (filterMethod) data = data.filter(p => p.payment_method === filterMethod);
    if (filterShift) data = data.filter(p => p.shift === filterShift);
    setFiltered(data);
  }, [search, filterMethod, filterShift, payments]);

  if (loading) {
    return (
      <div className="as-page"><Navbar />
        <div className="as-loading"><div className="spinner" /><p>Loading payments...</p></div>
      </div>
    );
  }

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const uniqueMethods = [...new Set(payments.map(p => p.payment_method).filter(Boolean))];

  return (
    <div className="as-page">
      <Navbar />

      <div className="as-header">
        <h1>Payment Details</h1>
        <p>View all student payment transactions</p>
      </div>

      <div className="as-container">

        <div className="as-summary">
          <div className="sum-card">
            <span className="sum-icon"><DollarSign size={22} /></span>
            <div><p className="sum-label">Total Revenue</p><p className="sum-val">Rs. {totalRevenue.toLocaleString()}</p></div>
          </div>
          <div className="sum-card">
            <span className="sum-icon"><CheckCircle size={22} /></span>
            <div><p className="sum-label">Total Payments</p><p className="sum-val">{payments.length}</p></div>
          </div>
          <div className="sum-card">
            <span className="sum-icon"><CreditCard size={22} /></span>
            <div><p className="sum-label">Payment Methods</p><p className="sum-val">{uniqueMethods.length}</p></div>
          </div>
          <div className="sum-card">
            <span className="sum-icon"><Search size={22} /></span>
            <div><p className="sum-label">Showing</p><p className="sum-val">{filtered.length}</p></div>
          </div>
        </div>

        <div className="as-filters">
          <input
            className="search-input"
            placeholder="Search by name, email, student ID, transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="online">Online</option>
            <option value="esewa">eSewa</option>
            <option value="khalti">Khalti</option>
          </select>
          <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)}>
            <option value="">All Shifts</option>
            <option value="morning">Morning</option>
            <option value="day">Day</option>
          </select>
          <button className="clear-btn" onClick={() => { setSearch(""); setFilterMethod(""); setFilterShift(""); }}>
            Clear Filters
          </button>
        </div>

        <div className="as-table-wrap">
          <table className="as-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Shift</th>
                <th>Route</th>
                <th>Bus Stop</th>
                <th>Status</th>
                <th>Paid On</th>
                <th>Expires On</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="empty-row">No payments found</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td className="name-cell">
                    <div className="avatar-sm">{p.name?.[0]?.toUpperCase() || "?"}</div>
                    {p.name}
                  </td>
                  <td>{p.email}</td>
                  <td>{p.student_id || "—"}</td>
                  <td className="mono">{p.transaction_id}</td>
                  <td className="amount-cell">Rs. {Number(p.amount).toLocaleString()}</td>
                  <td className="capitalize">{p.payment_method?.replace(/_/g, " ")}</td>
                  <td className="capitalize">{p.shift || "—"}</td>
                  <td>{p.route || "—"}</td>
                  <td>{p.bus_stop || "—"}</td>
                  <td>
                    <span className={`badge ${p.status === "completed" ? "active" : "inactive"}`}>
                      {p.status || "pending"}
                    </span>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td style={{color: p.expires_at && new Date(p.expires_at) < new Date() ? '#dc2626' : '#16a34a', fontWeight:600}}>
                          {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}
                          {p.expires_at && new Date(p.expires_at) < new Date() ? ' ⚠' : ''}
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

export default AdminPayments;
