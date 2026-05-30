import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './components/dashboard/Dashboard';
import DetectionDashboard from './components/detection/DetectionDashboard';
import History from './components/history/History';
import AdminPanel from './components/admin/AdminPanel';
import LandingPage from './components/landing/LandingPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import useAuthStore from './context/AuthStore';
import { Shield, ArrowLeft } from 'lucide-react';
import CitizenComplaintPortal from './components/citizen/CitizenComplaintPortal';
import CaseTracker from './components/citizen/CaseTracker';
import PredictiveAnalyticsDashboard from './components/citizen/PredictiveAnalyticsDashboard';
import FIRAutoDraft from './components/citizen/FIRAutoDraft';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
    <div className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/20 rounded-2xl flex items-center justify-center">
        <Shield className="w-8 h-8 text-cyan-400" />
      </div>
      <h2 className="text-4xl font-bold text-white mb-2">404</h2>
      <p className="text-gray-400 mb-6">Page not found.</p>
      <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:opacity-90 transition-opacity text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  </div>
);

function App() {
  const { token } = useAuthStore();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/complaint" element={<CitizenComplaintPortal />} />
      <Route path="/track" element={<CaseTracker />} />
      <Route path="/analytics" element={<PredictiveAnalyticsDashboard />} />
      <Route path="/fir" element={<FIRAutoDraft />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="detect" element={<DetectionDashboard />} />
        <Route path="history" element={<History />} />
        <Route path="admin" element={
          <ProtectedRoute adminOnly>
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;