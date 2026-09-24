import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { clearActiveProject } from '../store/slices/uiSlice';
import { flagsApi } from '../store/api/flagsApi';
import { projectsApi } from '../store/api/projectsApi';
import { authApi, useLogoutMutation } from '../store/api/authApi';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: '⬡', exact: true },
  { to: '/app/flags', label: 'Feature Flags', icon: '⚑' },
  { to: '/app/audit', label: 'Audit Log', icon: '📋' },
  { to: '/app/projects', label: 'Projects', icon: '📁' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  const user = useAppSelector((s) => s.auth.user);
  const [requestLogout] = useLogoutMutation();
  const initials = user?.name?.trim().slice(0, 1).toUpperCase() || 'U';

  const handleLogout = () => {
    void requestLogout(undefined);
    dispatch(logout());
    dispatch(clearActiveProject());
    dispatch(flagsApi.util.resetApiState());
    dispatch(projectsApi.util.resetApiState());
    dispatch(authApi.util.resetApiState());
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-16'}
        bg-surface-elevated border-r border-border-subtle`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-border-subtle ${!sidebarOpen && 'justify-center'}`}>
        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-base shadow-brand">
          🚩
        </div>
        {sidebarOpen && (
          <span className="font-bold text-lg bg-gradient-to-r from-brand-600 to-cyan-500 dark:from-brand-300 dark:to-cyan-300 bg-clip-text text-transparent whitespace-nowrap">
            FlagForge
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {sidebarOpen && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-3 mb-3 block">
            Navigation
          </span>
        )}
        {navItems.map((item) => {
          const isActive = item.to === '/app'
            ? location.pathname === '/app'
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5'
                }
                ${!sidebarOpen && 'justify-center'}`}
            >
              <span className={`text-base flex-shrink-0 ${isActive ? 'text-brand-500 dark:text-brand-400' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 dark:bg-brand-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`p-3 border-t border-border-subtle ${!sidebarOpen && 'flex justify-center'}`}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white shadow-brand">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.organizationName || 'Organization'}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-500/10 flex-shrink-0"
            >
              ⏻
            </button>
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white shadow-brand cursor-pointer"
            title={user?.name || 'User'}
          >
            {initials}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
