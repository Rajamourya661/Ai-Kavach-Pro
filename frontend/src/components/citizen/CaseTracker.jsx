import { useState } from "react";

const API_URL = "http://localhost:8000/api/v1";

const inputStyle = {
  width: "100%",
  padding: "14px 18px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "12px",
  color: "#e2e8f0",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  letterSpacing: "1px",
};

const statusConfig = {
  pending: { label: "Pending Review", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: "⏳" },
  under_investigation: { label: "Under Investigation", color: "#06b6d4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.3)", icon: "🔍" },
  resolved: { label: "Resolved", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", icon: "✅" },
  closed: { label: "Closed", color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)", icon: "🔒" },
};

const urgencyConfig = {
  low: { label: "Low", color: "#10b981" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#ef4444" },
};

export default function CaseTracker() {
  const [trackingId, setTrackingId] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      setError("Please enter a tracking ID.");
      return;
    }
    setLoading(true);
    setError("");
    setCaseData(null);

    try {
      const res = await fetch(`${API_URL}/complaints/track/${trackingId.trim().toUpperCase()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCaseData(data.data);
      } else {
        setError(data.detail || "No complaint found with this tracking ID.");
      }
    } catch {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const status = caseData ? (statusConfig[caseData.status] || statusConfig.pending) : null;
  const urgency = caseData ? (urgencyConfig[caseData.urgency] || urgencyConfig.medium) : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding: "32px 24px", fontFamily: "sans-serif", color: "#e2e8f0" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "white" }}>K</div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#06b6d4" }}>KAVACH AI Pro</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Complaint Tracking System</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px", marginBottom: "24px" }}>
          <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>🔍 Track Your Complaint</div>
          <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>Enter the Tracking ID you received after submitting your complaint.</div>

          <div style={{ display: "flex", gap: "12px" }}>
            <input
              value={trackingId}
              onChange={e => setTrackingId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="e.g. KAVACH-ABC123"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleSearch} disabled={loading}
              style={{ padding: "14px 24px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
              {loading ? "⏳..." : "Track"}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: "12px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#fca5a5", fontSize: "13px" }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* Case Details */}
        {caseData && (
          <div style={{ display: "grid", gap: "16px" }}>

            {/* Status */}
            <div style={{ background: status.bg, border: `1px solid ${status.border}`, borderRadius: "16px", padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>{status.icon}</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: status.color }}>{status.label}</div>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Last updated: {new Date(caseData.last_updated).toLocaleString()}</div>
            </div>

            {/* Info Grid */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>📋 Case Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  ["Tracking ID", caseData.tracking_id],
                  ["Case Reference", caseData.case_ref],
                  ["Complaint Type", caseData.type],
                  ["Urgency", urgency.label],
                  ["Submitted On", new Date(caseData.submitted_at).toLocaleString()],
                  ["City", caseData.city],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 14px" }}>
                    <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{k}</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: k === "Urgency" ? urgency.color : "#e2e8f0" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "20px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>📅 Case Timeline</div>
              {caseData.timeline.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", paddingBottom: "16px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: item.done ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.05)", border: `2px solid ${item.done ? "#06b6d4" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ paddingTop: "4px" }}>
                    <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "3px" }}>{item.date === "Pending" ? "⏳ Pending" : new Date(item.date).toLocaleString()}</div>
                    <div style={{ fontSize: "13px", color: item.done ? "#e2e8f0" : "#475569", fontWeight: item.done ? "500" : "400" }}>{item.event}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Helpline */}
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#fca5a5" }}>🚨 Need urgent help? Call <strong style={{ color: "#ef4444", fontSize: "16px" }}>1930</strong> — National Cyber Crime Helpline (Free, 24x7)</div>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: "#334155" }}>
          KAVACH AI Pro v3.0.0 — AI-Powered Cyber Threat Detection
        </div>
      </div>
    </div>
  );
}
