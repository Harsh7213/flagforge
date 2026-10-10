import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { clearActiveProject, setActiveProject, toggleTheme } from '../store/slices/uiSlice';
import { useListProjectsQuery } from '../store/api/projectsApi';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(s => s.ui.theme);
  const activeProjectId = useAppSelector(s => s.ui.activeProjectId);
  const { data: projectsData } = useListProjectsQuery();

  useEffect(() => {
    const projects = projectsData?.data;
    if (projects && activeProjectId && !projects.some(p => p.id === activeProjectId)) {
      dispatch(clearActiveProject());
    }
  }, [activeProjectId, dispatch, projectsData]);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-6 bg-surface-elevated shadow-sm transition-colors duration-200">
      <div className="ml-auto flex items-center gap-3">
        {/* Project selector */}
        {projectsData && projectsData.data.length > 0 && (
          <select
            id="project-selector"
            aria-label="Select active project"
            value={activeProjectId ?? ''}
            onChange={e => dispatch(setActiveProject(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 hover:border-brand-500/40 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <option value="" disabled>
              Select a project
            </option>
            {projectsData.data.map(p => (
              <option
                key={p.id}
                value={p.id}
                className="bg-surface-card text-slate-900 dark:text-slate-100"
              >
                📁 {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
          className="hover:border-amber-500 hover:shadow-amber w-9 h-9 rounded-xl flex items-center justify-center bg-surface-card border border-border-subtle transition-all"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};

export default Header;
