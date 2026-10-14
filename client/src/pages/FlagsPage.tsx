import React, { useState } from 'react';
import { useAppSelector } from '../store/store';
import { useListFlagsQuery } from '../store/api/flagsApi';
import { skipToken } from '@reduxjs/toolkit/query';
import FlagCard from '../components/FlagCard';
import CreateFlagModal from '../components/CreateFlagModal';
import { useDebounce } from '../hooks/useDebounce';
import { useSearchParams } from 'react-router-dom';

type FilterTab = 'active' | 'archived' | 'all';

type EmptyStateProps = {
  search: string;
  filterTab: FilterTab;
  onCreate: () => void;
};

const LoadingSkeleton = () => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-surface-card border border-border-subtle space-y-3 animate-pulse"
        >
          <div className="h-5 bg-surface-elevated rounded w-1/3" />
          <div className="h-4 bg-surface-elevated rounded w-2/3" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 bg-surface-elevated rounded w-20" />
            <div className="h-6 bg-surface-elevated rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ search, filterTab, onCreate }: EmptyStateProps) => {
  const hasSearch = search.trim().length > 0;
  return (
    <div className="text-center py-16 px-4 rounded-2xl bg-surface-card border border-border-subtle shadow-sm">
      <img src="/flag-icon.svg" alt="" aria-hidden="true" className="w-8 h-8 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-1">
        {hasSearch ? 'No flags match your search' : 'No flags here'}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
        {search
          ? 'Try a different keyword or clear the search input.'
          : `${filterTab.charAt(0).toUpperCase() + filterTab.slice(1)} flags will appear here`}
      </p>
      {!hasSearch && filterTab === 'active' && (
        <button
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-medium text-sm shadow-brand transition-all"
          onClick={onCreate}
          id="empty-create-flag-btn"
        >
          + Create Flag
        </button>
      )}
    </div>
  );
};

const FlagsPage: React.FC = () => {
  const activeProjectId = useAppSelector(s => s.ui.activeProjectId);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const getTabFromParams = (): FilterTab => {
    const status = searchParams.get('status');
    return status === 'archived' || status === 'all' ? status : 'active';
  };
  const [filterTab, setFilterTab] = useState<FilterTab>(getTabFromParams);
  const handleFilterTabChange = (tab: FilterTab) => {
    setFilterTab(tab);
    setSearchParams({ status: tab });
  };
  const debouncedSearch = useDebounce(search, 300);
  const archived = filterTab === 'archived' ? true : filterTab === 'all' ? undefined : false;
  const isDebouncingSearch = search !== debouncedSearch;
  const { data, isLoading, isFetching } = useListFlagsQuery(
    activeProjectId
      ? {
          projectId: activeProjectId,
          search: debouncedSearch || undefined,
          archived
        }
      : skipToken
  );
  const isSearchPending = search !== debouncedSearch;
  const flags = data?.data ?? [];
  const showEmptyState = !isLoading && !isFetching && !isSearchPending && flags.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feature Flags</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and control your feature releases across environments
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-medium text-sm shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
          onClick={() => setShowCreate(true)}
          id="create-flag-btn"
        >
          <span>+</span> New Flag
        </button>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-surface-card border border-border-subtle shadow-sm">
          {(['active', 'archived', 'all'] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => handleFilterTabChange(tab)}
              id={`flags-tab-${tab}`}
              className={`m-0.5 rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                filterTab === tab
                  ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border-brand-500/30'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/10 dark:hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-65">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm flex items-center justify-center w-4 h-4">
            {isDebouncingSearch ? <span className="spinner w-3.5 h-3.5 border-brand-500" /> : '🔍'}
          </span>
          <input
            type="search"
            placeholder="Search flags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="flags-search-input"
            aria-label="Search feature flags"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-card border border-border-subtle text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Flags List */}
      {isLoading && !data ? (
        <LoadingSkeleton />
      ) : showEmptyState ? (
        <EmptyState
          search={debouncedSearch}
          filterTab={filterTab}
          onCreate={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {flags.map(flag => (
            <FlagCard key={flag.id} flag={flag} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && activeProjectId && (
        <CreateFlagModal projectId={activeProjectId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
};

export default FlagsPage;
