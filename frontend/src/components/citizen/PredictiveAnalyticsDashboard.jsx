import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000/api/v1";

const trendColor = {
  increasing: "#ef4444",
  decreasing: "#10b981",
  stable: "#f59e0b",
  insufficient_data: "#64748b",
};

const trendIcon = {
  increasing: "📈",
  decreasing: "📉",
  stable: "➡️",
  insufficient_data: "❓",
};

const priorityColors = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#10b981",
};

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "14px", padding: "20px", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "22px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "28px", fontWeight: "800", color }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: "600", marginTop: "4px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, maxVal }) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ textAlign: "center", color: "#475569", fontSize: "13px", padding: "40px 0" }}>No data yet — submit complaints to see trends</div>;
  }
  const max = maxVal || Math.max(...Object.values(data), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
      {Object.entries(data).map(([label, val], i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{ fontSize: "10px", color: "#64748b" }}>{val}</div>
          <div style={{ width: "100%", height: `${(val / max) * 100}%`, borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg,#3b82f6,#06b6d4)", minHeight: "4px" }} />
          <div style={{ fontSize: "9px", color: "#64748b", textAlign: "center" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function PredictiveAnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, trendsRes, allRes] = await Promise.all([
        fetch(`${API_URL}/complaints/stats`),
        fetch(`${API_URL}/complaints/analytics/trends`),
        fetch(`${API_URL}/complaints/all`),
      ]);
      const [statsData, trendsData, allData] = await Promise.all([
        statsRes.json(), trendsRes.json(), allRes.json(),
      ]);
      if (statsData.success) setStats(statsData);
      if (trendsData.success) setTrends(trendsData);
      if (allData.success) setComplaints(allData.complaints.slice(-5).reverse());
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding: "32px 24px", fontFamily: "sans-serif", color: "#e2e8f0" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "800", color: "white" }}>K</div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#06b6d4" }}>KAVACH AI Pro</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Predictive Analytics & Intelligence Dashboard</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <button onClick={fetchData} style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", marginBottom: "4px" }}>
              🔄 Refresh
            </button>
            <div style={{ fontSize: "10px", color: "#475569" }}>Last: {lastRefresh.toLocaleTimeString()}</div>
          </div>
        </div>

        {loading && !stats ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            <div>Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Trend Alert */}
            {trends?.alert && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>⚠️</span>
                <div>
                  <div style={{ fontSize: "13px", color: "#fca5a5", fontWeight: "600" }}>AI Alert — Pattern Detected</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>{trends.alert}</div>
                </div>
              </div>
            )}

            {/* Main Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
              <StatCard icon="📊" label="Total Complaints" value={stats?.total || 0} color="#06b6d4" sub="All time" />
              <StatCard icon="🚨" label="High Priority" value={stats?.high_priority_count || 0} color="#ef4444" sub="Critical + High" />
              <StatCard icon="⚡" label="Avg Severity" value={`${stats?.avg_severity_score || 0}/100`} color="#f59e0b" sub="NLP score" />
              <StatCard icon="📅" label="This Week" value={trends?.total_this_week || 0} color="#10b981" sub="Last 7 days" />
            </div>

            {/* Prediction + Trend */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

              {/* Trend Card */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>📈 Complaint Trend</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "16px" }}>Last 7 days activity</div>
                <BarChart data={trends?.daily_counts} />
                <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Current trend:</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: trendColor[trends?.trend || "stable"] }}>
                    {trendIcon[trends?.trend || "stable"]} {(trends?.trend || "stable").replace("_", " ").toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Prediction Card */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>🔮 AI Prediction</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "20px" }}>Based on trend analysis</div>

                <div style={{ textAlign: "center", padding: "20px", background: "rgba(6,182,212,0.08)", borderRadius: "12px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>Predicted Tomorrow</div>
                  <div style={{ fontSize: "44px", fontWeight: "800", color: "#06b6d4" }}>{trends?.predicted_tomorrow || 0}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>expected complaints</div>
                </div>

                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#64748b" }}>Top Crime Category</span>
                    <span style={{ color: "#e2e8f0", fontWeight: "600", textTransform: "capitalize" }}>{(trends?.top_category || "N/A").replace(/_/g, " ")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#64748b" }}>City Hotspot</span>
                    <span style={{ color: "#e2e8f0", fontWeight: "600" }}>{trends?.top_city_hotspot || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

              {/* Priority Distribution */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>🎯 AI Priority Distribution</div>
                {stats?.by_priority && Object.keys(stats.by_priority).length > 0 ? (
                  Object.entries(stats.by_priority).map(([priority, count]) => {
                    const total = stats.total || 1;
                    const pct = Math.round((count / total) * 100);
                    const color = priorityColors[priority] || "#64748b";
                    return (
                      <div key={priority} style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                          <span style={{ color, fontWeight: "600", textTransform: "capitalize" }}>{priority}</span>
                          <span style={{ color: "#64748b" }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "99px", height: "6px" }}>
                          <div style={{ width: `${pct}%`, background: color, borderRadius: "99px", height: "6px" }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: "#475569", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No data yet</div>
                )}
              </div>

              {/* Category Breakdown */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>🏷️ Crime Categories</div>
                {trends?.category_breakdown && Object.keys(trends.category_breakdown).length > 0 ? (
                  Object.entries(trends.category_breakdown).sort(([, a], [, b]) => b - a).slice(0, 5).map(([cat, count], i) => (
                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "12px" }}>
                      <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{cat.replace(/_/g, " ")}</span>
                      <span style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>{count}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#475569", fontSize: "13px", textAlign: "center", padding: "20px 0" }}>No categories detected yet</div>
                )}
              </div>
            </div>

            {/* City Hotspots */}
            {trends?.city_hotspots && Object.keys(trends.city_hotspots).length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px", marginBottom: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>🗺️ City Hotspot Map</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                  {Object.entries(trends.city_hotspots).sort(([, a], [, b]) => b - a).map(([city, count]) => (
                    <div key={city} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: count > 2 ? "#ef4444" : count > 1 ? "#f59e0b" : "#10b981" }}>{count}</div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{city}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Complaints */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "16px" }}>🕐 Recent Complaints — Live Feed</div>
              {complaints.length > 0 ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {complaints.map((c, i) => {
                    const priority = c.nlp_analysis?.auto_priority || "medium";
                    const color = priorityColors[priority] || "#64748b";
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: "600" }}>{c.tracking_id}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{c.city} · {c.type}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "600", color, background: `${color}22`, padding: "3px 8px", borderRadius: "6px", textTransform: "uppercase" }}>{priority}</span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>Score: {c.nlp_analysis?.severity_score || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#475569", fontSize: "13px", padding: "30px 0" }}>
                  No complaints yet — submit one to see live feed
                </div>
              )}
            </div>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "11px", color: "#334155" }}>
          KAVACH AI Pro v3.0.0 — Predictive Intelligence Dashboard · Auto-refreshes every 30s
        </div>
      </div>
    </div>
  );
}
