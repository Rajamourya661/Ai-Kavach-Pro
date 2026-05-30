import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, Download, X,
  Video, Mic, Link, Clock, FileText, ChevronRight
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';

// === ANIMATED CONFIDENCE GAUGE ===
const ConfidenceGauge = ({ value, isThreat }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const canvasRef = useRef(null);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setAnimatedValue(current);

      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h * 0.65;
    const radius = Math.min(w, h) * 0.38;

    ctx.clearRect(0, 0, w, h);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
    ctx.lineWidth = 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Color gradient based on threat level
    const gradient = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    if (isThreat) {
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(0.5, '#ef4444');
      gradient.addColorStop(1, '#dc2626');
    } else {
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(0.5, '#22d3ee');
      gradient.addColorStop(1, '#3b82f6');
    }

    // Filled arc
    const angle = Math.PI + (animatedValue / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, angle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = isThreat ? '#ef4444' : '#22d3ee';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, angle - 0.05, angle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = isThreat ? '#ef4444' : '#22d3ee';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Needle
    const needleAngle = Math.PI + (animatedValue / 100) * Math.PI;
    const needleLen = radius - 30;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(needleAngle) * needleLen,
      cy + Math.sin(needleAngle) * needleLen
    );
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Labels
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('0%', cx - radius - 5, cy + 25);
    ctx.textAlign = 'right';
    ctx.fillText('100%', cx + radius + 5, cy + 25);

  }, [animatedValue, isThreat]);

  return (
    <div className="relative flex flex-col items-center">
      <canvas ref={canvasRef} width={280} height={180} />
      <div className="absolute bottom-2 text-center">
        <p className="text-4xl font-bold text-white">{animatedValue.toFixed(1)}%</p>
        <p className={`text-sm font-medium ${isThreat ? 'text-red-400' : 'text-green-400'}`}>
          {isThreat ? 'Threat Detected' : 'Safe Content'}
        </p>
      </div>
    </div>
  );
};

