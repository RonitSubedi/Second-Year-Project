import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
import { CheckCircle, Bus, Lock, FileText, Sunrise, Sun, RefreshCw, AlertTriangle, Calendar } from "lucide-react";
import "../styles/Payment.css";

const BUS_FEE = 8500;

const PAYMENT_METHODS = [
  { id: "esewa",         label: "eSewa",          color: "#60bb46", desc: "Pay via eSewa digital wallet" },
  { id: "khalti",        label: "Khalti",          color: "#5c2d91", desc: "Pay via Khalti digital wallet" },
  { id: "ime_pay",       label: "IME Pay",         color: "#e53935", desc: "Pay via IME Pay" },
  { id: "bank_transfer", label: "Bank Transfer",   color: "#1a2744", desc: "Direct bank transfer to IIC account" },
  { id: "cash",          label: "Cash at College", color: "#059669", desc: "Pay cash at IIC accounts office" },
];

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const preSelected = location.state || {};

  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [form, setForm] = useState({
    shift: preSelected.shift || "morning",
    route: preSelected.route || "",
    busStop: preSelected.busStop || "",
    transactionRef: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [existingReg, setExistingReg] = useState(null);
  const [checkingReg, setCheckingReg] = useState(true);
  // When payment is expired or null — allow fresh payment
  const [paymentExpired, setPaymentExpired] = useState(false);

  const pickups = {
    Biratnagar: ["Koshi Project","Roadcess","Bus Park","Mahendra Chowk","Bhrikuti Chowk","Bargachi","Kanchanbari","Oil Nigam","Birat Health","Tanki Sinwari","Nemuwa","NIC Asia Duhabi","Duhabi","Sonapur","Kadamgacchi","Khanar","Reliance","Sathi Petrol Pump","Nabil Bank"],
    Damak: ["Kerkha","Sitapuri","Padajungi","Damak Chowk","Urlabari","Aitabare","Mangalbare","Pathari","Kanepokhari","Bhaunne","Laxmi Marga","Betana","Belbari","Lalbhitti","Khorsane","BiratChowk","Salakpur","Gothgaun"],
    Dharan: ["BPKIHS","Railway Chowk","Mangalbare","Kalyan Chowk","Sami Chowk","Amarhat","Bhanu Chowk","Bargachi","Langali Chowk","Tarahara","Pipal Chowk","Itahari Chowk"],
    Inaruwa: ["Madhesha","Jhakan Jhora","Balaha","Gol Chowk","Mahendra Chowk","Haleshi Chowk","Titriban Chowk","Jhumka","Kanchi Chowk","Bhatbhateni","Balgram","Pachrukhi","Kalanki Chowk","Paragati Chowk","Itahari Chowk"],
  };

  useEffect(() => {
    api.get("/registration/my")
      .then((res) => {
        if (res.data) {
          // Check if payment has expired
          const exp = new Date(res.data.expires_at);
          if (exp < new Date()) {
            setPaymentExpired(true);
            setExistingReg(null);
          } else {
            setExistingReg(res.data);
          }
        }
        setCheckingReg(false);
      })
      .catch(() => setCheckingReg(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.route || !form.busStop || !selectedMethod) return setError("Please fill all required fields.");
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/payment/initiate", {
        amount: BUS_FEE, paymentMethod: selectedMethod,
        shift: form.shift, route: form.route, busStop: form.busStop,
      });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Change today's shift (already paid, valid registration)
  const handleShiftChange = async () => {
    if (!form.route || !form.busStop) return setError("Please select route and bus stop.");
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/payment/initiate", {
        amount: BUS_FEE, paymentMethod: "cash", // method ignored for shift change
        shift: form.shift, route: form.route, busStop: form.busStop,
      });
      setSuccess({ ...res.data, shiftChangeOnly: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update shift.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingReg) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-loading"><div className="spinner" /><p>Checking registration status...</p></div>
      </div>
    );
  }

  // Payment expired — show renewal notice, then fall through to payment form
  // (paymentExpired=true, existingReg=null, so the form renders below)

  // Active valid registration — show daily shift change panel
  if (existingReg) {
    const expiresAt = new Date(existingReg.expires_at);
    const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));

    if (success) {
      return (
        <div className="payment-page">
          <Navbar />
          <div className="payment-container">
            <div className="success-card">
              <div className="success-icon"><CheckCircle size={64} color="#16a34a" /></div>
              <h2>Today's Shift Updated!</h2>
              <p>Your shift for today has been updated successfully.</p>
              <div className="receipt">
                <div className="receipt-header"><h3>Today's Schedule</h3><span>{new Date().toLocaleDateString()}</span></div>
                <div className="receipt-body">
                  <div className="receipt-row"><span>Shift</span><strong className="capitalize">{success.details.shift} Shift</strong></div>
                  <div className="receipt-row"><span>Route</span><strong>{success.details.route}</strong></div>
                  <div className="receipt-row"><span>Bus Stop</span><strong>{success.details.busStop}</strong></div>
                  <div className="receipt-row"><span>Valid Until</span><strong>{expiresAt.toLocaleDateString()}</strong></div>
                </div>
              </div>
              <button className="btn-dash" onClick={() => navigate("/dashboard")}>Go to My Dashboard</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-container">
          <div className="already-registered">
            <div className="already-icon"><CheckCircle size={56} color="#16a34a" /></div>
            <h2>Active Registration</h2>
            <p>You have a valid bus pass. <strong>You can change your shift daily</strong> — your payment covers the full month.</p>

            <div className="reg-summary">
              <div className="reg-row"><span>Amount Paid</span><strong>Rs. {existingReg.amount}</strong></div>
              <div className="reg-row"><span>Transaction ID</span><strong>{existingReg.transaction_id}</strong></div>
              <div className="reg-row">
                <span>Expires On</span>
                <strong style={{ color: daysLeft <= 7 ? "#dc2626" : "#16a34a" }}>
                  {expiresAt.toLocaleDateString()} ({daysLeft} day{daysLeft !== 1 ? "s" : ""} left)
                </strong>
              </div>
              <div className="reg-row"><span>Status</span><strong className="status-active">Active ✓</strong></div>
            </div>

            {daysLeft <= 7 && (
              <div className="expiry-warning">
                <AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Your pass expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}! Renew soon.
              </div>
            )}

            {/* Today's shift selection */}
            <div className="shift-change-panel">
              <h3><RefreshCw size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Change Today's Shift</h3>
              <p>Your routine changes daily — select today's preferred shift, route, and stop.</p>

              <div className="form-group">
                <label>Today's Shift *</label>
                <div className="shift-toggle">
                  <button className={`toggle-btn ${form.shift === "morning" ? "active" : ""}`} onClick={() => setForm({...form, shift: "morning"})}>
                    <Sunrise size={15} style={{verticalAlign:"middle",marginRight:5}} />Morning (6:00 AM)
                  </button>
                  <button className={`toggle-btn ${form.shift === "day" ? "active" : ""}`} onClick={() => setForm({...form, shift: "day"})}>
                    <Sun size={15} style={{verticalAlign:"middle",marginRight:5}} />Day (11:00 AM)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Route *</label>
                <select name="route" value={form.route} onChange={(e) => setForm({...form, route: e.target.value, busStop: ""})}>
                  <option value="">— Select Route —</option>
                  <option>Biratnagar</option><option>Damak</option><option>Dharan</option><option>Inaruwa</option>
                </select>
              </div>

              <div className="form-group">
                <label>Bus Stop *</label>
                <select name="busStop" value={form.busStop} onChange={handleChange} disabled={!form.route}>
                  <option value="">— Select Bus Stop —</option>
                  {form.route && pickups[form.route]?.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {error && <div className="form-error-box">{error}</div>}

              <button className="pay-btn" onClick={handleShiftChange} disabled={loading} style={{ marginTop: "1rem" }}>
                {loading ? "Updating..." : "Update Today's Shift →"}
              </button>
            </div>

            <button className="btn-dash" style={{ marginTop: "1rem" }} onClick={() => navigate("/dashboard")}>Go to My Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="payment-page">
        <Navbar />
        <div className="payment-container">
          <div className="success-card">
            <div className="success-icon"><CheckCircle size={64} color="#16a34a" /></div>
            <h2>Payment Successful!</h2>
            <p>Your bus pass is valid for <strong>1 month</strong>. You can change your shift daily.</p>
            <div className="receipt">
              <div className="receipt-header">
                <h3>IIC Bus Receipt</h3>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="receipt-body">
                <div className="receipt-row"><span>Transaction ID</span><strong>{success.transactionId}</strong></div>
                <div className="receipt-row"><span>Shift (Today)</span><strong className="capitalize">{success.details.shift} Shift</strong></div>
                <div className="receipt-row"><span>Route</span><strong>{success.details.route}</strong></div>
                <div className="receipt-row"><span>Bus Stop</span><strong>{success.details.busStop}</strong></div>
                <div className="receipt-row"><span>Amount Paid</span><strong>Rs. {success.details.amount}</strong></div>
                <div className="receipt-row"><span>Payment Method</span><strong className="capitalize">{selectedMethod.replace("_"," ")}</strong></div>
                <div className="receipt-row">
                  <span>Valid Until</span>
                  <strong>{success.expiresAt ? new Date(success.expiresAt).toLocaleDateString() : "1 Month"}</strong>
                </div>
                <div className="receipt-row"><span>Status</span><strong className="status-active">Confirmed ✓</strong></div>
              </div>
            </div>
            <button className="btn-dash" onClick={() => navigate("/dashboard")}>Go to My Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <Navbar />

      <div className="payment-header">
        <h1>Bus Fee Payment</h1>
        <p>
          {paymentExpired
            ? "⚠️ Your previous pass has expired. Please renew to continue using the bus service."
            : "Complete payment to register your bus seat — valid for 1 month, change shift daily"}
        </p>
      </div>

      {paymentExpired && (
        <div className="payment-container" style={{ paddingTop: 0 }}>
          <div className="expiry-warning" style={{ marginBottom: "1rem" }}>
            <AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Your bus pass has expired. Please complete a new payment below to renew it.
          </div>
        </div>
      )}

      <div className="payment-container">
        <div className="steps-bar">
          {["Route Selection", "Payment Method", "Confirm & Pay"].map((s, i) => (
            <div key={i} className={`step-item ${step > i + 1 ? "done" : step === i + 1 ? "active" : ""}`}>
              <div className="step-circle">{step > i + 1 ? "✓" : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="payment-body">
          <div className="payment-form">

            {step === 1 && (
              <div className="step-panel">
                <h2>Step 1: Select Route</h2>
                <p className="step-desc">Choose your preferred shift, route, and bus stop.</p>

                <div className="form-group">
                  <label>Shift *</label>
                  <div className="shift-toggle">
                    <button className={`toggle-btn ${form.shift === "morning" ? "active" : ""}`} onClick={() => setForm({...form, shift: "morning"})}>
                      <Sunrise size={15} style={{verticalAlign:"middle",marginRight:5}} />Morning (6:00 AM)
                    </button>
                    <button className={`toggle-btn ${form.shift === "day" ? "active" : ""}`} onClick={() => setForm({...form, shift: "day"})}>
                      <Sun size={15} style={{verticalAlign:"middle",marginRight:5}} />Day (11:00 AM)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Route *</label>
                  <select name="route" value={form.route} onChange={(e) => setForm({...form, route: e.target.value, busStop: ""})}>
                    <option value="">— Select Route —</option>
                    <option>Biratnagar</option><option>Damak</option><option>Dharan</option><option>Inaruwa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bus Stop *</label>
                  <select name="busStop" value={form.busStop} onChange={handleChange} disabled={!form.route}>
                    <option value="">— Select Bus Stop —</option>
                    {form.route && pickups[form.route]?.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <button className="next-btn" onClick={() => { if (!form.route || !form.busStop) return setError("Please select route and bus stop"); setError(""); setStep(2); }}>
                  Next: Payment Method →
                </button>
                {error && <p className="form-error">{error}</p>}
              </div>
            )}

            {step === 2 && (
              <div className="step-panel">
                <h2>Step 2: Choose Payment Method</h2>
                <p className="step-desc">Select how you want to pay the bus fee.</p>

                <div className="method-grid">
                  {PAYMENT_METHODS.map((m) => (
                    <div
                      key={m.id}
                      className={`method-card ${selectedMethod === m.id ? "selected" : ""}`}
                      onClick={() => setSelectedMethod(m.id)}
                      style={{ borderColor: selectedMethod === m.id ? m.color : "" }}
                    >
                      <div className="method-color-dot" style={{background: m.color}}></div>
                      <div>
                        <p className="method-label">{m.label}</p>
                        <p className="method-desc">{m.desc}</p>
                      </div>
                      {selectedMethod === m.id && <span className="method-check">✓</span>}
                    </div>
                  ))}
                </div>

                {["esewa", "khalti", "ime_pay"].includes(selectedMethod) && (
                  <div className="wallet-info">
                    <h4>Enter your {PAYMENT_METHODS.find(m=>m.id===selectedMethod)?.label} Wallet ID</h4>
                    <input name="transactionRef" placeholder="Wallet ID / Registered Mobile" value={form.transactionRef} onChange={handleChange} />
                  </div>
                )}

                {selectedMethod === "bank_transfer" && (
                  <div className="bank-info">
                    <h4>Bank Transfer Details</h4>
                    <div className="bank-detail"><span>Bank</span><strong>NIC Asia Bank</strong></div>
                    <div className="bank-detail"><span>Account Name</span><strong>Itahari International College</strong></div>
                    <div className="bank-detail"><span>Account No.</span><strong>3270001234567890</strong></div>
                    <div className="bank-detail"><span>Branch</span><strong>Itahari Branch</strong></div>
                    <input name="transactionRef" placeholder="Enter your bank transaction reference number" value={form.transactionRef} onChange={handleChange} style={{marginTop:"12px"}} />
                  </div>
                )}

                {selectedMethod === "cash" && (
                  <div className="cash-info">
                    <p>Visit the IIC Accounts Office (Ground Floor) with cash during office hours (10 AM – 4 PM).</p>
                    <p style={{marginTop:"8px"}}>Bring your Student ID card. You'll receive a receipt to show at the bus entry.</p>
                  </div>
                )}

                <div className="step-actions">
                  <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
                  <button className="next-btn" onClick={() => { if (!selectedMethod) return setError("Please select a payment method"); setError(""); setStep(3); }}>
                    Next: Confirm →
                  </button>
                </div>
                {error && <p className="form-error">{error}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="step-panel">
                <h2>Step 3: Confirm & Pay</h2>
                <p className="step-desc">Review your details before confirming payment.</p>

                <div className="confirm-details">
                  <div className="confirm-row"><span>Shift (Today)</span><strong className="capitalize">{form.shift} Shift</strong></div>
                  <div className="confirm-row"><span>Route</span><strong>{form.route}</strong></div>
                  <div className="confirm-row"><span>Bus Stop</span><strong>{form.busStop}</strong></div>
                  <div className="confirm-row"><span>Payment Method</span><strong>{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}</strong></div>
                  <div className="confirm-row"><span>Valid For</span><strong>1 Month (shift changeable daily)</strong></div>
                  <div className="confirm-row total-row"><span>Total Amount</span><strong>Rs. {BUS_FEE.toLocaleString()}</strong></div>
                </div>

                {error && <div className="form-error-box">{error}</div>}

                <div className="step-actions">
                  <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
                  <button className="pay-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Processing..." : `Pay Rs. ${BUS_FEE.toLocaleString()} →`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="payment-summary">
            <h3>Order Summary</h3>
            <div className="summary-logo"><Bus size={40} /></div>
            <h4>IIC Bus Service</h4>
            <p>Monthly Bus Pass — 2024/25</p>

            <div className="summary-details">
              {form.shift && <div className="sum-row"><span>Shift</span><span className="capitalize">{form.shift}</span></div>}
              {form.route && <div className="sum-row"><span>Route</span><span>{form.route}</span></div>}
              {form.busStop && <div className="sum-row"><span>Stop</span><span>{form.busStop}</span></div>}
              {selectedMethod && <div className="sum-row"><span>Method</span><span>{PAYMENT_METHODS.find(m=>m.id===selectedMethod)?.label}</span></div>}
            </div>

            <div className="summary-total">
              <span>Total Fee</span>
              <span className="total-amount">Rs. {BUS_FEE.toLocaleString()}</span>
            </div>

            <div className="summary-note">
              <p><Lock size={13} style={{verticalAlign:"middle",marginRight:4}} />Secure payment processed by IIC</p>
              <p><Calendar size={13} style={{verticalAlign:"middle",marginRight:4}} />Pass valid for 1 month after payment</p>
              <p><FileText size={13} style={{verticalAlign:"middle",marginRight:4}} />Change shift daily as needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
