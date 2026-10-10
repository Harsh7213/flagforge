import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { setCredentials } from '../store/slices/authSlice';
import { useLogoutMutation, useMeQuery } from '../store/api/authApi';

const AuthGuard: React.FC = () => {
  const { user, sessionExpiresAt } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [logoutSession] = useLogoutMutation();
  const { data, isLoading, isError } = useMeQuery(undefined);
  const expiresAt = sessionExpiresAt ?? data?.data?.expiresAt ?? 0;

  // Keep the Redux auth state in sync with the server's current session.
  useEffect(() => {
    if (data?.data) {
      dispatch(setCredentials(data.data));
    }
  }, [data, dispatch]);

  // End the session at its expiry time, and replace the timer if the expiry changes.
  useEffect(() => {
    if (!expiresAt) return;

    const remainingTime = expiresAt - Date.now();
    if (remainingTime <= 0) {
      void logoutSession(undefined)
        .unwrap()
        .catch(() => undefined);
      dispatch(logout());
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void logoutSession(undefined)
        .unwrap()
        .catch(() => undefined);
      dispatch(logout());
    }, remainingTime);
    return () => window.clearTimeout(timeoutId);
  }, [dispatch, expiresAt, logoutSession]);

  if (isLoading) {
    return <div className="min-h-screen bg-surface-base" />;
  }

  if (isError || !user || !expiresAt) {
    // Preserve the requested route so login can return the user to it.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export default AuthGuard;
