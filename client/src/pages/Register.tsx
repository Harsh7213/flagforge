import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../store/api/authApi';
import { useAppDispatch, useAppSelector } from '../store/store';
import { setCredentials } from '../store/slices/authSlice';
import { addToast, toggleTheme } from '../store/slices/uiSlice';
import { getApiErrorMessage } from '../utils/errorMessage';
import { INPUT_LIMITS } from '../../../shared/inputLimits';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.ui.theme);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await register({ name, email, password, organizationName }).unwrap();
      dispatch(setCredentials({ user: result.data.user, expiresAt: result.data.expiresAt }));
      dispatch(
        addToast({
          id: crypto.randomUUID(),
          type: 'success',
          message: 'Account created successfully'
        })
      );
      navigate('/app');
    } catch (error: unknown) {
      dispatch(
        addToast({
          id: crypto.randomUUID(),
          type: 'error',
          message: getApiErrorMessage(error, 'Failed to register')
        })
      );
    }
  };

  type FormField = {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    required: boolean;
    minLength?: number;
    maxLength?: number;
  };

  const fields: FormField[] = [
    {
      id: 'orgName',
      label: 'Organization Name',
      type: 'text',
      value: organizationName,
      onChange: setOrganizationName,
      placeholder: 'Acme Corp',
      required: true,
      maxLength: INPUT_LIMITS.organizationName
    },
    {
      id: 'name',
      label: 'Your Name',
      type: 'text',
      value: name,
      onChange: setName,
      placeholder: 'John Doe',
      required: true,
      maxLength: INPUT_LIMITS.userName
    },
    {
      id: 'email',
      label: 'Work Email',
      type: 'email',
      value: email,
      onChange: setEmail,
      placeholder: 'john@acme.com',
      required: true,
      maxLength: INPUT_LIMITS.email
    },
    {
      id: 'password',
      label: 'Password',
      type: 'password',
      value: password,
      onChange: setPassword,
      placeholder: '••••••',
      required: true,
      minLength: INPUT_LIMITS.passwordMinimum
    }
  ];

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

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-center gap-12 w-1/2 p-16 relative overflow-hidden bg-linear-to-br from-brand-50/80 via-slate-100 to-cyan-50/70 dark:from-slate-900 dark:via-slate-950 dark:to-brand-900/80 border-r border-border-subtle transition-colors duration-200">
        {/* Glow blobs */}
        <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full bg-brand-500/15 dark:bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-48 h-48 rounded-full bg-cyan-500/15 dark:bg-cyan-500/15 blur-3xl pointer-events-none" />
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
            Start managing flags
            <br />
            <span className="bg-linear-to-r from-brand-600 to-cyan-600 dark:from-brand-400 dark:to-cyan-400 bg-clip-text text-transparent">
              in minutes.
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-md">
            Create your organization account and get instant access to multi-environment feature
            flag management with full audit logging.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg">
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Create your account
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Set up your organization and start controlling feature releases.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(field => (
              <div key={field.id}>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  htmlFor={field.id}
                >
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
                />
              </div>
            ))}
            <button
              type="submit"
              id="register-submit-btn"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold text-base shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" /> Creating Account...
                </span>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-600 dark:text-brand-400 hover:underline font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
