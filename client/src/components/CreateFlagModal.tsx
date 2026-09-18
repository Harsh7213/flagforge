import React, { useState } from 'react';
import { useCreateFlagMutation } from '../store/api/flagsApi';
import { useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';

interface Props {
  projectId: string;
  onClose: () => void;
}

const CreateFlagModal: React.FC<Props> = ({ projectId, onClose }) => {
  const dispatch = useAppDispatch();
  const [createFlag, { isLoading }] = useCreateFlagMutation();

  const [form, setForm] = useState({ key: '', name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.key.trim()) errs.key = 'Flag key is required';
    else if (!/^[a-z0-9_-]+$/.test(form.key))
      errs.key = 'Only lowercase letters, numbers, underscores, hyphens';
    if (!form.name.trim()) errs.name = 'Flag name is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      await createFlag({
        key: form.key,
        name: form.name,
        description: form.description || undefined,
        projectId,
      }).unwrap();
      dispatch(addToast({ type: 'success', message: `Flag "${form.name}" created!` }));
      onClose();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to create flag' }));
    }
  };

  const handleKeyChange = (value: string) => {
    const slug = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
    setForm((prev) => ({ ...prev, key: slug }));
    if (errors.key) setErrors((prev) => ({ ...prev, key: '' }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-flag-title"
    >
      <div
        className="w-full max-w-lg p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2" id="create-flag-title">
            <span>🚩</span> Create Feature Flag
          </h2>
          <button
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-lg p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            onClick={onClose}
            aria-label="Close dialog"
            id="close-create-flag-modal"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="flag-name">
              Flag Name *
            </label>
            <input
              id="flag-name"
              type="text"
              placeholder="e.g. New Checkout Flow"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                if (!form.key) {
                  handleKeyChange(e.target.value);
                }
              }}
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl bg-surface-elevated border text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all ${
                errors.name ? 'border-red-500/50' : 'border-border-subtle'
              }`}
            />
            {errors.name && <span className="text-xs text-red-500 dark:text-red-400 mt-1 block">{errors.name}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="flag-key">
              Flag Key *
            </label>
            <input
              id="flag-key"
              type="text"
              placeholder="e.g. new_checkout_flow"
              value={form.key}
              onChange={(e) => handleKeyChange(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl bg-surface-elevated border text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all ${
                errors.key ? 'border-red-500/50' : 'border-border-subtle'
              }`}
            />
            {errors.key ? (
              <span className="text-xs text-red-500 dark:text-red-400 mt-1 block">{errors.key}</span>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                Unique identifier used in code. Only lowercase, numbers, underscores, hyphens.
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="flag-description">
              Description
            </label>
            <textarea
              id="flag-description"
              placeholder="What does this flag control?"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all resize-y"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            💡 The flag will be created in all 3 environments (development, staging, production) with <strong className="text-brand-600 dark:text-brand-300 font-semibold">disabled</strong> state by default.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-card border border-border-subtle text-slate-700 dark:text-slate-300 text-sm font-medium transition-all"
              onClick={onClose}
              id="cancel-create-flag"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-medium text-sm shadow-brand transition-all disabled:opacity-60"
              id="submit-create-flag"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-3.5 h-3.5" /> Creating...
                </span>
              ) : (
                'Create Flag'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFlagModal;
