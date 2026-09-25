import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { addToast } from '../store/slices/uiSlice';
import { useCreateInvitationMutation, useListMembersQuery, useRemoveMemberMutation } from '../store/api/organizationApi';

const TeamPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const canManageMembers = user?.role === 'owner' || user?.role === 'admin';
  const [createInvitation, { isLoading }] = useCreateInvitationMutation();
  const { data: membersData, isLoading: isLoadingMembers } = useListMembersQuery(undefined, { skip: !canManageMembers });
  const [removeMember] = useRemoveMemberMutation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [invitationLink, setInvitationLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const result = await createInvitation({ email, role }).unwrap();
      const link = `${window.location.origin}/invite/${encodeURIComponent(result.data.token)}`;
      setInvitationLink(link);
      setEmail('');
      dispatch(addToast({ type: 'success', message: 'Invitation created' }));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: error?.data?.error || 'Failed to create invitation' }));
    }
  };

  const copyInvitationLink = async () => {
    await navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!canManageMembers) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">You do not have permission to manage organization members.</div>;
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from the organization?`)) return;
    try {
      await removeMember(memberId).unwrap();
      dispatch(addToast({ type: 'success', message: `${memberName} was removed` }));
    } catch (error: any) {
      dispatch(addToast({ type: 'error', message: error?.data?.error || 'Failed to remove member' }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Organization</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">Invite your team</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Invite a new {user?.organizationName || 'organization'} member with a single-use link.
        </p>
      </div>

      <section className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create invitation</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">The link expires in 24 hours.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Work email</label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as 'admin' | 'member')}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold shadow-brand disabled:opacity-60"
          >
            {isLoading ? 'Creating invitation...' : 'Create invitation'}
          </button>
        </form>
      </section>

      <section className="bg-surface-card border border-border-subtle rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organization members</h2>
        {isLoadingMembers ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Loading members...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {membersData?.data.map((member) => {
              const canRemove = member.id !== user?.id && member.role !== 'owner' &&
                (user?.role === 'owner' || (user?.role === 'admin' && member.role === 'member'));
              return (
                <div key={member.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-surface-elevated border border-border-subtle">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{member.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase text-brand-600 dark:text-brand-300">{member.role}</span>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {invitationLink && (
        <section className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Invitation ready for testing</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Open this link in a private window or another browser session.</p>
          <a href={invitationLink} className="block mt-4 break-all text-sm text-brand-600 dark:text-brand-300 underline">{invitationLink}</a>
          <button
            type="button"
            onClick={copyInvitationLink}
            className="mt-4 px-4 py-2 rounded-lg bg-surface-card border border-border-subtle text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            {copied ? 'Copied' : 'Copy invitation link'}
          </button>
        </section>
      )}
    </div>
  );
};

export default TeamPage;
