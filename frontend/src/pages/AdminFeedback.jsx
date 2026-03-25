import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import { MessageSquare, Clock, CheckCircle, Pencil } from "lucide-react";
import "../styles/AdminFeedback.css";

function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    api.get("/feedback/all")
      .then((res) => setFeedbacks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReply = async (id) => {
    if (!replyText.trim()) return alert("Reply cannot be empty");
    setSending(true);
    try {
      await api.put(`/feedback/${id}/reply`, { reply: replyText });
      setFeedbacks(prev =>
        prev.map(fb => fb.id === id ? { ...fb, admin_reply: replyText, status: "replied" } : fb)
      );
      setReplyTarget(null);
      setReplyText("");
    } catch {
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const renderStars = (rating) =>
    [1,2,3,4,5].map(s => (
      <span key={s} style={{ color: s <= rating ? "#f59e0b" : "#d1d5db", fontSize: "16px" }}>★</span>
    ));

  const displayed = filterStatus
    ? feedbacks.filter(fb => fb.status === filterStatus)
    : feedbacks;

  const pending = feedbacks.filter(fb => fb.status === "pending").length;
  const replied = feedbacks.filter(fb => fb.status === "replied").length;

  if (loading) {
    return (
      <div className="af-page"><Navbar />
        <div className="af-loading"><div className="spinner" /><p>Loading feedback...</p></div>
      </div>
    );
  }

  return (
    <div className="af-page">
      <Navbar />

      <div className="af-header">
        <h1>Feedback Management</h1>
        <p>Review and respond to student feedback</p>
      </div>

      <div className="af-container">

        <div className="af-summary">
          <div className="afs-card"><span><MessageSquare size={22} /></span><div><p>Total Feedback</p><strong>{feedbacks.length}</strong></div></div>
          <div className="afs-card pending-card"><span><Clock size={22} /></span><div><p>Pending Reply</p><strong>{pending}</strong></div></div>
          <div className="afs-card replied-card"><span><CheckCircle size={22} /></span><div><p>Replied</p><strong>{replied}</strong></div></div>
        </div>

        <div className="af-filters">
          <label>Filter by Status:</label>
          <button className={`filter-btn ${filterStatus === "" ? "active" : ""}`} onClick={() => setFilterStatus("")}>All ({feedbacks.length})</button>
          <button className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`} onClick={() => setFilterStatus("pending")}><Clock size={13} style={{verticalAlign:"middle",marginRight:4}} />Pending ({pending})</button>
          <button className={`filter-btn ${filterStatus === "replied" ? "active" : ""}`} onClick={() => setFilterStatus("replied")}><CheckCircle size={13} style={{verticalAlign:"middle",marginRight:4}} />Replied ({replied})</button>
        </div>

        {displayed.length === 0 ? (
          <div className="no-fb"><MessageSquare size={40} /><p>No feedback found</p></div>
        ) : (
          <div className="fb-list">
            {displayed.map((fb) => (
              <div className="fb-card" key={fb.id}>
                <div className="fb-top">
                  <div className="fb-user">
                    <div className="fb-avatar">{fb.name?.[0]?.toUpperCase() || "?"}</div>
                    <div>
                      <p className="fb-name">{fb.name}</p>
                      <p className="fb-email">{fb.email} {fb.student_id ? `· ${fb.student_id}` : ""}</p>
                    </div>
                  </div>
                  <div className="fb-meta-right">
                    <div className="fb-stars">{renderStars(fb.rating)}</div>
                    <span className={`fb-badge ${fb.status}`}>{fb.status === "replied" ? "✓ Replied" : "Pending"}</span>
                    <span className="fb-date">{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="fb-subject"><strong>Subject:</strong> {fb.subject}</div>
                <p className="fb-msg">{fb.message}</p>

                {fb.admin_reply && (
                  <div className="admin-reply-box">
                    <strong>Your Reply:</strong>
                    <p>{fb.admin_reply}</p>
                  </div>
                )}

                {replyTarget === fb.id ? (
                  <div className="reply-form">
                    <textarea
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                    />
                    <div className="reply-actions">
                      <button className="send-btn" onClick={() => handleReply(fb.id)} disabled={sending}>
                        {sending ? "Sending..." : "Send Reply"}
                      </button>
                      <button className="cancel-reply-btn" onClick={() => { setReplyTarget(null); setReplyText(""); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="reply-btn" onClick={() => { setReplyTarget(fb.id); setReplyText(fb.admin_reply || ""); }}>
                    {fb.admin_reply ? <><Pencil size={14} style={{verticalAlign:"middle",marginRight:4}} />Edit Reply</> : <><MessageSquare size={14} style={{verticalAlign:"middle",marginRight:4}} />Reply</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminFeedback;
