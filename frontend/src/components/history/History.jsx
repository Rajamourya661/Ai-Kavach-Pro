import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon, Video, Mic, Link, AlertTriangle,
  CheckCircle, Search, Filter, ChevronLeft, ChevronRight,
  Clock, Shield, Loader, Download, Eye
} from 'lucide-react';
import axios from 'axios';


const API_URL = process.env.REACT_APP_API_URL || '';

const History = () => {

  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetection, setSelectedDetection] = useState(null);
  const perPage = 15;

  useEffect(() => {
    fetchHistory();
  }, [page, filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: perPage };
      if (filter !== 'all') params.detection_type = filter;

      const response = await axios.get(`${API_URL}/api/v1/history`, {
        params
      });
      setDetections(response.data.items || []);
      setTotal(response.data.total || 0);
      setHasNext(response.data.has_next || false);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deepfake': return <Video className="w-4 h-4" />;
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'phishing': return <Link className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-500/20 text-green-400',
      processing: 'bg-yellow-500/20 text-yellow-400',
      pending: 'bg-blue-500/20 text-blue-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const filteredDetections = detections.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.original_filename?.toLowerCase().includes(query) ||
      d.detection_type?.toLowerCase().includes(query) ||
      d.explanation?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <HistoryIcon className="w-7 h-7 text-cyan-400" />
            Detection History
          </h2>
          <p className="text-gray-400 mt-1">{total} total scans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search detections..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white text-sm"
          />
        </div>

        <div className="flex gap-2">
          {['all', 'deepfake', 'voice', 'phishing'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : filteredDetections.length === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No detections found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">File / URL</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Result</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Confidence</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetections.map((d) => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        d.detection_type === 'deepfake' ? 'bg-pink-500/20 text-pink-400' :
                        d.detection_type === 'voice' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {getTypeIcon(d.detection_type)}
                      </div>
                      <span className="text-sm font-medium capitalize text-white">{d.detection_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300 truncate max-w-[200px] block">
                      {d.original_filename || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {d.is_fake === null ? (
                      <span className="text-gray-500 text-sm">Pending</span>
                    ) : d.is_fake ? (
                      <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4" /> Threat
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Safe
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {d.confidence != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${d.confidence > 70 ? 'bg-red-500' : d.confidence > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(d.confidence, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-300">{d.confidence?.toFixed(1)}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedDetection(d)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > perPage && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNext}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDetection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
             onClick={() => setSelectedDetection(null)}>
          <div className="bg-slate-800/95 backdrop-blur-lg rounded-2xl p-6 max-w-lg w-full mx-4 border border-white/10 animate-slide-up"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white capitalize">
                {selectedDetection.detection_type} Detection Result
              </h3>
              <button onClick={() => setSelectedDetection(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-gray-400">Result</span>
                <span className={selectedDetection.is_fake ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                  {selectedDetection.is_fake ? '⚠️ Threat Detected' : '✅ Safe'}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-gray-400">Confidence</span>
                <span className="text-white font-semibold">{selectedDetection.confidence?.toFixed(1)}%</span>
              </div>
              {selectedDetection.processing_time && (
                <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Processing Time</span>
                  <span className="text-white">{selectedDetection.processing_time}s</span>
                </div>
              )}
              {selectedDetection.explanation && (
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">Explanation</p>
                  <p className="text-gray-200 text-sm">{selectedDetection.explanation}</p>
                </div>
              )}
              {selectedDetection.recommended_action && (
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <p className="text-cyan-400 text-sm font-medium mb-1">Recommended Action</p>
                  <p className="text-gray-200 text-sm">{selectedDetection.recommended_action}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
