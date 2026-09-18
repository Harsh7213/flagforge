import React from 'react';
import { useAppSelector } from '../store';
import { useGetAuditLogsQuery } from '../store/api/flagsApi';
import { skipToken } from '@reduxjs/toolkit/query';
import AuditTimeline from '../components/AuditTimeline';

const AuditPage: React.FC = () => {
  const activeProjectId = useAppSelector((s) => s.ui.activeProjectId);
  const { data, isLoading } = useGetAuditLogsQuery(activeProjectId ? {
    projectId: activeProjectId,
    limit: 200,
  } : skipToken);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Complete history of all flag changes in this project</p>
        </div>
        <span className="self-start sm:self-center inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brand-300">
          {data?.total ?? 0} total events
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500 dark:text-slate-400">
          <span className="spinner" /> Loading audit log...
        </div>
      ) : (
        <AuditTimeline logs={data?.data ?? []} />
      )}
    </div>
  );
};

export default AuditPage;
