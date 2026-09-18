import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToastContainer from './components/ToastContainer';
import AuthGuard from './components/AuthGuard';
import { useAppSelector } from './store';

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected app routes under /app */}
          <Route element={<AuthGuard />}>
            <Route element={<DashboardLayout />}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/app/flags" element={<FlagsPage />} />
              <Route path="/app/flags/:id" element={<FlagDetail />} />
              <Route path="/app/audit" element={<AuditPage />} />
              <Route path="/app/projects" element={<ProjectsPage />} />
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
