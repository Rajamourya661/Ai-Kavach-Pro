import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Activity, Loader, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ThreatFeed from './ThreatFeed';
import useAuthStore from '../../context/AuthStore';

const API_URL = process.env.REACT_APP_API_URL || '';

const Dashboard = () => {
  const { user } = useAuthStore();
  const displayName = user?.username || 'there';
  const [stats, setStats] = useState(null);
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch real stats from backend
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/stats`).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/api/v1/history?per_page=100`).catch(() => ({ data: { items: [], total: 0 } })),
      ]);

      const s = statsRes.data;
      setStats({
        totalScans: s.total_scans || 0,
        threats: s.threats || 0,
        safe: s.safe || 0,
        successRate: s.success_rate || '0.0'
      });

      setRecentDetections(historyRes.data.items || []);
    } catch (err) {
      setStats({ totalScans: 0, threats: 0, safe: 0, successRate: '0.0' });
    } finally {
      setLoading(false);
    }
  };

  // Build chart data from recent detections by day
  const chartData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = {};
    days.forEach(d => { dayMap[d] = { name: d, detections: 0, threats: 0 }; });

    recentDetections.forEach(d => {
      if (d.created_at) {
        const day = days[new Date(d.created_at).getDay()];
        dayMap[day].detections += 1;
        if (d.is_fake) dayMap[day].threats += 1;
      }
    });

    // Return in Mon-Sun order
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => dayMap[d]);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Scans', value: stats?.totalScans?.toLocaleString() || '0', icon: Activity, color: 'from-cyan-500 to-blue-500' },
    { label: 'Threats Found', value: stats?.threats?.toLocaleString() || '0', icon: AlertTriangle, color: 'from-red-500 to-pink-500' },
    { label: 'Safe Content', value: stats?.safe?.toLocaleString() || '0', icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
    { label: 'Success Rate', value: `${stats?.successRate || '0'}%`, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {displayName} 👋
          </h2>
          <p className="text-gray-400 mt-1">Here's your security overview</p>
        </div>
        <Link
          to="/dashboard/detect"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:opacity-90 transition-opacity text-white text-sm"
        >
          New Scan <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <div key={label} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 animate-slide-up"
               style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Threat Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff40" />
              <YAxis stroke="#ffffff40" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="detections" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorDetections)" />
              <Area type="monotone" dataKey="threats" stroke="#f472b6" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <ThreatFeed />
      </div>
    </div>
  );
};

export default Dashboard;
