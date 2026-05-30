import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScanLine, History, Users, Globe, Menu, X, FileText, Search, BarChart2, ClipboardList } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/detect', icon: ScanLine, label: 'Detection' },
    { path: '/dashboard/history', icon: History, label: 'History' },
    { path: '/dashboard/admin', icon: Users, label: 'Admin' },
  ];

  const citizenItems = [
    { path: '/complaint', icon: FileText, label: 'File Complaint' },
    { path: '/track', icon: Search, label: 'Track Complaint' },
    { path: '/fir', icon: ClipboardList, label: 'FIR Draft' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  ];

  const isActive = (path) => location.pathname === path;

  const NavContent = () => (
    <nav className="space-y-2">
      {menuItems.map(({ path, icon: Icon, label }) => (
        <Link
          key={path}
          to={path}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive(path)
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
              : 'hover:bg-white/5 text-gray-300'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{label}</span>
        </Link>
      ))}

      {/* Citizen Portal Section */}
      <div className="border-t border-white/10 my-3" />
      <div className="px-4 py-1">
        <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Citizen Portal</span>
      </div>

      {citizenItems.map(({ path, icon: Icon, label }) => (
        <Link
          key={path}
          to={path}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive(path)
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
              : 'hover:bg-white/5 text-gray-300'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{label}</span>
        </Link>
      ))}

      {/* Divider */}
      <div className="border-t border-white/10 my-3" />

      {/* Landing Page Link */}
      <Link
        to="/"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 transition-all"
      >
        <Globe className="w-5 h-5" />
        <span className="font-medium">Landing Page</span>
      </Link>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-40 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 hover:opacity-90 transition-opacity"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 min-h-screen bg-slate-900/95 backdrop-blur-lg border-r border-white/10 p-4 z-50">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Navigation
              </span>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 min-h-screen bg-white/5 backdrop-blur-lg border-r border-white/10 p-4">
        <NavContent />
      </aside>
    </>
  );
};

export default Sidebar;
