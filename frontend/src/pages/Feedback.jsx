import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import { CheckCircle, XCircle, MessageSquare, Pin, Phone, Mail, Clock, MapPin } from "lucide-react";
import "../styles/Feedback.css";

function Feedback() {
  const [form, setForm] = useState({ subject: "", message: "", rating: 5 });
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/feedback/my")
      .then((res) => setMyFeedbacks(res.data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.subject || !form.message) return setError("Subject and message are required.");
    setLoading(true);
    try {
      const res = await api.post("/feedback", form);
      setSuccess(res.data.message);
      setForm({ subject: "", message: "", rating: 5 });
      const updated = await api.get("/feedback/my");
      setMyFeedbacks(updated.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return [1,2,3,4,5].map((star) => (
      <span
        key={star}
        className={`star ${star <= rating ? "filled" : ""} ${interactive ? "clickable" : ""}`}
        onClick={interactive ? () => setForm({...form, rating: star}) : undefined}
      >★</span>
    ));
  };

  return (
    <div className="fb-page">
      <Navbar />

      <div className="fb-header">
        <h1>Feedback & Support</h1>
        <p>Share your experience or report issues with the bus service</p>
      </div>

      <div className="fb-container">
        <div className="fb-grid">
          <div className="fb-card">
            <h2>Submit Feedback</h2>
            <p className="fb-sub">Your feedback helps us improve the bus service for everyone.</p>

            {success && <div className="fb-success"><CheckCircle size={16} style={{verticalAlign:"middle",marginRight:6}} />{success}</div>}
            {error && <div className="fb-error"><XCircle size={16} style={{verticalAlign:"middle",marginRight:6}} />{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="fb-group">
                <label>Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Bus was late on Dharan route"
                  value={form.subject}
                  onChange={(e) => setForm({...form, subject: e.target.value})}
                  required
                />
              </div>

              <div className="fb-group">
                <label>Your Rating *</label>
                <div className="stars-row">
                  {renderStars(form.rating, true)}
                  <span className="rating-label">
                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][form.rating]}
                  </span>
                </div>
              </div>

              <div className="fb-group">
                <label>Message *</label>
                <textarea
                  placeholder="Describe your feedback, suggestion, or complaint in detail..."
                  value={form.message}
                  onChange={(e) => setForm({...form, message: e.target.value})}
                  rows={5}
                  required
                />
              </div>

              <button type="submit" className="fb-submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>

          <div className="fb-tips">
            <div className="tip-card">
              <h3><Pin size={16} style={{verticalAlign:"middle",marginRight:6}} />Feedback Guidelines</h3>
              <ul>
                <li>Be specific about the route and date</li>
                <li>Include bus stop name if relevant</li>
                <li>Describe the issue clearly</li>
                <li>Feedback is reviewed within 2–3 working days</li>
                <li>Admin replies will appear below</li>
              </ul>
            </div>

            <div className="tip-card contact-card">
              <h3><Phone size={16} style={{verticalAlign:"middle",marginRight:6}} />Direct Contact</h3>
              <div className="contact-row"><span><Mail size={14} style={{verticalAlign:"middle",marginRight:4}} />Email</span><strong>admin@iic.edu.np</strong></div>
              <div className="contact-row"><span><Phone size={14} style={{verticalAlign:"middle",marginRight:4}} />Phone</span><strong>025-534962</strong></div>
              <div className="contact-row"><span><Clock size={14} style={{verticalAlign:"middle",marginRight:4}} />Hours</span><strong>10 AM – 4 PM (Sun–Fri)</strong></div>
              <div className="contact-row"><span><MapPin size={14} style={{verticalAlign:"middle",marginRight:4}} />Office</span><strong>Ground Floor, Admin Block</strong></div>
            </div>
          </div>
        </div>

        <div className="my-feedbacks">
          <h2>My Previous Feedback</h2>

          {fetching ? (
            <div className="fb-loading">Loading feedback history...</div>
          ) : myFeedbacks.length === 0 ? (
            <div className="no-feedback">
              <MessageSquare size={40} />
              <p>You haven't submitted any feedback yet.</p>
            </div>
          ) : (
            <div className="feedback-list">
              {myFeedbacks.map((fb) => (
                <div className="feedback-item" key={fb.id}>
                  <div className="fb-item-header">
                    <div>
                      <h4>{fb.subject}</h4>
                      <div className="fb-meta">
                        <span className="fb-stars">{renderStars(fb.rating)}</span>
                        <span className="fb-date">{new Date(fb.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`fb-status-badge ${fb.status === "replied" ? "replied" : "pending"}`}>
                      {fb.status === "replied" ? "✓ Replied" : "Pending"}
                    </span>
                  </div>
                  <p className="fb-message">{fb.message}</p>
                  {fb.admin_reply && (
                    <div className="admin-reply">
                      <strong>Admin Response:</strong>
                      <p>{fb.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Feedback;
