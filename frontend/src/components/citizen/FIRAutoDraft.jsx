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

const IPC_SECTIONS = {
  "Deepfake Video / Image": [
    { section: "Section 66E IT Act", desc: "Violation of privacy — capturing/publishing private images" },
    { section: "Section 67 IT Act", desc: "Publishing obscene material in electronic form" },
    { section: "Section 500 IPC", desc: "Defamation" },
    { section: "Section 354C IPC", desc: "Voyeurism" },
  ],
  "Fake Voice Call / Audio": [
    { section: "Section 66D IT Act", desc: "Cheating by personation using computer resource" },
    { section: "Section 420 IPC", desc: "Cheating and dishonestly inducing delivery of property" },
    { section: "Section 468 IPC", desc: "Forgery for purpose of cheating" },
  ],
  "Phishing Link / Fake Website": [
    { section: "Section 66 IT Act", desc: "Computer related offences" },
    { section: "Section 66C IT Act", desc: "Identity theft" },
    { section: "Section 66D IT Act", desc: "Cheating by personation using computer resource" },
    { section: "Section 420 IPC", desc: "Cheating" },
  ],
  "Online Fraud / Scam": [
    { section: "Section 420 IPC", desc: "Cheating and dishonestly inducing delivery of property" },
    { section: "Section 66 IT Act", desc: "Computer related offences" },
    { section: "Section 66C IT Act", desc: "Identity theft" },
    { section: "Section 406 IPC", desc: "Criminal breach of trust" },
  ],
  "Social Media Impersonation": [
    { section: "Section 66C IT Act", desc: "Identity theft" },
    { section: "Section 66D IT Act", desc: "Cheating by personation" },
    { section: "Section 500 IPC", desc: "Defamation" },
    { section: "Section 469 IPC", desc: "Forgery for purpose of harming reputation" },
  ],
  "Cyberbullying / Harassment": [
    { section: "Section 66A IT Act", desc: "Sending offensive messages through communication service" },
    { section: "Section 507 IPC", desc: "Criminal intimidation by anonymous communication" },
    { section: "Section 354A IPC", desc: "Sexual harassment" },
    { section: "Section 509 IPC", desc: "Word, gesture or act intended to insult the modesty of a woman" },
  ],
  "Other Cybercrime": [
    { section: "Section 66 IT Act", desc: "Computer related offences" },
    { section: "Section 43 IT Act", desc: "Penalty for damage to computer" },
  ],
};

