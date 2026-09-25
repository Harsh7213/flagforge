import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import AuthGuard from './components/AuthGuard';
import { useAppDispatch, useAppSelector } from './store';
import { setSystemTheme } from './store/slices/uiSlice';
import { setCredentials } from './store/slices/authSlice';
import { useMeQuery } from './store/api/authApi';

// Lazy loading pages
const LandingPage  = lazy(() => import('./pages/LandingPage'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const FlagsPage    = lazy(() => import('./pages/FlagsPage'));
const FlagDetail   = lazy(() => import('./pages/FlagDetail'));
const AuditPage    = lazy(() => import('./pages/AuditPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const AboutPage    = lazy(() => import('./pages/AboutPage'));
const TeamPage     = lazy(() => import('./pages/TeamPage'));
const AcceptInvitationPage = lazy(() => import('./pages/AcceptInvitationPage'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-surface-base flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
    <span className="spinner" /> Loading...
  </div>
);

// App shell layout (Sidebar + Header + main content)
const DashboardLayout: React.FC = () => {
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);
  return (
    <div className="flex min-h-screen bg-surface-base text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header />
        <main className="flex-1 p-6 overflow-y-auto mt-16">
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

const PublicOnly: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useMeQuery(undefined);

  useEffect(() => {
    if (data?.data) {
      dispatch(setCredentials(data.data));
    }
  }, [data, dispatch]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (data?.data) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      dispatch(setSystemTheme(event.matches ? 'dark' : 'light'));
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/invite/:token" element={<AcceptInvitationPage />} />
          {/* Public routes */}
          <Route element={<PublicOnly />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected app routes under /app */}
          <Route element={<AuthGuard />}>
            <Route element={<DashboardLayout />}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/app/flags" element={<FlagsPage />} />
              <Route path="/app/flags/:id" element={<FlagDetail />} />
              <Route path="/app/audit" element={<AuditPage />} />
              <Route path="/app/projects" element={<ProjectsPage />} />
              <Route path="/app/team" element={<TeamPage />} />
              <Route path="/app/*" element={<Navigate to="/app" replace />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
