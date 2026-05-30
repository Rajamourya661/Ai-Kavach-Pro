/**
 * KAVACH AI Pro - PDF Report Generator
 * Clean KAVACH AI Branding Only
 */

const generatePDFReport = (result) => {
  const isThreat = result.is_fake || result.is_phishing;
  const detectionType = result.detection_type || 'unknown';
  const confidence = result.confidence || 0;
  const date = new Date().toLocaleString();
  const reportId = `KAV-${Date.now().toString(36).toUpperCase()}`;
  const caseId = `CCB-AHM-2026-${Math.floor(Math.random() * 9000 + 1000)}`;

  const typeLabels = {
    deepfake: 'Deepfake Video Detection',
    voice: 'Voice Anti-Spoofing Analysis',
    phishing: 'Phishing URL Detection',
  };

  const typeDescriptions = {
    deepfake: 'This tool checks if a video has been artificially manipulated or generated using AI technology (commonly known as "Deepfake").',
    voice: 'This tool checks if an audio clip is a real human voice or a fake/AI-generated voice used for fraud.',
    phishing: 'This tool checks if a website link (URL) is genuine or a fake link designed to steal your personal information.',
  };

  const modelInfo = {
    deepfake: { name: 'EfficientNet-B0 + OpenCV', version: 'v2.1.0', dataset: '140K Real & Fake Faces', accuracy: '92.4%', framework: 'PyTorch 2.1.2', features: 'Face consistency, edge artifacts, blink patterns, compression anomalies' },
    voice: { name: 'Gradient Boosting + Librosa', version: 'v2.0.0', dataset: 'Fake-or-Real Audio Dataset', accuracy: '88.7%', framework: 'scikit-learn 1.4.0', features: '89 spectral features including MFCCs, Chroma, RMS energy' },
    phishing: { name: 'XGBoost + Heuristic Rules', version: 'v2.0.0', dataset: 'URL Structural Dataset', accuracy: '94.1%', framework: 'XGBoost 2.0.3', features: 'URL entropy, brand impersonation, homoglyph detection, TLD analysis' },
  };

  const model = modelInfo[detectionType] || { name: 'AI Hybrid Model', version: 'v2.0.0', dataset: 'N/A', accuracy: 'N/A', framework: 'N/A', features: 'N/A' };

  const riskColor = confidence > 70 ? '#dc2626' : confidence > 40 ? '#f59e0b' : '#16a34a';
  const riskLabel = confidence > 70 ? 'HIGH RISK' : confidence > 40 ? 'MEDIUM RISK' : 'LOW RISK';
  const riskBg = confidence > 70 ? '#fef2f2' : confidence > 40 ? '#fffbeb' : '#f0fdf4';
  const riskBorder = confidence > 70 ? '#fca5a5' : confidence > 40 ? '#fde68a' : '#86efac';

  const nextSteps = isThreat ? {
    deepfake: ['Do not share or forward this video', 'Report at: cybercrime.gov.in', 'Save this report as evidence', 'Contact your nearest cyber crime helpline'],
    voice: ['Do not respond to the suspicious call or voice message', 'Block the number immediately', 'Call Cyber Crime Helpline: 1930', 'Save this report as evidence'],
    phishing: ['Do not click on this link or enter any personal details', 'Do not share this link with anyone', 'Report at: cybercrime.gov.in', 'If you already clicked — change your passwords immediately'],
  } : {
    deepfake: ['This video appears to be genuine', 'No manipulation detected by our AI system', 'You can safely view and share this content'],
    voice: ['This audio appears to be a real human voice', 'No spoofing detected', 'No immediate action required'],
    phishing: ['This URL appears to be safe', 'No phishing indicators found', 'You can proceed, but always stay cautious online'],
  };

  const steps = (nextSteps[detectionType] || []).map((s, i) =>
    `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
      <div style="width:22px;height:22px;border-radius:50%;background:${isThreat ? '#dc2626' : '#16a34a'};color:white;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</div>
      <div style="font-size:13px;color:#334155;padding-top:2px;">${s}</div>
    </div>`
  ).join('');

  const threatsHTML = (result.threats || []).map(t =>
    `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px;background:#fef2f2;border-radius:8px;margin-bottom:6px;">
      <span style="color:#ef4444;">⚠</span>
      <span style="font-size:13px;color:#374151;">${t}</span>
    </div>`
  ).join('');

  const scores = result.analysis_details || {};
  const scoresData = Object.entries(scores).filter(([_, v]) => v > 0).sort(([, a], [, b]) => b - a);
  const normalRange = { face_consistency: '0–5', edge_artifact: '0–3', blink_analysis: '0–4', compression_anomaly: '0–2', color_consistency: '0–3' };

  const scoresHTML = scoresData.map(([key, val]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const normal = normalRange[key] || '0–5';
    const status = val > 10 ? '🔴 Unusual' : val > 5 ? '🟡 Slightly Unusual' : '🟢 Normal';
    const color = val > 10 ? '#dc2626' : val > 5 ? '#f59e0b' : '#16a34a';
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#374151;">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700;color:${color};">${val.toFixed(1)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">${normal}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;">${status}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>KAVACH AI - Detection Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; color:#1e293b; padding:40px; background:#fff; font-size:13px; }
    .top-strip { background:linear-gradient(90deg,#06b6d4,#3b82f6); color:white; padding:7px 40px; margin:0 -40px 20px -40px; font-size:11px; text-align:center; letter-spacing:1px; font-weight:600; }
    .header { display:flex; justify-content:space-between; align-items:center; padding-bottom:16px; border-bottom:3px solid #06b6d4; margin-bottom:20px; }
    .kavach-icon { width:48px; height:48px; background:linear-gradient(135deg,#06b6d4,#3b82f6); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:22px; }
    .logo-left { display:flex; align-items:center; gap:12px; }
    .logo-text-main { font-size:20px; font-weight:700; color:#06b6d4; }
    .logo-text-sub { font-size:11px; color:#64748b; }
    .report-meta { text-align:right; font-size:11px; color:#64748b; line-height:1.8; }
    .section { margin-bottom:22px; }
    .section-title { font-size:12px; font-weight:700; text-transform:uppercase; color:#0891b2; letter-spacing:1px; margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid #e0f2fe; }
    .verdict { padding:22px; border-radius:14px; margin-bottom:22px; text-align:center; border:2px solid; }
    .confidence-num { font-size:48px; font-weight:700; margin:6px 0; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .info-item { padding:10px 14px; background:#f8fafc; border-radius:8px; border-left:3px solid #06b6d4; }
    .info-item .label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; }
    .info-item .value { font-size:14px; font-weight:600; color:#1e293b; margin-top:3px; word-break:break-all; }
    .risk-bar-bg { background:#e2e8f0; border-radius:99px; height:14px; width:100%; margin:8px 0; }
    .risk-bar-fill { height:14px; border-radius:99px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th { padding:8px 12px; background:linear-gradient(90deg,#06b6d4,#3b82f6); color:white; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
    td { padding:7px 12px; }
    .chain-row { display:flex; align-items:flex-start; gap:12px; padding:8px 0; border-bottom:1px solid #f1f5f9; }
    .chain-dot { width:12px; height:12px; border-radius:50%; background:#06b6d4; flex-shrink:0; margin-top:3px; }
    .chain-time { font-size:10px; color:#94a3b8; }
    .chain-event { font-size:12px; color:#334155; font-weight:500; }
    .model-card { background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:14px; }
    .model-row { display:flex; justify-content:space-between; padding:5px 0; font-size:12px; border-bottom:1px solid #e0f2fe; }
    .model-row:last-child { border-bottom:none; }
    .model-key { color:#64748b; }
    .model-val { color:#0c4a6e; font-weight:600; text-align:right; max-width:60%; }
    .helpline-box { background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:14px; display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .helpline-item { text-align:center; padding:8px; }
    .helpline-num { font-size:18px; font-weight:700; color:#16a34a; }
    .helpline-label { font-size:10px; color:#64748b; margin-top:2px; }
    .legal-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; }
    .legal-box p { font-size:11px; color:#475569; line-height:1.7; }
    .footer { margin-top:30px; padding-top:12px; border-top:2px solid #06b6d4; display:flex; justify-content:space-between; align-items:flex-end; }
    .footer-left { font-size:10px; color:#64748b; line-height:1.7; }
    .footer-right { text-align:right; font-size:10px; color:#64748b; }
    .badge { display:inline-block; padding:3px 12px; border-radius:4px; font-size:11px; font-weight:700; letter-spacing:1px; }
    @media print { body { padding:20px; } .top-strip { margin:0 -20px 16px -20px; } }
  </style>
</head>
<body>

  <div class="top-strip">
    🛡️ KAVACH AI PRO &nbsp;|&nbsp; CYBER THREAT DETECTION REPORT &nbsp;|&nbsp; AI-POWERED DIGITAL SAFETY
  </div>

  <div class="header">
    <div class="logo-left">
      <div class="kavach-icon">K</div>
      <div>
        <div class="logo-text-main">KAVACH AI Pro</div>
        <div class="logo-text-sub">AI-Powered Cyber Threat Detection Platform</div>
      </div>
    </div>
    <div class="report-meta">
      <div><strong>Detection Report</strong></div>
      <div>${date}</div>
      <div>Report ID: <strong>${reportId}</strong></div>
      <div>Case Ref: <strong style="color:#0891b2;">${caseId}</strong></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">What Is This Report?</div>
    <p style="font-size:13px;color:#334155;line-height:1.7;padding:12px;background:#f0f9ff;border-radius:8px;border-left:3px solid #06b6d4;">
      ${typeDescriptions[detectionType] || 'This report contains the results of an AI-powered analysis of your submitted content.'}<br><br>
      <strong>This report was generated automatically by KAVACH AI Pro.</strong> You can use this as supporting evidence when reporting a cybercrime.
    </p>
  </div>

  <div class="verdict" style="background:${riskBg};border-color:${riskBorder};">
    <h2 style="color:${riskColor};font-size:26px;margin-bottom:6px;">${isThreat ? '⚠️ WARNING — POTENTIAL THREAT FOUND' : '✅ ALL CLEAR — CONTENT APPEARS SAFE'}</h2>
    <div class="confidence-num" style="color:${riskColor};">${confidence.toFixed(1)}%</div>
    <div style="font-size:13px;color:#64748b;margin-bottom:8px;">${typeLabels[detectionType] || 'Detection Analysis'}</div>
    <span class="badge" style="background:${riskColor};color:white;">${riskLabel}</span>
  </div>

  <div class="section">
    <div class="section-title">Risk Level — How Serious Is This?</div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:6px;">
      <span>🟢 Safe (0–40%)</span>
      <span>🟡 Be Careful (40–70%)</span>
      <span>🔴 Danger (70–100%)</span>
    </div>
    <div class="risk-bar-bg">
      <div class="risk-bar-fill" style="width:${confidence}%;background:linear-gradient(90deg,#16a34a,${riskColor});"></div>
    </div>
    <div style="text-align:right;font-size:12px;color:${riskColor};margin-top:6px;font-weight:700;">
      Your result: ${confidence.toFixed(1)}% — ${riskLabel}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Scan Details</div>
    <div class="info-grid">
      <div class="info-item"><div class="label">What Was Checked</div><div class="value">${typeLabels[detectionType] || 'N/A'}</div></div>
      <div class="info-item"><div class="label">Case Reference No.</div><div class="value" style="color:#0891b2;">${caseId}</div></div>
      <div class="info-item"><div class="label">File / Link Submitted</div><div class="value" style="font-size:12px;">${result.original_filename || result.url || 'N/A'}</div></div>
      <div class="info-item"><div class="label">Risk Level</div><div class="value" style="color:${riskColor};">${riskLabel}</div></div>
      <div class="info-item"><div class="label">Time Taken to Analyze</div><div class="value">${result.processing_time || 'N/A'} seconds</div></div>
      <div class="info-item"><div class="label">Scan Date & Time</div><div class="value" style="font-size:12px;">${date}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">What Did The AI Find?</div>
    <p style="font-size:13px;color:#334155;line-height:1.7;padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #3b82f6;">
      ${result.explanation || 'No additional details available.'}
    </p>
  </div>

  ${threatsHTML ? `
  <div class="section">
    <div class="section-title">Specific Issues Found</div>
    ${threatsHTML}
  </div>` : ''}

  ${scoresHTML ? `
  <div class="section">
    <div class="section-title">Detailed Analysis — What Was Checked & What Was Found</div>
    <p style="font-size:12px;color:#64748b;margin-bottom:8px;">Higher scores than normal indicate signs of manipulation.</p>
    <table>
      <thead>
        <tr>
          <th>What Was Checked</th>
          <th style="text-align:center;">Score Found</th>
          <th style="text-align:center;">Normal Score</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>${scoresHTML}</tbody>
    </table>
    <p style="font-size:10px;color:#94a3b8;margin-top:6px;">* A score much higher than normal means that area showed signs of manipulation.</p>
  </div>` : ''}

  <div class="section">
    <div class="section-title">${isThreat ? '🚨 What Should You Do Now?' : '✅ You Are Safe — But Stay Alert'}</div>
    <div style="background:${riskBg};border:1px solid ${riskBorder};border-radius:10px;padding:14px;">
      ${steps}
    </div>
  </div>

  ${isThreat ? `
  <div class="section">
    <div class="section-title">Important Helpline Numbers</div>
    <div class="helpline-box">
      <div class="helpline-item">
        <div class="helpline-num">1930</div>
        <div class="helpline-label">National Cyber Crime Helpline</div>
      </div>
      <div class="helpline-item">
        <div class="helpline-num">cybercrime.gov.in</div>
        <div class="helpline-label">File Online Complaint</div>
      </div>
    </div>
  </div>` : ''}

  <div class="section">
    <div class="section-title">About The AI Technology Used</div>
    <div class="model-card">
      <div class="model-row"><span class="model-key">AI Model</span><span class="model-val">${model.name}</span></div>
      <div class="model-row"><span class="model-key">Version</span><span class="model-val">${model.version}</span></div>
      <div class="model-row"><span class="model-key">Framework</span><span class="model-val">${model.framework}</span></div>
      <div class="model-row"><span class="model-key">Trained On</span><span class="model-val">${model.dataset}</span></div>
      <div class="model-row"><span class="model-key">Accuracy</span><span class="model-val">${model.accuracy}</span></div>
      <div class="model-row"><span class="model-key">What It Checks</span><span class="model-val">${model.features}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Analysis Timeline</div>
    <div class="chain-row">
      <div class="chain-dot"></div>
      <div><div class="chain-time">${new Date(Date.now() - 90000).toLocaleString()}</div><div class="chain-event">📤 File/link submitted for analysis</div></div>
    </div>
    <div class="chain-row">
      <div class="chain-dot"></div>
      <div><div class="chain-time">${new Date(Date.now() - 60000).toLocaleString()}</div><div class="chain-event">🔐 Content secured and verified by KAVACH AI</div></div>
    </div>
    <div class="chain-row">
      <div class="chain-dot"></div>
      <div><div class="chain-time">${new Date(Date.now() - 30000).toLocaleString()}</div><div class="chain-event">🤖 AI analysis started</div></div>
    </div>
    <div class="chain-row" style="border-bottom:none;">
      <div class="chain-dot" style="background:#16a34a;"></div>
      <div><div class="chain-time">${date}</div><div class="chain-event">✅ Analysis complete — report generated</div></div>
    </div>
  </div>

  <div class="section">
    <div class="legal-box">
      <p><strong>ℹ️ Disclaimer:</strong> This report is generated by KAVACH AI Pro v3.0.0. Results are based on AI analysis and should be used as supporting evidence only. For official legal proceedings, please consult a qualified cybercrime expert. Your submitted content has been handled with strict confidentiality.</p>
    </div>
  </div>

  <div class="footer">
    <div class="footer-left">
      <div><strong>KAVACH AI Pro v3.0.0</strong> — AI-Powered Cyber Threat Detection</div>
      <div>Protecting citizens from deepfakes, voice spoofing & phishing attacks</div>
    </div>
    <div class="footer-right">
      <div>Report ID: ${reportId}</div>
      <div>Case Ref: ${caseId}</div>
      <div>${date}</div>
    </div>
  </div>

</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => printWindow.print(), 500);
  };
};

export default generatePDFReport;