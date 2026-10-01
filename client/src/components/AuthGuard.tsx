import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
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
  const hasValidServerSession = Boolean(data?.data && data.data.expiresAt > Date.now());

  useEffect(() => {
    if (hasValidServerSession) {
      dispatch(setCredentials(data.data));
    }
  }, [data, dispatch, hasValidServerSession]);

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

  if (isError || !user || expiresAt <= Date.now()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export default AuthGuard;
