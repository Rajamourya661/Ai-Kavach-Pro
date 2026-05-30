import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, Shield, AlertTriangle, CheckCircle, Loader, 
  Video, Mic, Link, History, Bell, ChevronRight, FileCheck,
  X, Info, Download, Share2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import axios from 'axios';
import toast from 'react-hot-toast';
import ResultVisualization from './ResultVisualization';
import generatePDFReport from '../../utils/generatePDFReport';

const API_URL = process.env.REACT_APP_API_URL || '';

const DetectionDashboard = () => {
  const [activeTab, setActiveTab] = useState('deepfake');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [stats, setStats] = useState({ totalScans: 0, threats: 0, safe: 0, successRate: '0' });
  const analysisIntervalRef = useRef(null);

  // Fetch REAL stats and history from backend
  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/stats`);
      setStats({
        totalScans: res.data.total_scans || 0,
        threats: res.data.threats || 0,
        safe: res.data.safe || 0,
        successRate: res.data.success_rate || '0',
      });
    } catch (err) {
      console.log('Stats API not available yet');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/history`);
      setHistory(response.data.items || []);
    } catch (error) {
      console.log('History API not available yet');
    }
  };

  // Drag and drop handlers
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    await handleUpload(file);
  }, [activeTab]);  // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: activeTab === 'deepfake' 
      ? { 
          'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
          'application/octet-stream': ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
          'video/mp4': ['.mp4'],
          'video/x-msvideo': ['.avi'],
          'video/quicktime': ['.mov'],
          'video/x-matroska': ['.mkv'],
        }
      : activeTab === 'voice'
      ? { 'audio/*': ['.wav', '.mp3', '.m4a', '.flac'] }
      : undefined,
    maxSize: 100 * 1024 * 1024,
    multiple: false
  });

  // ======= REAL API UPLOAD — NO MORE Math.random()! =======
  const handleUpload = async (file) => {
    setStatus('uploading');
    setUploadProgress(0);
    setAnalysisProgress(0);
    setResult(null);

    const formData = new FormData();
    formData.append(activeTab === 'voice' ? 'audio' : 'video', file);

    try {
      // Real upload with progress tracking
      const response = await axios.post(
        `${API_URL}/api/v1/detect/${activeTab}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000, // 5 min timeout for large video analysis
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            setUploadProgress(percent);
            if (percent >= 100) {
              setStatus('analyzing');
              // Simulate analysis progress while backend processes
              let progress = 0;
              const interval = setInterval(() => {
                progress += 5;
                if (progress >= 95) {
                  clearInterval(interval);
                } else {
                  setAnalysisProgress(progress);
                }
              }, 200);
              // Store interval ID for cleanup
              analysisIntervalRef.current = interval;
            }
          }
        }
      );

      // Clear analysis interval
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      setAnalysisProgress(100);

      // REAL RESULT from backend
      const realResult = response.data;
      setResult(realResult);
      setStatus('complete');
      toast.success(`Analysis complete! [${realResult.detection_method || 'AI'}]`);
      setShowVisualization(true);

      // Refresh stats and history
      fetchStats();
      fetchHistory();

    } catch (error) {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      setStatus('error');
      let errorMsg = 'Upload failed';
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Analysis timed out — try a smaller video (under 50MB)';
      } else if (error.response?.status === 413) {
        errorMsg = error.response?.data?.detail || 'File too large (max 100MB)';
      } else if (error.response?.data?.detail) {
        errorMsg = typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail);
      } else if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message;
      } else if (!error.response) {
        errorMsg = 'Cannot connect to backend — make sure server is running on port 8000';
      }
      toast.error(`Analysis failed: ${errorMsg}`);
      console.error('Upload error:', error);
    }
  };

  // ======= REAL PHISHING CHECK — Backend API =======
  const handlePhishingCheck = async (e) => {
    e.preventDefault();
    if (!urlInput) {
      toast.error('Please enter a URL');
      return;
    }

    setStatus('analyzing');
    setResult(null);
    setAnalysisProgress(0);

    // Start progress animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 90) clearInterval(interval);
      else setAnalysisProgress(progress);
    }, 100);

    try {
      const response = await axios.post(
        `${API_URL}/api/v1/detect/phishing`,
        { url: urlInput, content: contentInput || '' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      clearInterval(interval);
      setAnalysisProgress(100);

      // REAL RESULT
      const realResult = response.data;
      setResult(realResult);
      setStatus('complete');
      toast.success(`Phishing analysis complete! [${realResult.detection_method || 'AI'}]`);
      setShowVisualization(true);

      // Refresh stats
      fetchStats();
      fetchHistory();

    } catch (error) {
      clearInterval(interval);
      setStatus('error');
      const errorMsg = error.response?.data?.detail || error.message || 'Analysis failed';
      toast.error(`Analysis failed: ${errorMsg}`);
    }
  };

  const clearResult = () => {
    setResult(null);
    setStatus('idle');
    setUploadProgress(0);
    setAnalysisProgress(0);
  };

  // REAL threat distribution from history data
  const threatDistribution = (() => {
    const counts = { deepfake: 0, voice: 0, phishing: 0 };
    history.forEach(item => {
      const type = item.type || item.detection_type;
      if (counts[type] !== undefined) counts[type]++;
    });
    return [
      { name: 'Deepfake', value: counts.deepfake || 0, color: '#f472b6' },
      { name: 'Voice', value: counts.voice || 0, color: '#22d3ee' },
      { name: 'Phishing', value: counts.phishing || 0, color: '#fbbf24' },
    ];
  })();

  return (
    <div className="space-y-6">
      {/* Header Stats — REAL from backend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Scans', value: stats.totalScans.toString(), icon: FileCheck, color: 'from-cyan-500 to-blue-500' },
          { label: 'Threats Found', value: stats.threats.toString(), icon: AlertTriangle, color: 'from-red-500 to-pink-500' },
          { label: 'Safe Content', value: stats.safe.toString(), icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
          { label: 'Success Rate', value: `${stats.successRate}%`, icon: Shield, color: 'from-purple-500 to-indigo-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'deepfake', icon: Video, label: 'Deepfake Video', desc: 'Detect AI-generated videos' },
              { id: 'voice', icon: Mic, label: 'Voice Analysis', desc: 'Detect synthetic voices' },
              { id: 'phishing', icon: Link, label: 'Phishing URL', desc: 'Detect malicious links' },
            ].map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); clearResult(); }}
                className={`flex-1 p-4 rounded-xl border transition-all ${
                  activeTab === id 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${activeTab === id ? 'text-cyan-400' : 'text-gray-400'}`} />
                <p className="font-semibold text-white">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </button>
            ))}
          </div>

          {/* Upload Area */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            {activeTab === 'phishing' ? (
              <form onSubmit={handlePhishingCheck} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Suspicious URL</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Content (Optional)</label>
                  <textarea
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    placeholder="Paste email or SMS content..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-white resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'analyzing'}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {status === 'analyzing' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-5 h-5 animate-spin" /> Analyzing with AI...
                    </span>
                  ) : 'Analyze URL (Real AI)'}
                </button>
              </form>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  isDragActive 
                    ? 'border-cyan-400 bg-cyan-400/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center animate-pulse-glow">
                  {activeTab === 'deepfake' ? <Video className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {isDragActive ? 'Drop files here' : 'Drag & drop your files'}
                </h3>
                <p className="text-gray-400 mb-4">or click to browse • Max 100MB • Real AI Analysis</p>
                <p className="text-sm text-gray-500">
                  {activeTab === 'deepfake' ? 'Supports MP4, AVI, MOV, MKV' : 'Supports WAV, MP3, M4A, FLAC'}
                </p>
                {fileRejections.length > 0 && (
                  <p className="mt-4 text-red-400 text-sm">
                    File rejected: {fileRejections[0].errors[0].message}
                  </p>
                )}
              </div>
            )}

            {/* Progress Bars */}
            {status !== 'idle' && (
              <div className="mt-6 space-y-4">
                {status === 'uploading' && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Uploading to server...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {(status === 'analyzing' || status === 'complete') && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-2">
                        {status === 'analyzing' ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                        {status === 'analyzing' ? 'Real AI Analysis running...' : 'Analysis complete!'}
                      </span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500" style={{ width: `${analysisProgress}%` }} />
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Analysis failed. Make sure backend is running on port 8000.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className={`rounded-2xl p-6 border ${
              result.is_fake || result.is_phishing
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-green-500/10 border-green-500/30'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    result.is_fake || result.is_phishing ? 'bg-red-500/20' : 'bg-green-500/20'
                  }`}>
                    {result.is_fake || result.is_phishing ? (
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {result.is_fake || result.is_phishing ? '⚠️ Threat Detected' : '✅ Content Safe'}
                    </h3>
                    <p className="text-gray-400">
                      {result.detection_method && <span className="text-cyan-400 text-sm mr-2">[{result.detection_method}]</span>}
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearResult} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-300 mb-4">{result.explanation}</p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-400 mb-1">Confidence</p>
                  <p className="text-3xl font-bold">{result.confidence}%</p>
                </div>
                {result.spoof_type && (
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-400 mb-1">Attack Type</p>
                    <p className="text-lg font-semibold">{result.spoof_type}</p>
                  </div>
                )}
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-400 mb-1">Processing Time</p>
                  <p className="text-lg font-semibold">{result.processing_time}s</p>
                </div>
              </div>

              {result.threats && result.threats.length > 0 && (
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-red-400 mb-2">Detected Threats:</p>
                  <ul className="space-y-1">
                    {result.threats.map((threat, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> {threat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommended_action && (
                <div className="bg-white/5 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <p className="text-gray-300">{result.recommended_action}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Threat Distribution */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Threat Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={threatDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {threatDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent History — REAL from backend */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-400">Recent Scans</h3>
              <button className="text-xs text-cyan-400 hover:text-cyan-300">View All</button>
            </div>
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.is_fake ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {item.type === 'deepfake' ? <Video className="w-4 h-4" /> :
                       item.type === 'voice' ? <Mic className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{item.type || item.detection_type}</p>
                      <p className="text-xs text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${item.is_fake ? 'text-red-400' : 'text-green-400'}`}>
                    {item.is_fake ? 'Threat' : 'Safe'}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">No scans yet — try uploading a file!</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Result Visualization Modal */}
      {showVisualization && result && (
        <ResultVisualization
          result={result}
          onClose={() => setShowVisualization(false)}
          onExportPDF={generatePDFReport}
        />
      )}
    </div>
  );
};

export default DetectionDashboard;
