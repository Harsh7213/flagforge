import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';
import { setCredentials } from '../store/slices/authSlice';
import { useMeQuery } from '../store/api/authApi';

const AuthGuard: React.FC = () => {
  const { user, sessionExpiresAt } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { data, isLoading, isError } = useMeQuery(undefined);
  const expiresAt = sessionExpiresAt ?? data?.data?.expiresAt ?? 0;

  useEffect(() => {
    if (data?.data) {
      dispatch(setCredentials(data.data));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (!expiresAt) return;

    const remainingTime = expiresAt - Date.now();
    if (remainingTime <= 0) {
      dispatch(logout());
      return;
    }

    const timeoutId = window.setTimeout(() => dispatch(logout()), remainingTime);
    return () => window.clearTimeout(timeoutId);
  }, [dispatch, expiresAt]);

  if (isLoading) {
    return <div className="min-h-screen bg-surface-base" />;
  }

  if (isError || !user || expiresAt <= Date.now()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

export default AuthGuard;
