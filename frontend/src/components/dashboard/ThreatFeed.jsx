import React, { useState, useEffect } from 'react';
import { Shield, Video, Mic, Link, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const getIcon = (type) => {
  switch (type) {
    case 'deepfake': return Video;
    case 'voice': return Mic;
    case 'phishing': return Link;
    default: return Shield;
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'deepfake': return 'bg-pink-500/20 text-pink-400';
    case 'voice': return 'bg-cyan-500/20 text-cyan-400';
    case 'phishing': return 'bg-amber-500/20 text-amber-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const ThreatFeed = () => {
  const [feed, setFeed] = useState([]);
  const [isLive, setIsLive] = useState(true);

  // Fetch REAL detection history from backend
  const fetchFeed = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/history`, {
        params: { page: 1, per_page: 10 }
      });
      const items = (res.data.items || []).map(item => ({
        id: item.id,
        type: item.detection_type || item.type,
        filename: item.original_filename || '—',
        isThreat: item.is_fake,
        confidence: item.confidence || 0,
        time: item.created_at ? getTimeAgo(item.created_at) : '—',
      }));
      setFeed(items);
      setIsLive(true);
    } catch (err) {
      console.log('Threat feed API not available');
      setIsLive(false);
    }
  };

  // Calculate relative time
  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  useEffect(() => {
    fetchFeed();
    // Poll every 10 seconds for new results
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          {isLive ? 'Live Threat Feed' : 'Threat Feed (Offline)'}
        </h3>
        <span className="text-xs text-gray-500">{isLive ? 'Real-time' : 'Backend unavailable'}</span>
      </div>

      <div className="divide-y divide-white/5 max-h-[400px] overflow-hidden">
        {feed.map((item, i) => {
          const Icon = getIcon(item.type);
          return (
            <div
              key={item.id || i}
              className="flex items-center gap-3 p-3 hover:bg-white/5 transition-all duration-500"
              style={{
                animation: i === 0 ? 'slideDown 0.5s ease-out' : 'none',
                opacity: 1 - (i * 0.06),
              }}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(item.type)}`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{item.filename}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.isThreat ? (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" /> Threat
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-3 h-3" /> Safe
                    </span>
                  )}
                  <span className="text-xs text-gray-500">•</span>
                  <span className={`text-xs font-mono ${item.confidence > 70 ? 'text-red-400' : 'text-gray-400'}`}>
                    {item.confidence?.toFixed?.(1) || item.confidence}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                <Clock className="w-3 h-3" />
                {item.time}
              </div>
            </div>
          );
        })}
        {feed.length === 0 && (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No scans yet — run a detection to see results here</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ThreatFeed;
