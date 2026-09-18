import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FeatureFlag, Environment } from '../types';
import { useToggleEnvironmentMutation } from '../store/api/flagsApi';
import { useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';

interface Props {
  flag: FeatureFlag;
}

const ENV_CONFIG: { env: Environment; label: string; enabled: string; disabled: string }[] = [
  { env: 'development', label: 'Dev',     enabled: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',     disabled: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent' },
  { env: 'staging',     label: 'Staging', enabled: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',  disabled: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent' },
  { env: 'production',  label: 'Prod',    enabled: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', disabled: 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent' },
];

const FlagCard: React.FC<Props> = ({ flag }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [toggleEnv] = useToggleEnvironmentMutation();

  // Optimistic local state for immediate 0ms feedback & smooth animation
  const [optimisticEnvs, setOptimisticEnvs] = useState<Record<string, boolean>>({});

  const getEnvEnabled = (env: Environment) => {
    if (optimisticEnvs[env] !== undefined) return optimisticEnvs[env];
    const envData = flag.environments?.find((e) => e.environment === env);
    return envData?.enabled ?? false;
  };

  const hasActive = flag.environments?.some((e) => getEnvEnabled(e.environment));

  const handleToggle = async (e: React.MouseEvent, env: Environment) => {
    e.stopPropagation();
    if (flag.archived) return;

    const currentEnabled = getEnvEnabled(env);
    const nextEnabled = !currentEnabled;

    // 1. Immediately update UI state for buttery smooth animation
    setOptimisticEnvs((prev) => ({ ...prev, [env]: nextEnabled }));

    // 2. Perform API request in background
    try {
      await toggleEnv({ flagId: flag.id, env, enabled: nextEnabled }).unwrap();
      dispatch(addToast({
        type: 'success',
        message: `${flag.name} ${nextEnabled ? 'enabled' : 'disabled'} in ${env}`,
      }));
    } catch {
      // Revert optimistic update on failure
      setOptimisticEnvs((prev) => ({ ...prev, [env]: currentEnabled }));
      dispatch(addToast({ type: 'error', message: 'Failed to toggle flag' }));
    }
  };

  return (
    <article
      className={`group relative rounded-2xl border p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
        hasActive
          ? 'border-brand-500/40 bg-surface-card shadow-sm hover:shadow-md'
          : 'border-border-subtle bg-surface-card hover:border-brand-500/30 hover:shadow-md'
      }`}
      onClick={() => navigate(`/app/flags/${flag.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/flags/${flag.id}`)}
      aria-label={`Feature flag: ${flag.name}`}
    >
      {/* Name + archived badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{flag.name}</h3>
        {flag.archived && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
            Archived
          </span>
        )}
      </div>

      {/* Flag key */}
      <code className="text-xs font-mono text-brand-600 dark:text-brand-300 mb-2 block">{flag.key}</code>

      {/* Description */}
      {flag.description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">{flag.description}</p>
      )}

      {/* Environment toggles */}
      <div className="flex flex-wrap gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
        {ENV_CONFIG.map(({ env, label, enabled: enabledCls, disabled: disabledCls }) => {
          const isEnabled = getEnvEnabled(env);
          return (
            <div
              key={env}
              className="flex items-center gap-2 cursor-pointer select-none group/toggle"
              title={`${isEnabled ? 'Disable' : 'Enable'} in ${env}`}
              onClick={(e) => handleToggle(e, env)}
            >
              {/* Smooth Hardware-Accelerated Toggle Track */}
              <div
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-emerald-500 shadow-green' : 'bg-slate-300 dark:bg-slate-700'
                } ${flag.archived ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>

              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-all ${isEnabled ? enabledCls : disabledCls}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
        <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(flag.created_at).toLocaleDateString()}</span>
        <button
          id={`flag-detail-btn-${flag.id}`}
          onClick={(e) => { e.stopPropagation(); navigate(`/app/flags/${flag.id}`); }}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium transition-all"
        >
          Edit →
        </button>
      </div>
    </article>
  );
};

export default FlagCard;
