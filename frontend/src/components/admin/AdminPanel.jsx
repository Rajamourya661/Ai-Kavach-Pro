import React, { useState, useEffect } from 'react';
import {
  Users, Shield, Activity, AlertTriangle, TrendingUp,
  Clock, UserCheck, UserX, Loader, ChevronDown, Search,
  Settings, Database, BarChart3, Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || '';

const AdminPanel = () => {

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/admin/stats`, {
        headers: { }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/admin/users`, {
        headers: { }
      });
      setUsers(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/admin/audit-logs`, {
        headers: { }
      });
      setAuditLogs(res.data.items || []);
    } catch (err) {
      console.error('Failed to fetch audit logs');
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/api/v1/admin/users/${userId}/role`,
        { role: newRole }
      );
      toast.success('Role updated successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const pieData = stats ? [
    { name: 'Deepfake', value: stats.detections_by_type?.deepfake || 0, color: '#f472b6' },
    { name: 'Voice', value: stats.detections_by_type?.voice || 0, color: '#22d3ee' },
    { name: 'Phishing', value: stats.detections_by_type?.phishing || 0, color: '#fbbf24' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-cyan-400" />
          Admin Panel
        </h2>
        <p className="text-gray-400 mt-1">System management and monitoring</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'overview', icon: BarChart3, label: 'Overview' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'audit', icon: Eye, label: 'Audit Logs' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total_users, icon: Users, color: 'from-cyan-500 to-blue-500' },
              { label: 'Total Scans', value: stats.total_detections, icon: Activity, color: 'from-purple-500 to-indigo-500' },
              { label: 'Threats Found', value: stats.total_threats, icon: AlertTriangle, color: 'from-red-500 to-pink-500' },
              { label: 'Detection Rate', value: `${stats.detection_rate}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Detection Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-gray-400">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Recent Activity</h3>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {(stats.recent_activity || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.is_fake ? 'bg-red-400' : 'bg-green-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{item.type}</p>
                        <p className="text-xs text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${item.is_fake ? 'text-red-400' : 'text-green-400'}`}>
                      {item.confidence?.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {(!stats.recent_activity || stats.recent_activity.length === 0) && (
                  <p className="text-center text-gray-500 py-8">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Joined</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="user" className="bg-slate-800">User</option>
                      <option value="premium" className="bg-slate-800">Premium</option>
                      <option value="admin" className="bg-slate-800">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-sm ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {u.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800/95">
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Action</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Resource</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">IP Address</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-sm font-mono text-cyan-400">{log.action}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-300">
                      {log.resource_type} {log.resource_id ? `#${log.resource_id.slice(0, 8)}` : ''}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400 font-mono">{log.ip_address || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-400">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-500">No audit logs yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
