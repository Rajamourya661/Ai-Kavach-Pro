import { useState } from "react";

const API_URL = "http://localhost:8000/api/v1";

const inputStyle = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "10px", color: "#e2e8f0",
  fontSize: "14px", outline: "none",
  marginTop: "6px", boxSizing: "border-box",
};

const labelStyle = {
  fontSize: "13px", color: "#94a3b8",
  fontWeight: "500", display: "block", marginBottom: "2px",
};

const priorityConfig = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", label: "🚨 CRITICAL", action: "IMMEDIATE RESPONSE REQUIRED" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)", label: "🔴 HIGH", action: "Response within 2 hours" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", label: "🟡 MEDIUM", action: "Response within 24 hours" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", label: "🟢 LOW", action: "Standard processing" },
};

export default function CitizenComplaintPortal() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", city: "",
    type: "", description: "", evidence: "", urgency: "medium",
  });

  const complaintTypes = [
    "Deepfake Video / Image", "Fake Voice Call / Audio",
    "Phishing Link / Fake Website", "Online Fraud / Scam",
    "Social Media Impersonation", "Cyberbullying / Harassment", "Other Cybercrime",
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.type || !form.description) {
      setError("Please fill all required fields."); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/complaints/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setResult(data); setStep(2); }
      else setError("Submission failed. Please try again.");
    } catch { setError("Could not connect to server. Please try again."); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setStep(1); setResult(null); setError("");
    setForm({ name: "", phone: "", email: "", city: "", type: "", description: "", evidence: "", urgency: "medium" });
  };

  if (step === 2 && result) {
    const priority = priorityConfig[result.auto_priority] || priorityConfig.medium;
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding: "32px 24px", fontFamily: "sans-serif", color: "#e2e8f0" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "white" }}>K</div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#06b6d4" }}>KAVACH AI Pro</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Complaint Analysis Report</div>
            </div>
          </div>

          {/* Success */}
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "16px", padding: "24px", textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>✅</div>
            <h2 style={{ color: "#10b981", fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>Complaint Registered!</h2>
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>Your complaint has been submitted and analyzed by KAVACH AI</div>
          </div>

          {/* Tracking IDs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Tracking ID</div>
              <div style={{ color: "#06b6d4", fontSize: "18px", fontWeight: "800", letterSpacing: "2px" }}>{result.tracking_id}</div>
            </div>
            <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Case Reference</div>
              <div style={{ color: "#3b82f6", fontSize: "14px", fontWeight: "700" }}>{result.case_ref}</div>
            </div>
          </div>

          {/* AI Priority Analysis */}
          <div style={{ background: priority.bg, border: `1px solid ${priority.border}`, borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>🤖 AI Priority Analysis</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "20px", fontWeight: "800", color: priority.color }}>{priority.label}</div>
              <div style={{ fontSize: "12px", color: priority.color, fontWeight: "600" }}>{priority.action}</div>
            </div>

            {/* Severity Score Bar */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>
                <span>Severity Score</span>
                <span style={{ color: priority.color, fontWeight: "700" }}>{result.severity_score}/100</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "99px", height: "8px" }}>
                <div style={{ width: `${Math.min(result.severity_score, 100)}%`, background: priority.color, borderRadius: "99px", height: "8px" }} />
              </div>
            </div>

            {/* Detected Categories */}
            {result.detected_categories?.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px" }}>Detected Crime Categories:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {result.detected_categories.map(cat => (
                    <span key={cat} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: "#e2e8f0", textTransform: "capitalize" }}>
                      {cat.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Risk Flags */}
          {result.risk_flags?.length > 0 && (
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "#fca5a5", fontWeight: "700", marginBottom: "10px" }}>⚠️ Risk Flags Detected</div>
              {result.risk_flags.map((flag, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#fca5a5", padding: "4px 0", borderBottom: i < result.risk_flags.length - 1 ? "1px solid rgba(239,68,68,0.1)" : "none" }}>
                  {flag}
                </div>
              ))}
            </div>
          )}

          {/* Complaint Summary */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", color: "#e2e8f0" }}>📋 Complaint Summary</div>
            {[["Name", form.name], ["Phone", form.phone], ["Type", form.type], ["City", form.city || "N/A"], ["Original Urgency", form.urgency.toUpperCase()], ["AI Urgency Override", result.auto_priority.toUpperCase()]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#64748b" }}>{k}</span>
                <span style={{ color: k === "AI Urgency Override" ? priority.color : "#e2e8f0", fontWeight: "600" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Helpline */}
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "12px", marginBottom: "20px", textAlign: "center" }}>
            <div style={{ color: "#fca5a5", fontSize: "13px" }}>🚨 Emergency? Call: <strong style={{ color: "#ef4444", fontSize: "16px" }}>1930</strong> — National Cyber Crime Helpline (24x7)</div>
          </div>

          <button onClick={resetForm} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
            Submit Another Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding: "32px 24px", fontFamily: "sans-serif", color: "#e2e8f0" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "white" }}>K</div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#06b6d4" }}>KAVACH AI Pro</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Citizen Cyber Complaint Portal</div>
          </div>
        </div>

        <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "28px" }}>
          <div style={{ fontSize: "14px", color: "#e2e8f0", lineHeight: "1.7" }}>🛡️ <strong>Report a cybercrime safely.</strong> Our AI will automatically analyze your complaint and assign priority. All information is kept confidential.</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px", display: "grid", gap: "20px" }}>

          <div style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>📝 Personal Information</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Enter your full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City / District</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Ahmedabad" style={inputStyle} />
            </div>
          </div>

          <div style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>🚨 Complaint Details</div>

          <div>
            <label style={labelStyle}>Type of Cybercrime <span style={{ color: "#ef4444" }}>*</span></label>
            <select name="type" value={form.type} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="" style={{ background: "#1e293b" }}>Select complaint type...</option>
              {complaintTypes.map(t => <option key={t} value={t} style={{ background: "#1e293b" }}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Urgency Level</label>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              {[["low", "🟢 Low", "#10b981"], ["medium", "🟡 Medium", "#f59e0b"], ["high", "🔴 High", "#ef4444"]].map(([val, label, color]) => (
                <button key={val} onClick={() => setForm({ ...form, urgency: val })}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `2px solid ${form.urgency === val ? color : "rgba(255,255,255,0.1)"}`, background: form.urgency === val ? `${color}22` : "transparent", color: form.urgency === val ? color : "#64748b", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: "11px", color: "#475569", marginTop: "6px" }}>* AI may override urgency based on complaint analysis</div>
          </div>

          <div>
            <label style={labelStyle}>Describe What Happened <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe the incident in detail — what happened, when, who was involved, what you lost or experienced..."
              rows={5} style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }} />
          </div>

          <div>
            <label style={labelStyle}>Suspicious Link / Evidence (optional)</label>
            <input name="evidence" value={form.evidence} onChange={handleChange} placeholder="Paste suspicious URL, phone number, or any evidence here" style={inputStyle} />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px" }}>❌ {error}</div>
          )}

          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "10px", padding: "12px" }}>
            <div style={{ fontSize: "12px", color: "#fca5a5" }}>🚨 Emergency? Call <strong>1930</strong> — National Cyber Crime Helpline (24x7 Free)</div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "14px", background: loading ? "rgba(6,182,212,0.3)" : "linear-gradient(135deg,#06b6d4,#3b82f6)", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "⏳ Analyzing & Submitting..." : "🛡️ Submit Complaint"}
          </button>

        </div>
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#475569" }}>
          KAVACH AI Pro v3.0.0 — All complaints handled with strict confidentiality
        </div>
      </div>
    </div>
  );
}
