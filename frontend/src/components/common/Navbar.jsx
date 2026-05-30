import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Bell, LogIn, LogOut, User, X } from 'lucide-react';
import useAuthStore from '../../context/AuthStore';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const Navbar = () => {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch recent threats as notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/v1/history`, { params: { per_page: 5 } });
        const threats = (res.data.items || [])
          .filter(d => d.is_fake)
          .map(d => ({
            id: d.id,
            text: `Threat detected in ${d.detection_type}: ${d.original_filename || 'Unknown'}`,
            time: d.created_at ? new Date(d.created_at).toLocaleString() : '',
            type: d.detection_type,
          }));
        setNotifications(threats);
      } catch {
        // Backend not available
      }
    };
    fetchNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.username || (token ? 'User' : 'Guest');
  const displayRole = user?.role || (token ? 'user' : 'demo');

  return (
    <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/dashboard" className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              KAVACH AI Pro
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b border-white/10">
                  <span className="text-sm font-semibold">Notifications</span>
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-6">No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 hover:bg-white/5 border-b border-white/5">
                        <p className="text-sm text-gray-200">{n.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-gray-400">{displayRole}</p>
          </div>

          {/* Auth Button */}
          {token ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
