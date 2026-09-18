import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleTheme } from '../store/slices/uiSlice';

const features = [
  {
    icon: '🏢',
    title: 'Multi-Tenant Isolation',
    desc: 'Every organization gets a completely isolated view. Your flags are never visible to other companies — enforced at the database layer.',
    color: 'from-violet-500/15 to-purple-500/15 border-violet-500/30',
    iconBg: 'bg-violet-500/20 text-violet-600 dark:text-violet-300',
  },
  {
    icon: '🎯',
    title: 'Targeting Rules',
    desc: 'Roll out to specific user IDs, groups, or a percentage of traffic. Fine-grained control over who sees what.',
    color: 'from-cyan-500/15 to-teal-500/15 border-cyan-500/30',
    iconBg: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300',
  },
  {
    icon: '🌍',
    title: '3 Environments',
    desc: 'Development, Staging, and Production environments per flag. Promote changes safely through your pipeline.',
    color: 'from-emerald-500/15 to-green-500/15 border-emerald-500/30',
    iconBg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
  },
  {
    icon: '📋',
    title: 'Full Audit Trail',
    desc: 'Every toggle, rule change, and flag creation is logged with actor and timestamp. Compliance-ready out of the box.',
    color: 'from-amber-500/15 to-orange-500/15 border-amber-500/30',
    iconBg: 'bg-amber-500/20 text-amber-600 dark:text-amber-300',
  },
  {
    icon: '⚡',
    title: 'Instant Toggles',
    desc: 'Enable or disable features with a single click. No deployments needed. Changes reflect immediately via the SDK.',
    color: 'from-yellow-500/15 to-amber-500/15 border-yellow-500/30',
    iconBg: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-300',
  },
  {
    icon: '🔒',
    title: 'SQL Injection Safe',
    desc: 'All queries use parameterized statements. Zod validation on every input. JWT-secured endpoints with organization-scoped access.',
    color: 'from-red-500/15 to-rose-500/15 border-red-500/30',
    iconBg: 'bg-red-500/20 text-red-600 dark:text-red-300',
  },
];

const steps = [
  { num: '01', title: 'Create Your Organization', desc: 'Register your company account in seconds. Each organization is fully isolated with its own projects and users.' },
  { num: '02', title: 'Create a Project & Flags', desc: 'Organize flags by product or team. Each flag gets Development, Staging, and Production environments automatically.' },
  { num: '03', title: 'Toggle & Target in Real Time', desc: 'Use the dashboard to enable flags, add targeting rules, and watch your rollout happen without redeploying.' },
];

