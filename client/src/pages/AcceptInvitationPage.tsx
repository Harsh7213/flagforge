import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import { useAcceptInvitationMutation } from '../store/api/organizationApi';

const AcceptInvitationPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [acceptInvitation, { isLoading }] = useAcceptInvitationMutation();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await acceptInvitation({ token, name, password }).unwrap();
      dispatch(setCredentials({ user: result.data.user, expiresAt: result.data.expiresAt }));
      dispatch(addToast({ type: 'success', message: `Welcome to ${result.data.user.organizationName}` }));
      navigate('/app', { replace: true });
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: error?.data?.error || 'Failed to accept invitation' }));
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-slate-900 dark:text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-xl shadow-brand">🚩</div>
          <span className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-cyan-500 dark:from-brand-300 dark:to-cyan-300 bg-clip-text text-transparent">FlagForge</span>
        </Link>

        <section className="bg-surface-card border border-border-subtle rounded-2xl p-7 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Team invitation</p>
          <h1 className="text-3xl font-bold mt-3">Join your organization</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Create your account to accept this invitation.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="invite-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your name</label>
              <input
                id="invite-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div>
              <label htmlFor="invite-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <input
                id="invite-password"
                type="password"
                required
                minLength={14}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 14 characters"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold shadow-brand disabled:opacity-60"
            >
              {isLoading ? 'Joining organization...' : 'Accept invitation'}
            </button>
          </form>
          {!token && <p className="text-sm text-red-500 mt-4">This invitation link is missing its token.</p>}
        </section>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
