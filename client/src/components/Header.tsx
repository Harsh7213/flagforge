import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearActiveProject, setActiveProject, toggleSidebar, toggleTheme } from '../store/slices/uiSlice';
import { useListProjectsQuery } from '../store/api/projectsApi';

const pageTitles: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/flags': 'Feature Flags',
  '/app/audit': 'Audit Log',
  '/app/projects': 'Projects',
  '/app/team': 'Team',
};

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const theme = useAppSelector((s) => s.ui.theme);
  const activeProjectId = useAppSelector((s) => s.ui.activeProjectId);
  const { data: projectsData } = useListProjectsQuery();

  useEffect(() => {
    const projects = projectsData?.data;
    if (projects && activeProjectId && !projects.some((p) => p.id === activeProjectId)) {
      dispatch(clearActiveProject());
    }
  }, [activeProjectId, dispatch, projectsData]);

  const title = Object.entries(pageTitles).find(([path]) =>
    path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(path)
  )?.[1] ?? 'FlagForge';

  return (
    <header className="fixed top-0 right-0 left-0 h-16 z-30 flex items-center justify-between px-6 bg-surface-elevated border-b border-border-subtle shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button
          id="sidebar-toggle"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Toggle sidebar"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200"
        >
          ☰
        </button>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Project selector */}
        {projectsData && projectsData.data.length > 0 && (
          <select
            id="project-selector"
            aria-label="Select active project"
            value={activeProjectId ?? ''}
            onChange={(e) => dispatch(setActiveProject(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 hover:border-brand-500/40 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <option value="" disabled>Select a project</option>
            {projectsData.data.map((p) => (
              <option key={p.id} value={p.id} className="bg-surface-card text-slate-900 dark:text-slate-100">
                📁 {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={() => dispatch(toggleTheme())}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle color theme"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 text-lg border border-border-subtle bg-surface-card shadow-sm"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};

export default Header;
