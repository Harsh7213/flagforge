import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { removeToast, Toast } from '../store/slices/uiSlice';

const iconMap: Record<string, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const colorMap: Record<string, string> = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-300',
  error:   'bg-red-500/15 border-red-500/30 text-red-900 dark:text-red-300',
  info:    'bg-brand-500/15 border-brand-500/30 text-brand-900 dark:text-brand-300',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-300',
};

const iconColorMap: Record<string, string> = {
  success: 'bg-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  error:   'bg-red-500/30 text-red-600 dark:text-red-400',
  info:    'bg-brand-500/30 text-brand-600 dark:text-brand-400',
  warning: 'bg-amber-500/30 text-amber-600 dark:text-amber-400',
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Auto-dismiss toast after 3 seconds (3000 ms)
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-glass animate-slide-up ${
        colorMap[toast.type] || colorMap.info
      }`}
    >
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
          iconColorMap[toast.type] || iconColorMap.info
        }`}
      >
        {iconMap[toast.type] || iconMap.info}
      </div>
      <p className="flex-1 text-sm font-medium leading-relaxed pt-0.5">{toast.message}</p>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="text-current opacity-50 hover:opacity-100 transition-opacity flex-shrink-0 text-lg leading-none p-0.5"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((s) => s.ui.toasts);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
