import React from 'react';
import type { AuditLog } from '../types';

interface Props {
  logs: AuditLog[];
}

const ACTION_ICONS: Record<string, string> = {
  created: '✨',
  updated: '✏️',
  deleted: '🗑',
  toggled: '🔀',
  rule_added: '➕',
  rule_deleted: '➖',
};

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-500/30',
  updated: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30',
  deleted: 'bg-red-500/15 text-red-800 dark:text-red-400 border-red-500/30',
  toggled: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-400 border-cyan-500/30',
  rule_added: 'bg-purple-500/15 text-purple-800 dark:text-purple-400 border-purple-500/30',
  rule_deleted: 'bg-rose-500/15 text-rose-800 dark:text-rose-400 border-rose-500/30',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const AuditTimeline: React.FC<Props> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl bg-surface-card border border-border-subtle shadow-sm">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-1">No audit events yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Changes to feature flags and targeting rules will appear here in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article
          key={log.id}
          className="p-4 rounded-xl bg-surface-card border border-border-subtle hover:border-brand-500/30 transition-all duration-200 space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{ACTION_ICONS[log.action] || '📌'}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide border ${
                  ACTION_COLORS[log.action] || 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30'
                }`}
              >
                {log.action}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono text-xs border border-brand-500/20">
                {log.flag_key}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap" title={new Date(log.created_at).toLocaleString()}>
              {timeAgo(log.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
            <span>by <strong className="text-slate-900 dark:text-slate-200">{log.actor}</strong></span>
            {log.payload && (
              <details className="text-right">
                <summary className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 select-none">
                  View payload
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-surface-elevated border border-border-subtle text-[11px] font-mono text-slate-800 dark:text-slate-300 text-left overflow-x-auto max-h-32">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default AuditTimeline;
