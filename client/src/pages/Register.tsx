import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../store/api/authApi';
import { useAppDispatch, useAppSelector } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { addToast, toggleTheme } from '../store/slices/uiSlice';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await register({ name, email, password, organizationName }).unwrap();
      dispatch(setCredentials({ user: result.data.user, token: result.data.token }));
      dispatch(addToast({ type: 'success', message: 'Account created successfully' }));
      navigate('/app');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err?.data?.error || 'Failed to register' }));
    }
  };

  const fields = [
    { id: 'orgName', label: 'Organization Name', type: 'text', value: organizationName, onChange: setOrganizationName, placeholder: 'Acme Corp', required: true },
    { id: 'name', label: 'Your Name', type: 'text', value: name, onChange: setName, placeholder: 'John Doe', required: true },
    { id: 'email', label: 'Work Email', type: 'email', value: email, onChange: setEmail, placeholder: 'john@acme.com', required: true },
    { id: 'password', label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: '••••••••', required: true, minLength: 6 },
  ];

  return (
    <div className="min-h-screen bg-surface-base text-slate-900 dark:text-white flex relative">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2.5 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-amber-400 hover:bg-slate-300 dark:hover:bg-white/20 transition-all shadow-sm"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-center gap-12 w-1/2 p-16 relative overflow-hidden bg-gradient-to-br from-brand-50/80 via-slate-100 to-cyan-50/70 dark:from-slate-900 dark:via-slate-950 dark:to-brand-950/80 border-r border-border-subtle transition-colors duration-200">
        <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-brand-500/15 dark:bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-48 h-48 rounded-full bg-cyan-500/15 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <Link to="/" className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-xl shadow-brand text-white">🚩</div>
          <span className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-cyan-600 dark:from-brand-300 dark:to-cyan-300 bg-clip-text text-transparent">FlagForge</span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
            Start managing flags<br />
            <span className="bg-gradient-to-r from-brand-600 to-cyan-600 dark:from-brand-400 dark:to-cyan-400 bg-clip-text text-transparent">in minutes.</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Create your organization account and get instant access to multi-environment feature flag management with full audit logging.</p>
        </div>

      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-lg shadow-brand">🚩</div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-300 to-cyan-300 bg-clip-text text-transparent">FlagForge</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create your account</h1>
            <p className="text-slate-600 dark:text-slate-400">Set up your organization and start controlling feature releases.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" htmlFor={field.id}>{field.label}</label>
                <input
                  id={field.id}
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  minLength={(field as any).minLength}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
                />
              </div>
            ))}
            <button
              type="submit"
              id="register-submit-btn"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold text-base shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><span className="spinner" /> Creating Account...</span>
              ) : 'Create Account →'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
