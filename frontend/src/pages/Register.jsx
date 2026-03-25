import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { Bus, User, Mail, Lock, Phone, GraduationCap, CalendarDays, Building2, AlertTriangle, Users } from "lucide-react";
import "../styles/Register.css";

function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    phone: "", studentId: "", semester: "", department: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentCount, setStudentCount] = useState(null);
  const navigate = useNavigate();

  const STUDENT_LIMIT = 1400;

  useEffect(() => {
    api.get("/auth/student-count")
      .then(res => setStudentCount(res.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // All fields required
    if (!form.name || !form.email || !form.password || !form.confirmPassword ||
        !form.phone || !form.studentId || !form.semester || !form.department) {
      return setError("All fields are required. Please fill in every field to register.");
    }
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (!/^[0-9]{10}$/.test(form.phone)) return setError("Phone number must be exactly 10 digits");

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, studentId: form.studentId,
        semester: form.semester, department: form.department,
      });
      alert(`Account created successfully! (${res.data.registered} of ${STUDENT_LIMIT} students registered)\nPlease login.`);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const isFull = studentCount?.isFull;

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle c1"></div>
        <div className="auth-bg-circle c2"></div>
      </div>

      <div className="auth-container reg-container">
        <div className="auth-brand">
          <div className="auth-brand-icon"><Bus size={24} /></div>
          <div>
            <span className="auth-brand-name">Itahari International College</span>
            <span className="auth-brand-sub">Bus Management System</span>
          </div>
        </div>

        <div className="auth-card reg-card">
          <div className="auth-card-header">
            <h2>Create Account</h2>
            <p>Fill in <strong>all details</strong> to register for IIC bus service</p>
          </div>

          {/* Student seat counter */}
          {studentCount && (
            <div className={`seat-counter ${isFull ? "seat-full" : studentCount.remaining < 50 ? "seat-low" : "seat-ok"}`}>
              <Users size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
              <strong>{studentCount.registered}</strong> / {STUDENT_LIMIT} students registered
              {isFull
                ? " — Registration CLOSED (limit reached)"
                : ` — ${studentCount.remaining} seats remaining`}
            </div>
          )}

          {error && (
            <div className="auth-error">
              <AlertTriangle size={16} style={{verticalAlign:"middle", marginRight:6}} />{error}
            </div>
          )}

          {isFull ? (
            <div className="auth-error" style={{ textAlign: "center", padding: "2rem" }}>
              <AlertTriangle size={32} style={{ display: "block", margin: "0 auto 1rem" }} />
              <strong>Registration is closed.</strong><br />
              The maximum limit of {STUDENT_LIMIT} students has been reached.<br />
              Please contact the college administration.
            </div>
          ) : (
            <form onSubmit={handleRegister} autoComplete="off">
              <div className="reg-grid">
                <div className="auth-field">
                  <label>Full Name <span className="req">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><User size={16} /></span>
                    <input name="name" placeholder="Your full name" value={form.name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="auth-field">
                  <label>Email Address <span className="req">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Mail size={16} /></span>
                    <input type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="reg-grid">
                <div className="auth-field">
                  <label>Password <span className="req">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Lock size={16} /></span>
                    <input type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} autoComplete="new-password" required />
                  </div>
                </div>
                <div className="auth-field">
                  <label>Confirm Password <span className="req">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Lock size={16} /></span>
                    <input type="password" name="confirmPassword" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" required />
                  </div>
                </div>
              </div>

              <div className="reg-grid">
                <div className="auth-field">
                  <label>Phone Number <span className="req">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Phone size={16} /></span>
                    <input name="phone" placeholder="98XXXXXXXX (10 digits)" value={form.phone} onChange={handleChange} required maxLength={10} />
                  </div>
                </div>
                <div className="auth-field">
                  <label>Student ID <span className="req">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><GraduationCap size={16} /></span>
                    <input name="studentId" placeholder="e.g. IIC-2024-001" value={form.studentId} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="reg-grid">
                <div className="auth-field">
                  <label>Semester <span className="req">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><CalendarDays size={16} /></span>
                    <select name="semester" value={form.semester} onChange={handleChange} className="auth-select" required>
                      <option value="">Select Semester</option>
                      {[1,2,3,4,5,6].map(s => (
                        <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Department <span className="req">*</span></label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon"><Building2 size={16} /></span>
                    <select name="department" value={form.department} onChange={handleChange} className="auth-select" required>
                      <option value="">Select Department</option>
                      <option>BBA</option><option>BIT</option>
                    </select>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.5rem" }}>
                <span className="req">*</span> All fields are required
              </p>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-spinner"></span> : "Create Account →"}
              </button>
            </form>
          )}

          <div className="auth-divider"><span>Already have an account?</span></div>
          <Link to="/login" className="auth-alt-btn">Sign In</Link>
        </div>

        <Link to="/" className="auth-back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default Register;