export default function FIRAutoDraft() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [firText, setFirText] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    complainant_name: "",
    father_name: "",
    age: "",
    address: "",
    phone: "",
    occupation: "",
    incident_date: "",
    incident_location: "",
    complaint_type: "",
    description: "",
    accused_details: "",
    evidence_details: "",
    loss_amount: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchFromTracking = async () => {
    if (!trackingId) { setError("Enter tracking ID"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/complaints/track/${trackingId.toUpperCase()}`);
      const data = await res.json();
      if (data.success) {
        const c = data.data;
        setCaseData(c);
        setForm(prev => ({
          ...prev,
          complainant_name: c.name || "",
          phone: c.phone || "",
          complaint_type: c.type || "",
          description: (c.description || "").replace(c.tracking_id || "", "").trim(),
          evidence_details: c.evidence || "",
        }));
        setStep(2);
      } else setError("Tracking ID not found");
    } catch { setError("Could not connect to server"); }
    finally { setLoading(false); }
  };

  const generateFIR = () => {
    if (!form.complainant_name || !form.complaint_type || !form.description) {
      setError("Please fill required fields"); return;
    }
    setError("");

    const sections = IPC_SECTIONS[form.complaint_type] || IPC_SECTIONS["Other Cybercrime"];
    const sectionsText = sections.map(s => `${s.section} — ${s.desc}`).join("\n");
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const firNo = `FIR-CCB-AHM-2026-${Math.floor(Math.random() * 9000 + 1000)}`;

    const fir = `
════════════════════════════════════════════════════════════
                    FIRST INFORMATION REPORT
           Cyber Crime Branch, Ahmedabad City, Gujarat Police
════════════════════════════════════════════════════════════

FIR Number    : ${firNo}
Date & Time   : ${today}
Generated by  : KAVACH AI Pro v3.0.0
${caseData ? `Case Reference: ${caseData.case_ref}\nTracking ID   : ${caseData.tracking_id}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: COMPLAINANT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name              : ${form.complainant_name}
Father's Name     : ${form.father_name || "N/A"}
Age               : ${form.age || "N/A"}
Occupation        : ${form.occupation || "N/A"}
Address           : ${form.address || "N/A"}
Phone Number      : ${form.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: INCIDENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nature of Offence : ${form.complaint_type}
Date of Incident  : ${form.incident_date || "As mentioned in complaint"}
Place of Offence  : ${form.incident_location || "Cyberspace / Online Platform"}
Financial Loss    : ${form.loss_amount ? `Rs. ${form.loss_amount}` : "N/A"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: COMPLAINT DESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${form.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: ACCUSED / SUSPECT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${form.accused_details || "Unknown — investigation required to identify accused"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: DIGITAL EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${form.evidence_details || "Evidence to be collected during investigation"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: APPLICABLE LEGAL SECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sectionsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7: AI ANALYSIS SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${caseData?.nlp_analysis ? `
Auto Priority     : ${caseData.nlp_analysis.auto_priority?.toUpperCase()}
Severity Score    : ${caseData.nlp_analysis.severity_score}/100
Detected Categories: ${caseData.nlp_analysis.detected_categories?.join(", ") || "N/A"}
Risk Flags        : ${caseData.nlp_analysis.risk_flags?.join(" | ") || "None"}
Analysis Mode     : KAVACH AI NLP Engine v2.0
` : "AI analysis not available for manually drafted FIR"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8: DECLARATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I, ${form.complainant_name}, hereby declare that the information 
provided above is true and correct to the best of my knowledge.
I understand that providing false information is a punishable 
offence under applicable laws.

Complainant Signature: _____________________

Date: ${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOR OFFICIAL USE ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Received by       : _____________________
Badge Number      : _____________________
Designation       : _____________________
Date & Time       : _____________________
Station Seal      : 

════════════════════════════════════════════════════════════
Generated by KAVACH AI Pro v3.0.0 | Cyber Crime Branch, Ahmedabad
This document is AI-assisted. Verify all details before official filing.
Information Technology Act 2000 | DPDP Act 2023
════════════════════════════════════════════════════════════
    `;

    setFirText(fir);
    setStep(3);
  };

  const downloadFIR = () => {
    const blob = new Blob([firText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FIR_KAVACH_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printFIR = () => {
    const win = window.open("", "_blank");
    win.document.write(`<pre style="font-family:monospace;font-size:13px;padding:40px;white-space:pre-wrap;">${firText}</pre>`);
    win.document.close();
    win.print();
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding: "32px 24px", fontFamily: "sans-serif", color: "#e2e8f0" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
          <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "white" }}>K</div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#06b6d4" }}>KAVACH AI Pro</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>FIR Auto-Draft System — AI Assisted</div>
          </div>
        </div>

        {/* Step 1 — Tracking ID or Manual */}
        {step === 1 && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "14px", padding: "16px" }}>
              <div style={{ fontSize: "14px", color: "#e2e8f0", lineHeight: "1.7" }}>
                📋 <strong>AI-Assisted FIR Drafting.</strong> Enter your KAVACH tracking ID to auto-fill complaint details, or fill the form manually. Applicable IPC/IT Act sections will be suggested automatically.
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>🔗 Auto-fill from Complaint</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="Enter Tracking ID (e.g. KAVACH-ABC123)" style={{ ...inputStyle, flex: 1, marginTop: 0 }} />
                <button onClick={fetchFromTracking} disabled={loading}
                  style={{ padding: "12px 20px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", color: "white", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {loading ? "⏳..." : "Auto Fill"}
                </button>
              </div>
              {error && <div style={{ marginTop: "8px", color: "#fca5a5", fontSize: "12px" }}>❌ {error}</div>}
            </div>

            <div style={{ textAlign: "center", color: "#475569", fontSize: "13px" }}>— OR —</div>

            <button onClick={() => setStep(2)}
              style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
              📝 Fill FIR Form Manually
            </button>
          </div>
        )}

        {/* Step 2 — FIR Form */}
        {step === 2 && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px", display: "grid", gap: "18px" }}>

            <div style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>👤 Complainant Details</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={labelStyle}>Full Name *</label><input name="complainant_name" value={form.complainant_name} onChange={handleChange} placeholder="Full name" style={inputStyle} /></div>
              <div><label style={labelStyle}>Father's Name</label><input name="father_name" value={form.father_name} onChange={handleChange} placeholder="Father's name" style={inputStyle} /></div>
              <div><label style={labelStyle}>Age</label><input name="age" value={form.age} onChange={handleChange} placeholder="Age" style={inputStyle} /></div>
              <div><label style={labelStyle}>Occupation</label><input name="occupation" value={form.occupation} onChange={handleChange} placeholder="Occupation" style={inputStyle} /></div>
              <div><label style={labelStyle}>Phone *</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" style={inputStyle} /></div>
              <div><label style={labelStyle}>Address</label><input name="address" value={form.address} onChange={handleChange} placeholder="Full address" style={inputStyle} /></div>
            </div>

            <div style={{ fontSize: "16px", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginTop: "4px" }}>🚨 Incident Details</div>

            <div>
              <label style={labelStyle}>Type of Cybercrime *</label>
              <select name="complaint_type" value={form.complaint_type} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="" style={{ background: "#1e293b" }}>Select type...</option>
                {Object.keys(IPC_SECTIONS).map(t => <option key={t} value={t} style={{ background: "#1e293b" }}>{t}</option>)}
              </select>
            </div>

            {form.complaint_type && (
              <div style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "10px", padding: "12px" }}>
                <div style={{ fontSize: "11px", color: "#06b6d4", fontWeight: "700", marginBottom: "6px" }}>📚 Auto-suggested Legal Sections:</div>
                {IPC_SECTIONS[form.complaint_type]?.map(s => (
                  <div key={s.section} style={{ fontSize: "11px", color: "#94a3b8", padding: "2px 0" }}>• <strong style={{ color: "#e2e8f0" }}>{s.section}</strong> — {s.desc}</div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={labelStyle}>Date of Incident</label><input name="incident_date" value={form.incident_date} onChange={handleChange} type="date" style={inputStyle} /></div>
              <div><label style={labelStyle}>Financial Loss (₹)</label><input name="loss_amount" value={form.loss_amount} onChange={handleChange} placeholder="Amount if any" style={inputStyle} /></div>
            </div>

            <div><label style={labelStyle}>Incident Location</label><input name="incident_location" value={form.incident_location} onChange={handleChange} placeholder="Where did it happen? (platform/physical location)" style={inputStyle} /></div>

            <div><label style={labelStyle}>Describe What Happened *</label><textarea name="description" value={form.description} onChange={handleChange} rows={5} placeholder="Detailed description of the incident..." style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }} /></div>

            <div><label style={labelStyle}>Accused / Suspect Details</label><textarea name="accused_details" value={form.accused_details} onChange={handleChange} rows={3} placeholder="Name, phone, social media profile, or any other details of accused..." style={{ ...inputStyle, resize: "vertical" }} /></div>

            <div><label style={labelStyle}>Digital Evidence</label><textarea name="evidence_details" value={form.evidence_details} onChange={handleChange} rows={3} placeholder="Screenshots, URLs, phone numbers, transaction IDs..." style={{ ...inputStyle, resize: "vertical" }} /></div>

            {error && <div style={{ color: "#fca5a5", fontSize: "13px" }}>❌ {error}</div>}

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", borderRadius: "10px", fontSize: "14px", cursor: "pointer" }}>← Back</button>
              <button onClick={generateFIR} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                🤖 Generate FIR Draft
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Generated FIR */}
        {step === 3 && (
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#10b981", fontWeight: "700", fontSize: "14px" }}>✅ FIR Draft Generated Successfully</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={printFIR} style={{ padding: "8px 14px", background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>🖨️ Print</button>
                <button onClick={downloadFIR} style={{ padding: "8px 14px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", color: "white", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>⬇️ Download</button>
                <button onClick={() => setStep(1)} style={{ padding: "8px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8", borderRadius: "8px", fontSize: "12px", cursor: "pointer" }}>New FIR</button>
              </div>
            </div>

            <div style={{ background: "#0a0a1a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "24px", fontFamily: "monospace", fontSize: "12px", color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: "1.7", maxHeight: "600px", overflowY: "auto" }}>
              {firText}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: "#334155" }}>
          KAVACH AI Pro v3.0.0 — AI-Assisted FIR Drafting System
        </div>
      </div>
    </div>
  );
}
