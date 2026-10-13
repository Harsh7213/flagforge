import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../store/api/authApi';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setCredentials } from '../store/slices/authSlice';
import { addToast, toggleTheme } from '../store/slices/uiSlice';
import { getApiErrorMessage } from '../utils/errorMessage';
import { INPUT_LIMITS } from '../../../shared/inputLimits';

const features = [
  'Multi-tenant isolation',
  'Targeting rules & rollouts',
  'Full audit trail',
  '3-environment support'
];

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.ui.theme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: result.data.user, expiresAt: result.data.expiresAt }));
      dispatch(addToast({ type: 'success', message: 'Logged in successfully' }));
      navigate('/app');
    } catch (error: unknown) {
      dispatch(
        addToast({
          type: 'error',
          message: getApiErrorMessage(error, 'Failed to login')
        })
      );
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-slate-900 dark:text-white flex relative">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => dispatch(toggleTheme())}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
          className="hover:border-amber-500 hover:shadow-amber w-9 h-9 rounded-xl flex items-center justify-center bg-surface-card border border-border-subtle transition-all"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center gap-12 w-1/2 p-16 relative overflow-hidden bg-linear-to-br from-brand-50/80 via-slate-100 to-cyan-50/70 dark:from-slate-900 dark:via-slate-950 dark:to-brand-900/80 border-r border-border-subtle transition-colors duration-200">
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-500/15 dark:bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-cyan-500/15 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />

        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-brand-500 to-cyan-400 flex items-center justify-center shadow-brand-light dark:shadow-brand">
            <img
              src="/flag-icon.svg"
              alt=""
              aria-hidden="true"
              className="w-6 h-6 brightness-0 invert"
            />
          </div>
          <span className="text-xl font-bold bg-linear-to-r from-brand-500 to-cyan-500 dark:from-brand-300 dark:to-cyan-200 bg-clip-text text-transparent">
            FlagForge
          </span>
        </Link>

        <div className="relative space-y-6">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Control your features.
            <br />
            <span className="bg-linear-to-r from-brand-600 to-cyan-600 dark:from-brand-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Ship with confidence.
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-md">
            Toggle feature flags across different environments without touching your codebase.
          </p>
          <div className="flex flex-col gap-3">
            <ul className="py-5 list-none">
              {features.map(item => (
                <li
                  key={item}
                  className="flex items-center gap-3 py-2 text-slate-700 dark:text-slate-300"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel*/}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden mb-10 items-center justify-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-brand-500 to-cyan-400 flex items-center justify-center shadow-brand-light dark:shadow-brand">
              <img
                src="/flag-icon.svg"
                alt=""
                aria-hidden="true"
                className="w-6 h-6 brightness-0 invert"
              />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-brand-500 to-cyan-500 dark:from-brand-300 dark:to-cyan-200 bg-clip-text text-transparent">
              FlagForge
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
            <p className="text-slate-600 dark:text-slate-400">Sign in to your FlagForge account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                htmlFor="email"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={INPUT_LIMITS.email}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold text-base shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" /> Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-brand-600 dark:text-brand-400 hover:underline font-medium transition-colors"
            >
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
