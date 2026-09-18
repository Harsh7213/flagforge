import React from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleTheme } from '../store/slices/uiSlice';

const AboutPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);

  return (
    <div className="min-h-screen bg-surface-base text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Navbar */}
      <nav className="border-b border-border-subtle bg-surface-elevated/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-lg shadow-brand text-white">
              🚩
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-cyan-500 dark:from-brand-300 dark:to-cyan-300 bg-clip-text text-transparent">
              FlagForge
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="text-brand-600 dark:text-brand-400 font-semibold">About</Link>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleTheme())}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle color theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-300 bg-surface-card border border-border-subtle shadow-sm hover:border-brand-500/40 transition-all text-base"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link
              to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-brand transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider">
            <span>✨</span> Mission & Vision
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Decouple deployments from releases.<br />
            <span className="bg-gradient-to-r from-brand-500 via-cyan-500 to-teal-400 bg-clip-text text-transparent">
              Empower engineering teams.
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            FlagForge is an enterprise-grade multi-tenant feature flag management system designed to eliminate high-risk deployments. Control features dynamically across Development, Staging, and Production environments without redeploying code.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-sm hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center text-2xl mb-4">
              🏢
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Multi-Tenant Architecture</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete data isolation per organization at the database layer. Secure multi-user team collaboration with case-insensitive organization boundaries.
            </p>
          </div>

          <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-sm hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-2xl mb-4">
              🎯
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Targeted Rollouts</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Target individual user IDs, custom attributes, or percentage-based traffic splits across Development, Staging, and Production environments.
            </p>
          </div>

          <div className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-sm hover:border-brand-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl mb-4">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Comprehensive Audit Log</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Full transparency with timestamped audit events logging every toggle, targeting rule edit, and environment change for regulatory compliance.
            </p>
          </div>
        </div>

        {/* Creator Section */}
        <div className="bg-gradient-to-r from-brand-500/10 via-cyan-500/10 to-teal-500/10 border border-brand-500/20 rounded-3xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center text-3xl shadow-lg text-white">
            👨‍💻
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Created with ❤️ by Harsh</h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            FlagForge was crafted with precision to deliver a seamless, high-performance feature flag platform for developers and product teams worldwide.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm shadow-brand hover:shadow-brand-lg transition-all"
            >
              Start Free Today
            </Link>
            <Link
              to="/"
              className="px-6 py-3 rounded-xl bg-surface-card border border-border-subtle text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-10 bg-surface-elevated/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-sm shadow-brand text-white">
              🚩
            </div>
            <span className="font-bold bg-gradient-to-r from-brand-600 to-cyan-500 dark:from-brand-300 dark:to-cyan-300 bg-clip-text text-transparent">FlagForge</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
            <Link to="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">About</Link>
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">Register</Link>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="font-medium text-slate-700 dark:text-slate-300">Created with ❤️ by Harsh</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
