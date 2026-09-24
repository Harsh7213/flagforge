import React, { useState } from 'react';
import {
  useListProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useRotateApiKeyMutation,
  useRevokeApiKeyMutation,
} from '../store/api/projectsApi';
import { useAppDispatch, useAppSelector } from '../store';
import { setActiveProject, clearActiveProject, addToast } from '../store/slices/uiSlice';

const ProjectsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeProjectId = useAppSelector((s) => s.ui.activeProjectId);
  const { data, isLoading } = useListProjectsQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const [rotateApiKey, { isLoading: isRotatingKey }] = useRotateApiKeyMutation();
  const [revokeApiKey, { isLoading: isRevokingKey }] = useRevokeApiKeyMutation();
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const result = await createProject({ name: newName.trim() }).unwrap();
      dispatch(addToast({ type: 'success', message: `Project "${newName}" created!` }));
      dispatch(setActiveProject(result.data.id));
      if (result.data.api_key) {
        setRevealedKeys((keys) => ({ ...keys, [result.data.id]: result.data.api_key! }));
      }
      setNewName('');
      setShowCreate(false);
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to create project' }));
    }
  };

  const handleRotateKey = async (id: string, name: string) => {
    if (!window.confirm(`Rotate the API key for "${name}"? The current key will stop working.`)) return;
    try {
      const result = await rotateApiKey(id).unwrap();
      if (result.data.api_key) {
        setRevealedKeys((keys) => ({ ...keys, [id]: result.data.api_key! }));
      }
      dispatch(addToast({ type: 'success', message: 'New API key generated. Copy it now; it will not be shown again.' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to rotate API key' }));
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!window.confirm(`Revoke the API key for "${name}"? SDK requests will stop working.`)) return;
    try {
      await revokeApiKey(id).unwrap();
      setRevealedKeys(({ [id]: _removed, ...keys }) => keys);
      dispatch(addToast({ type: 'success', message: 'API key revoked' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to revoke API key' }));
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const startEditing = (id: string, name: string) => {
    setEditingProjectId(id);
    setEditingName(name);
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
    setEditingName('');
  };

  const handleRename = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const name = editingName.trim();
    if (!name) return;
    try {
      await updateProject({ id, name }).unwrap();
      dispatch(addToast({ type: 'success', message: 'Project renamed successfully' }));
      cancelEditing();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to rename project' }));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete project "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteProject(id).unwrap();
      dispatch(addToast({ type: 'success', message: `Project "${name}" deleted` }));
      if (activeProjectId === id) {
        dispatch(clearActiveProject());
      }
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to delete project' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your flag projects and API keys</p>
        </div>
        <button
          id="create-project-btn"
          onClick={() => setShowCreate(!showCreate)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-semibold text-sm shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
        >
          + New Project
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Create New Project</h3>
          <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">
            <input
              id="new-project-name"
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              className="flex-1 min-w-48 px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
            />
            <button
              type="submit"
              id="submit-project-btn"
              disabled={isCreating}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 shadow-sm"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              id="cancel-project-btn"
              onClick={() => setShowCreate(false)}
              className="px-5 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-card border border-border-subtle text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all duration-200"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Projects list */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-500 dark:text-slate-400">
          <span className="spinner" /> Loading projects...
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-16 text-center shadow-sm">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-2">No projects yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Create a project to start managing feature flags.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((project) => (
            <div
              key={project.id}
              className={`rounded-2xl border p-6 transition-all duration-200 ${
                project.id === activeProjectId
                  ? 'border-brand-500/40 bg-brand-500/10 shadow-sm'
                  : 'border-border-subtle bg-surface-card hover:border-brand-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  {editingProjectId === project.id ? (
                    <form onSubmit={(e) => handleRename(e, project.id)} className="flex items-center gap-2 flex-wrap">
                      <input
                        id={`edit-project-name-${project.id}`}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        maxLength={255}
                        autoFocus
                        aria-label="Project name"
                        className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-brand-500/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                      />
                      <button
                        type="submit"
                        disabled={isUpdating || !editingName.trim()}
                        className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs font-semibold disabled:opacity-60"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-3 py-1.5 rounded-lg border border-border-subtle text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-surface-elevated"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{project.name}</h3>
                      {project.id === activeProjectId && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                          Active
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400">API Key:</span>
                    {revealedKeys[project.id] ? <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border-subtle">
                      <code className="text-xs font-mono text-slate-800 dark:text-slate-300 truncate max-w-xs">{revealedKeys[project.id]}</code>
                      <button
                        id={`copy-api-key-${project.id}`}
                        onClick={() => handleCopyKey(revealedKeys[project.id])}
                        title="Copy API key"
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-xs"
                      >
                        {copiedKey === revealedKeys[project.id] ? '✓' : '📋'}
                      </button>
                    </div> : <span className="text-xs text-slate-500 dark:text-slate-400">Hidden. Rotate to generate a new key.</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Created {new Date(project.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {editingProjectId !== project.id && (
                    <button
                      id={`edit-project-${project.id}`}
                      onClick={() => startEditing(project.id, project.name)}
                      className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-brand-500/20 border border-border-subtle hover:border-brand-500/30 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 text-sm font-medium transition-all duration-200"
                    >
                      Rename
                    </button>
                  )}
                  {project.id !== activeProjectId && (
                    <button
                      id={`select-project-${project.id}`}
                      onClick={() => {
                        dispatch(setActiveProject(project.id));
                        dispatch(addToast({ type: 'info', message: `Switched to "${project.name}"` }));
                      }}
                      className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-brand-500/20 border border-border-subtle hover:border-brand-500/30 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 text-sm font-medium transition-all duration-200"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    id={`rotate-api-key-${project.id}`}
                    disabled={isRotatingKey}
                    onClick={() => handleRotateKey(project.id, project.name)}
                    className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-amber-500/20 border border-border-subtle hover:border-amber-500/30 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 text-sm font-medium transition-all duration-200 disabled:opacity-60"
                  >
                    {isRotatingKey ? 'Rotating...' : 'Rotate key'}
                  </button>
                  <button
                    id={`revoke-api-key-${project.id}`}
                    disabled={isRevokingKey}
                    onClick={() => handleRevokeKey(project.id, project.name)}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-300 text-sm font-medium transition-all duration-200 disabled:opacity-60"
                  >
                    {isRevokingKey ? 'Revoking...' : 'Revoke key'}
                  </button>
                  <button
                    id={`delete-project-${project.id}`}
                    disabled={isDeleting}
                    onClick={() => handleDelete(project.id, project.name)}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-300 text-sm font-medium transition-all duration-200 disabled:opacity-60"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