const CodeSnippet = () => (
  <div className="relative group animate-float">
    <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
    <div className="relative bg-surface-elevated border border-border-subtle rounded-2xl p-6 font-mono text-sm shadow-glass">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className="ml-2 text-slate-500 dark:text-slate-400 text-xs">feature-flags.ts</span>
      </div>
      <pre className="text-left leading-relaxed">
        <span className="text-slate-500 dark:text-slate-400">// Evaluate a flag for a user</span>{'\n'}
        <span className="text-brand-600 dark:text-brand-300 font-semibold">const</span>{' '}
        <span className="text-cyan-600 dark:text-cyan-300">result</span>{' = '}
        <span className="text-slate-700 dark:text-slate-300">await</span>{' client.'}{'\n'}
        {'  '}
        <span className="text-amber-600 dark:text-amber-300 font-semibold">evaluate</span>
        {'({\n'}
        {'    '}
        <span className="text-emerald-600 dark:text-emerald-300">flagKey</span>
        {': '}
        <span className="text-orange-600 dark:text-orange-300">'dark_mode'</span>
        {',\n'}
        {'    '}
        <span className="text-emerald-600 dark:text-emerald-300">userId</span>
        {': '}
        <span className="text-orange-600 dark:text-orange-300">'user_123'</span>
        {',\n'}
        {'    '}
        <span className="text-emerald-600 dark:text-emerald-300">env</span>
        {': '}
        <span className="text-orange-600 dark:text-orange-300">'production'</span>
        {',\n'}
        {'  });\n\n'}
        <span className="text-slate-500 dark:text-slate-400">// result.enabled → true ✓</span>
      </pre>
    </div>
  </div>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const theme = useAppSelector((s) => s.ui.theme);
  const [scrolled, setScrolled] = useState(false);

  // Redirect already-authenticated users to app
  useEffect(() => {
    if (token) navigate('/app', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-surface-base text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-200">

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface-elevated/90 backdrop-blur-xl border-b border-border-subtle shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-lg shadow-brand text-white">
              🚩
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-cyan-500 dark:from-brand-300 dark:to-cyan-300 bg-clip-text text-transparent">
              FlagForge
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">How It Works</a>
            <Link to="/about" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">About</Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              id="landing-theme-toggle"
              onClick={() => dispatch(toggleTheme())}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle color theme"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-300 bg-surface-card border border-border-subtle shadow-sm hover:border-brand-500/40 transition-all text-base"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link to="/login" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white shadow-brand transition-all duration-200 hover:shadow-brand-lg hover:-translate-y-px"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-brand-500/10 dark:bg-brand-500/15 blur-3xl" />
          <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-64 rounded-full bg-brand-600/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brand-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-500 dark:bg-brand-400 animate-pulse" />
              Multi-tenant Feature Flag Management
            </div>
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] mb-6 text-slate-900 dark:text-white">
              Ship Features
              <span className="block bg-gradient-to-r from-brand-600 via-violet-600 to-cyan-600 dark:from-brand-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
                With Confidence
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-10 max-w-lg">
              Control every feature release across Development, Staging, and Production.
              Target specific users, roll out by percentage, and never touch your codebase to toggle a flag.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                id="hero-get-started-btn"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold text-lg shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-1"
              >
                Get Started Free
                <span>→</span>
              </Link>
              <Link
                to="/login"
                id="hero-signin-btn"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-surface-card hover:bg-surface-elevated border border-border-subtle text-slate-800 dark:text-white font-semibold text-lg transition-all duration-200 shadow-sm"
              >
                Sign In
              </Link>
            </div>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-4 mt-12">
              {[
                { label: 'Environments', value: '3' },
                { label: 'Targeting Rules', value: '∞' },
                { label: 'Audit Logs', value: '100%' },
              ].map((stat) => (
                <div key={stat.label} className="px-4 py-2 rounded-xl bg-surface-card border border-border-subtle flex items-center gap-2 shadow-sm">
                  <span className="text-xl font-bold text-brand-600 dark:text-brand-300">{stat.value}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Code snippet */}
          <div className="hidden lg:block">
            <CodeSnippet />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              Everything you need to
              <span className="bg-gradient-to-r from-brand-600 to-cyan-600 dark:from-brand-400 dark:to-cyan-400 bg-clip-text text-transparent"> ship safely</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Built for engineering teams that demand reliability, security, and full observability over their feature rollouts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className={`group relative p-6 rounded-2xl bg-surface-card border border-border-subtle hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-md transition-all duration-300`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-12 h-12 rounded-xl ${feat.iconBg} flex items-center justify-center text-2xl mb-4`}>
                  {feat.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 relative">
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
              Up and running in
              <span className="bg-gradient-to-r from-brand-600 to-cyan-600 dark:from-brand-400 dark:to-cyan-400 bg-clip-text text-transparent"> 3 steps</span>
            </h2>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-16 bottom-16 w-px bg-gradient-to-b from-brand-500/50 via-cyan-500/30 to-transparent hidden md:block" />

            <div className="space-y-10">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-8 group">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-mono font-bold text-brand-600 dark:text-brand-300 text-lg group-hover:shadow-brand transition-all duration-300">
                    {step.num}
                  </div>
                  <div className="pt-3">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl p-12 text-center shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-violet-900 text-white rounded-3xl" />
            <div className="relative">
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 text-white">
                Ready to ship better?
              </h2>
              <p className="text-lg text-brand-100 mb-10 max-w-xl mx-auto">
                Join teams already using FlagForge to roll out features safely, target users precisely, and keep full audit visibility.
              </p>
              <Link
                to="/register"
                id="cta-get-started-btn"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-brand-700 font-bold text-lg hover:bg-slate-100 shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                Create Free Account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-border-subtle py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-sm shadow-brand text-white">
              🚩
            </div>
            <span className="font-bold bg-gradient-to-r from-brand-600 to-cyan-500 dark:from-brand-300 dark:to-cyan-300 bg-clip-text text-transparent">FlagForge</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400 font-medium">
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

export default LandingPage;
