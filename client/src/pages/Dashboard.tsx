import React from 'react';
import { useAppSelector } from '../store';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetStatsQuery, useGetAuditLogsQuery, useListFlagsQuery } from '../store/api/flagsApi';
import AuditTimeline from '../components/AuditTimeline';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  gradient: string;
  glow: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, gradient, glow, delay = 0 }) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-6 border border-border-subtle hover:-translate-y-1 transition-all duration-300 shadow-sm ${glow}`}
    style={{ background: gradient, animationDelay: `${delay}s` }}
  >
    <div className="text-2xl mb-3">{icon}</div>
    <div className="text-4xl font-extrabold text-white mb-1">{value}</div>
    <div className="text-sm text-slate-200 font-medium">{label}</div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{ background: gradient }} />
  </div>
);

const ENV_CONFIG = [
  { env: 'development', label: 'Development', barColor: 'bg-cyan-500', shadow: 'shadow-[0_0_8px_hsl(187,92%,58%,0.5)]' },
  { env: 'staging',     label: 'Staging',     barColor: 'bg-amber-500', shadow: 'shadow-[0_0_8px_hsl(38,96%,60%,0.5)]' },
  { env: 'production',  label: 'Production',  barColor: 'bg-red-500',   shadow: 'shadow-[0_0_8px_hsl(4,85%,62%,0.5)]' },
] as const;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const activeProjectId = useAppSelector((s) => s.ui.activeProjectId);

  const { data: statsData, isLoading: statsLoading } = useGetStatsQuery(activeProjectId ?? skipToken);
  const { data: auditData, isLoading: auditLoading } = useGetAuditLogsQuery(
    activeProjectId ? { projectId: activeProjectId, limit: 10 } : skipToken
  );
  const { data: flagsData } = useListFlagsQuery(
    activeProjectId ? { projectId: activeProjectId } : skipToken
  );

  const stats = statsData?.data;
  const recentFlags = flagsData?.data?.slice(0, 5) ?? [];

  const statCards: StatCardProps[] = [
    { label: 'Total Flags',   value: stats?.total ?? 0,                       icon: '🚩', gradient: 'linear-gradient(135deg,hsl(258,78%,52%),hsl(258,78%,35%))', glow: 'hover:shadow-brand', delay: 0 },
    { label: 'Active Flags',  value: stats?.active ?? 0,                      icon: '✅', gradient: 'linear-gradient(135deg,hsl(143,65%,42%),hsl(143,65%,28%))', glow: 'hover:shadow-green', delay: 0.05 },
    { label: 'Archived',      value: stats?.archived ?? 0,                    icon: '📦', gradient: 'linear-gradient(135deg,hsl(38,80%,45%),hsl(38,80%,30%))',  glow: '',                 delay: 0.1 },
    { label: 'Prod Enabled',  value: stats?.byEnvironment?.production ?? 0,   icon: '🚀', gradient: 'linear-gradient(135deg,hsl(187,75%,42%),hsl(187,75%,28%))',glow: '',                 delay: 0.15 },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overview of your feature flag system</p>
        </div>
        <button
          id="dashboard-manage-flags-btn"
          onClick={() => navigate('/app/flags')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-semibold text-sm shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
        >
          Manage Flags →
        </button>
      </div>

      {/* Stats grid */}
      {!activeProjectId ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-2">No project selected</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Select or create a project to view your dashboard.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border-subtle p-6 space-y-3 bg-surface-card shadow-sm">
                    <div className="skeleton h-7 w-10" />
                    <div className="skeleton h-10 w-16" />
                    <div className="skeleton h-4 w-24" />
                  </div>
                ))
              : statCards.map((card) => <StatCard key={card.label} {...card} />)
            }
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Flags */}
            <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Flags</h3>
                <button
                  id="view-all-flags-btn"
                  onClick={() => navigate('/app/flags')}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline transition-colors font-medium"
                >
                  View all →
                </button>
              </div>
              {recentFlags.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-3xl mb-3">🚩</div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No flags yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentFlags.map((flag) => {
                    const activeEnvs = flag.environments?.filter((e) => e.enabled) ?? [];
                    return (
                      <div
                        key={flag.id}
                        onClick={() => navigate(`/app/flags/${flag.id}`)}
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated hover:border-brand-500/30 border border-transparent cursor-pointer transition-all duration-200"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{flag.name}</div>
                          <code className="text-xs text-brand-600 dark:text-brand-300 font-mono">{flag.key}</code>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {activeEnvs.length === 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-mono">OFF</span>
                          ) : activeEnvs.map((e) => (
                            <span key={e.environment} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                              {e.environment.slice(0, 3).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Environment Breakdown */}
            <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">Environment Breakdown</h3>
              {!stats ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="skeleton h-4 w-28" />
                      <div className="skeleton h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  {ENV_CONFIG.map(({ env, label, barColor, shadow }) => {
                    const count = stats.byEnvironment?.[env] ?? 0;
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={env}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                          <span className="text-slate-500 dark:text-slate-400">{count} / {stats.total}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-surface-elevated overflow-hidden border border-border-subtle">
                          <div
                            className={`h-full rounded-full ${barColor} ${shadow} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
              <button
                id="view-audit-log-btn"
                onClick={() => navigate('/app/audit')}
                className="text-sm text-brand-600 dark:text-brand-400 hover:underline transition-colors font-medium"
              >
                Full log →
              </button>
            </div>
            {auditLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center text-slate-500 dark:text-slate-400">
                <span className="spinner" /> Loading activity...
              </div>
            ) : (
              <AuditTimeline logs={auditData?.data ?? []} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
