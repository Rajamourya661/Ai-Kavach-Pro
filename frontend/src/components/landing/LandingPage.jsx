import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Video, Mic, Link as LinkIcon, ArrowRight, CheckCircle,
  Zap, Lock, Globe, BarChart3, Users, Clock, ChevronRight, Star
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [counters, setCounters] = useState({ scans: 0, threats: 0, users: 0 });

  // Fetch REAL stats from backend, then animate
  useEffect(() => {
    const animateCounters = (targets) => {
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        const progress = Math.min(step / steps, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        setCounters({
          scans: Math.floor(targets.scans * eased),
          threats: Math.floor(targets.threats * eased),
          users: Math.floor(targets.users * eased),
        });
        if (step >= steps) clearInterval(timer);
      }, interval);

      return () => clearInterval(timer);
    };

    // Try real backend stats first
    const fetchAndAnimate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/stats`);
        const data = await res.json();
        animateCounters({
          scans: data.total_scans || 0,
          threats: data.threats || 0,
          users: data.safe || 0,  // Show "safe" count as "Protected Users"
        });
      } catch {
        // Backend not available — show zeros (honest)
        setCounters({ scans: 0, threats: 0, users: 0 });
      }
    };

    fetchAndAnimate();
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => setActiveFeature(prev => (prev + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Video, title: 'Deepfake Detection', color: 'from-pink-500 to-rose-500',
      desc: 'Multi-factor video analysis using EfficientNet CNN with face consistency scoring, edge artifact detection, and blink pattern analysis.',
      stats: '5-Factor Analysis'
    },
    {
      icon: Mic, title: 'Voice Anti-Spoofing', color: 'from-cyan-500 to-blue-500',
      desc: 'Spectral feature analysis using 89 audio features including MFCCs, spectral centroid, flatness, and temporal dynamics.',
      stats: '89 Feature Extraction'
    },
    {
      icon: LinkIcon, title: 'Phishing Detection', color: 'from-amber-500 to-orange-500',
      desc: 'XGBoost ML model trained on 20 URL features with homoglyph detection, brand impersonation analysis, and entropy scoring.',
      stats: '20+ Heuristic Rules'
    },
  ];

  const techStack = [
    { name: 'FastAPI', desc: 'Async Python backend' },
    { name: 'React 18', desc: 'Modern frontend' },
    { name: 'PostgreSQL', desc: 'Primary database' },
    { name: 'Redis', desc: 'Cache & rate limiting' },
    { name: 'PyTorch', desc: 'Deep learning' },
    { name: 'Docker', desc: 'Containerized' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">

      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-[0.03]"
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            KAVACH AI
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <a href="#features" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="#tech" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors">Tech Stack</a>
          <Link to="/dashboard" className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Dashboard →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">AI-Powered Security Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight mb-6">
              Detect Deepfakes &{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Social Engineering
              </span>
              {' '}in Seconds
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
              Enterprise-grade AI platform for detecting deepfake videos, voice spoofing,
              and phishing attacks. Built with cutting-edge machine learning.
            </p>

            <div className="flex items-center gap-4 mb-12">
              <Link to="/dashboard" className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                Start Scanning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-semibold hover:bg-white/10 transition-colors">
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 sm:gap-8">
              {[
                { label: 'Scans Performed', value: counters.scans.toLocaleString() },
                { label: 'Threats Blocked', value: counters.threats.toLocaleString() },
                { label: 'Safe Content', value: counters.users.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-3xl font-bold text-white">{value}+</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="flex-1 relative hidden lg:block">
            <div className="w-full h-[420px] bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl border border-white/10 backdrop-blur-sm p-6 relative overflow-hidden">
              {/* Scan animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent animate-pulse" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">video_interview.mp4</p>
                    <p className="text-xs text-green-400">✓ Authentic — 94.2% confidence</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-red-500/20">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">suspicious_call.wav</p>
                    <p className="text-xs text-red-400">⚠ Voice Spoofing — TTS Detected</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-red-500/20">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">paypal-verify.tk/login</p>
                    <p className="text-xs text-red-400">⚠ Phishing — Brand Impersonation</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">voice_memo_01.mp3</p>
                    <p className="text-xs text-green-400">✓ Authentic — Natural speech patterns</p>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4">Three Layers of Protection</h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Comprehensive AI-powered detection across video, audio, and web threats
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div
              key={feat.title}
              className={`p-8 rounded-2xl border transition-all duration-500 cursor-pointer ${
                activeFeature === i
                  ? 'bg-white/10 border-cyan-500/30 shadow-lg shadow-cyan-500/10 scale-105'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
              onClick={() => setActiveFeature(i)}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${feat.color} flex items-center justify-center mb-6`}>
                <feat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{feat.desc}</p>
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                <BarChart3 className="w-4 h-4" />
                {feat.stats}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-24">
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl border border-white/10 p-6 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Enterprise Security Built-In</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Lock, label: 'Argon2 Hashing', desc: 'Military-grade password security' },
              { icon: Shield, label: 'JWT + RBAC', desc: 'Role-based access control' },
              { icon: Globe, label: 'Rate Limiting', desc: 'Redis sliding window protection' },
              { icon: Clock, label: 'Audit Logging', desc: 'Full operation trail' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="text-center p-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="font-semibold mb-1">{label}</h4>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Built With Modern Tech</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {techStack.map(({ name, desc }) => (
            <div key={name} className="p-5 bg-white/5 rounded-2xl border border-white/10 text-center hover:bg-white/10 transition-colors">
              <p className="font-bold text-lg mb-1">{name}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-8 py-24 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Secure Your Content?</h2>
        <p className="text-gray-400 text-lg mb-8">Start detecting deepfakes, voice spoofing, and phishing attacks in seconds.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
          Launch Dashboard <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold">KAVACH AI Pro</span>
            <span className="text-gray-500 text-sm ml-2">v3.0.0</span>
          </div>
          <p className="text-gray-500 text-sm">Made with ❤️ in India</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