// === THREAT BREAKDOWN BARS ===
const ThreatBreakdown = ({ threats = [], scores = {} }) => {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  const scoreEntries = Object.entries(scores)
    .filter(([_, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const maxScore = Math.max(...scoreEntries.map(([, v]) => v), 1);

  const formatLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const getBarColor = (val, max) => {
    const ratio = val / max;
    if (ratio > 0.7) return 'from-red-500 to-red-400';
    if (ratio > 0.4) return 'from-yellow-500 to-amber-400';
    return 'from-cyan-500 to-blue-400';
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Risk Factor Breakdown</h4>
      {scoreEntries.map(([key, val], i) => (
        <div key={key} className="space-y-1" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{formatLabel(key)}</span>
            <span className="text-gray-400 font-mono">{val.toFixed(1)}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getBarColor(val, maxScore)} transition-all duration-1000 ease-out`}
              style={{ width: animated ? `${(val / maxScore) * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
      {scoreEntries.length === 0 && (
        <p className="text-gray-500 text-sm">No significant risk factors detected</p>
      )}
    </div>
  );
};

// === MAIN RESULT VISUALIZATION ===
const ResultVisualization = ({ result, onClose, onExportPDF }) => {
  if (!result) return null;

  const isThreat = result.is_fake || result.is_phishing;
  const confidence = result.confidence || 0;
  const detectionType = result.detection_type || 'unknown';
  const scores = result.analysis_details || result.metadata || {};

  // Radar chart data
  const radarData = (() => {
    if (detectionType === 'deepfake') {
      return [
        { factor: 'Face Consistency', value: scores.face_consistency || 0, max: 25 },
        { factor: 'Edge Artifacts', value: scores.edge_artifact || 0, max: 25 },
        { factor: 'Blink Pattern', value: scores.blink_analysis || 0, max: 20 },
        { factor: 'Color Consistency', value: scores.color_consistency || 0, max: 15 },
        { factor: 'Compression', value: scores.compression_anomaly || 0, max: 15 },
      ];
    } else if (detectionType === 'voice') {
      return [
        { factor: 'Spectral Centroid', value: scores.spectral_centroid || 0, max: 20 },
        { factor: 'Flatness', value: scores.spectral_flatness || 0, max: 15 },
        { factor: 'MFCC Pattern', value: scores.mfcc_pattern || 0, max: 15 },
        { factor: 'Temporal', value: scores.temporal_dynamics || 0, max: 15 },
        { factor: 'Zero Crossing', value: scores.zero_crossing || 0, max: 10 },
        { factor: 'Bandwidth', value: scores.bandwidth || 0, max: 10 },
      ];
    } else {
      return [
        { factor: 'URL Structure', value: (scores.url_length || 0) + (scores.url_entropy || 0), max: 16 },
        { factor: 'Domain Trust', value: (scores.suspicious_tld || 0) + (scores.domain_keywords || 0), max: 14 },
        { factor: 'Brand Safety', value: (scores.brand_impersonation || 0) + (scores.homoglyph || 0), max: 20 },
        { factor: 'SSL/Security', value: (scores.no_ssl || 0) + (scores.unusual_port || 0), max: 11 },
        { factor: 'Content Risk', value: (scores.urgency || 0) + (scores.pii_request || 0), max: 18 },
      ];
    }
  })().map(d => ({ ...d, score: Math.round((d.value / d.max) * 100) }));

  const typeConfig = {
    deepfake: { icon: Video, label: 'Deepfake Detection', gradient: 'from-pink-500 to-rose-500' },
    voice: { icon: Mic, label: 'Voice Anti-Spoofing', gradient: 'from-cyan-500 to-blue-500' },
    phishing: { icon: Link, label: 'Phishing Detection', gradient: 'from-amber-500 to-orange-500' },
  };
  const config = typeConfig[detectionType] || typeConfig.deepfake;
  const TypeIcon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 animate-slide-up"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${config.gradient} rounded-t-3xl relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <TypeIcon className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">{config.label} Result</h3>
              <p className="text-sm opacity-80">
                {result.original_filename || result.url || 'Analysis Complete'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Section: Gauge + Verdict */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center">
              <ConfidenceGauge value={confidence} isThreat={isThreat} />
            </div>

            <div className="space-y-4">
              {/* Verdict */}
              <div className={`p-4 rounded-2xl border ${
                isThreat ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  {isThreat
                    ? <AlertTriangle className="w-6 h-6 text-red-400" />
                    : <CheckCircle className="w-6 h-6 text-green-400" />}
                  <span className={`text-lg font-bold ${isThreat ? 'text-red-400' : 'text-green-400'}`}>
                    {isThreat ? 'THREAT DETECTED' : 'CONTENT SAFE'}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{result.explanation}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                {result.processing_time && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs">Processing Time</span>
                    </div>
                    <p className="text-lg font-bold text-white">{result.processing_time}s</p>
                  </div>
                )}
                {result.spoof_type && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-xs">Spoof Type</span>
                    </div>
                    <p className="text-sm font-bold text-red-400">{result.spoof_type}</p>
                  </div>
                )}
                {result.risk_level && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-xs">Risk Level</span>
                    </div>
                    <p className={`text-sm font-bold ${
                      result.risk_level === 'Critical' ? 'text-red-400' :
                      result.risk_level === 'High' ? 'text-orange-400' :
                      result.risk_level === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                    }`}>{result.risk_level}</p>
                  </div>
                )}
                {result.frames_analyzed && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Video className="w-3.5 h-3.5" />
                      <span className="text-xs">Frames Analyzed</span>
                    </div>
                    <p className="text-lg font-bold text-white">{result.frames_analyzed}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Radar Chart + Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Risk Analysis Radar</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  <Radar
                    dataKey="score"
                    stroke={isThreat ? '#ef4444' : '#22d3ee'}
                    fill={isThreat ? '#ef4444' : '#22d3ee'}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Threat Breakdown */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <ThreatBreakdown threats={result.threats || []} scores={scores} />
            </div>
          </div>

          {/* Threats list (phishing) */}
          {result.threats && result.threats.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Detected Threats</h4>
              <div className="grid grid-cols-2 gap-2">
                {result.threats.map((threat, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-300">{threat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {result.recommended_action && (
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">Recommended Action</span>
              </div>
              <p className="text-sm text-gray-200">{result.recommended_action}</p>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => onExportPDF && onExportPDF(result)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultVisualization;
