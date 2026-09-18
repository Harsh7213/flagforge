import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetFlagQuery,
  useUpdateFlagMutation,
  useDeleteFlagMutation,
  useToggleEnvironmentMutation,
  useGetFlagAuditLogsQuery,
} from '../store/api/flagsApi';
import { useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';
import type { Environment } from '../types';
import RulesEditor from '../components/RulesEditor';
import AuditTimeline from '../components/AuditTimeline';

const ENV_CONFIG = [
  { env: 'development' as Environment, label: 'Development', icon: '🧪', badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' },
  { env: 'staging' as Environment, label: 'Staging', icon: '🔶', badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400' },
  { env: 'production' as Environment, label: 'Production', icon: '🚀', badgeClass: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-400' },
];

type ActiveTab = 'overview' | 'audit';

const FlagDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Optimistic local state for flag toggles
  const [optimisticEnvs, setOptimisticEnvs] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useGetFlagQuery(id!);
  const { data: auditData } = useGetFlagAuditLogsQuery(id!);
  const [updateFlag, { isLoading: isUpdating }] = useUpdateFlagMutation();
  const [deleteFlag, { isLoading: isDeleting }] = useDeleteFlagMutation();
  const [toggleEnv] = useToggleEnvironmentMutation();

  const flag = data?.data;

  const getEnvEnabled = (env: Environment) => {
    if (optimisticEnvs[env] !== undefined) return optimisticEnvs[env];
    const envData = flag?.environments?.find((e) => e.environment === env);
    return envData?.enabled ?? false;
  };

  const handleToggle = async (env: Environment) => {
    if (!flag || flag.archived) return;
    const currentEnabled = getEnvEnabled(env);
    const nextEnabled = !currentEnabled;

    // 1. Instant local optimistic update for zero delay
    setOptimisticEnvs((prev) => ({ ...prev, [env]: nextEnabled }));

    // 2. Fire mutation
    try {
      await toggleEnv({ flagId: flag.id, env, enabled: nextEnabled }).unwrap();
      dispatch(addToast({
        type: 'success',
        message: `${flag.name} ${nextEnabled ? 'enabled' : 'disabled'} in ${env}`,
      }));
    } catch {
      setOptimisticEnvs((prev) => ({ ...prev, [env]: currentEnabled }));
      dispatch(addToast({ type: 'error', message: 'Failed to toggle environment' }));
    }
  };

  const handleStartEdit = () => {
    if (!flag) return;
    setEditName(flag.name);
    setEditDesc(flag.description ?? '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!flag) return;
    try {
      await updateFlag({ id: flag.id, name: editName, description: editDesc }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Flag updated successfully' }));
      setIsEditing(false);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update flag' }));
    }
  };

  const handleArchive = async () => {
    if (!flag) return;
    try {
      await updateFlag({ id: flag.id, archived: !flag.archived }).unwrap();
      dispatch(addToast({
        type: 'success',
        message: flag.archived ? 'Flag restored' : 'Flag archived',
      }));
      navigate('/app/flags');
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to archive flag' }));
    }
  };

  const handleDelete = async () => {
    if (!flag) return;
    try {
      await deleteFlag(flag.id).unwrap();
      dispatch(addToast({ type: 'success', message: `Flag "${flag.name}" deleted` }));
      navigate('/app/flags');
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete flag' }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-500 dark:text-slate-400">
        <span className="spinner" /> Loading flag details...
      </div>
    );
  }

  if (!flag) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl bg-surface-card border border-border-subtle shadow-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-3">Flag not found</h3>
        <button
          className="px-4 py-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 text-sm font-medium hover:bg-brand-500/20 transition-all"
          onClick={() => navigate('/app/flags')}
          id="back-to-flags"
        >
          ← Back to Flags
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          onClick={() => navigate('/app/flags')}
          id="back-btn"
        >
          ← Back to Flags
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="space-y-2 flex-1">
          {isEditing ? (
            <input
              className="w-full max-w-md px-3 py-1.5 text-xl font-bold rounded-xl bg-surface-elevated border border-border-subtle text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              id="edit-flag-name"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{flag.name}</h1>
              {flag.archived && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  Archived
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs">
            <code className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-300 font-mono border border-brand-500/20">
              {flag.key}
            </code>
            <span className="text-slate-500 dark:text-slate-400">
              Created {new Date(flag.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isEditing ? (
            <>
              <button
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-medium text-sm transition-all shadow-sm"
                onClick={handleSaveEdit}
                disabled={isUpdating}
                id="save-flag-btn"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border-subtle text-slate-700 dark:text-slate-300 text-sm font-medium transition-all"
                onClick={() => setIsEditing(false)}
                id="cancel-edit-btn"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border-subtle text-slate-700 dark:text-slate-300 text-sm font-medium transition-all shadow-sm"
                onClick={handleStartEdit}
                id="edit-flag-btn"
              >
                ✏️ Edit
              </button>
              <button
                className="px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border-subtle text-slate-700 dark:text-slate-300 text-sm font-medium transition-all shadow-sm"
                onClick={handleArchive}
                id="archive-flag-btn"
              >
                {flag.archived ? '📤 Restore' : '📦 Archive'}
              </button>
              <button
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium transition-all shadow-sm"
                onClick={() => setShowDeleteConfirm(true)}
                id="delete-flag-btn"
              >
                🗑 Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {isEditing ? (
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" htmlFor="edit-flag-desc">
            Description
          </label>
          <textarea
            id="edit-flag-desc"
            rows={2}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-y"
          />
        </div>
      ) : flag.description ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">{flag.description}</p>
      ) : null}

      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        {(['overview', 'audit'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            id={`tab-${tab}`}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all capitalize ${
              activeTab === tab
                ? 'border-brand-500 text-brand-600 dark:text-brand-300 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'overview' ? 'Overview & Environments' : 'Audit Log'}
          </button>
        ))}
      </div>

      {/* Overview Tab — Environments */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {ENV_CONFIG.map(({ env, label, icon, badgeClass }) => {
            const envData = flag.environments?.find((e) => e.environment === env);
            const enabled = getEnvEnabled(env);

            return (
              <div
                key={env}
                className={`p-6 rounded-2xl bg-surface-card border transition-all duration-200 space-y-5 shadow-sm ${
                  enabled ? 'border-emerald-500/40' : 'border-border-subtle opacity-85'
                }`}
              >
                {/* Env header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${badgeClass}`}>
                      {label}
                    </span>
                  </div>

                  {/* Smooth Hardware-Accelerated Toggle switch */}
                  <button
                    id={`env-toggle-${env}`}
                    disabled={flag.archived}
                    onClick={() => handleToggle(env)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enabled ? 'bg-emerald-500 shadow-green' : 'bg-slate-300 dark:bg-slate-700'
                    } ${flag.archived ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  />
                  <span className={`text-xs font-semibold ${enabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {enabled ? 'Active / Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="border-t border-border-subtle pt-4">
                  {/* Rules Editor */}
                  {envData && (
                    <RulesEditor flagId={flag.id} environment={{ ...envData, enabled }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <AuditTimeline logs={auditData?.data ?? []} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface-card border border-border-subtle space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Flag</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 dark:text-white">{flag.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 rounded-xl bg-surface-card hover:bg-surface-elevated border border-border-subtle text-slate-700 dark:text-slate-300 text-sm font-medium transition-all"
                onClick={() => setShowDeleteConfirm(false)}
                id="cancel-delete-btn"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-medium text-sm transition-all"
                onClick={handleDelete}
                disabled={isDeleting}
                id="confirm-delete-btn"
              >
                {isDeleting ? 'Deleting...' : 'Delete Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlagDetail;
