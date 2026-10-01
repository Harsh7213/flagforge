import type { FeatureFlag, AuditLog, Project } from '../../types';
import type { User } from '../../store/slices/authSlice';

// ─── Users ────────────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: 'user-1',
  name: 'Alice Smith',
  email: 'alice@example.com',
  organizationId: 'org-1',
  organizationName: 'Acme Corp',
  role: 'owner'
};

export const mockMemberUser: User = {
  ...mockUser,
  id: 'user-2',
  name: 'Bob Jones',
  email: 'bob@example.com',
  role: 'member'
};

export const mockAdminUser: User = {
  ...mockUser,
  id: 'user-3',
  name: 'Carol White',
  email: 'carol@example.com',
  role: 'admin'
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const mockProject: Project = {
  id: 'proj-1',
  name: 'My App',
  api_key: 'key-abc-123',
  created_at: '2024-01-01T00:00:00.000Z'
};

export const mockProjects: Project[] = [
  mockProject,
  { id: 'proj-2', name: 'Mobile App', created_at: '2024-02-01T00:00:00.000Z' }
];

// ─── Feature Flags ────────────────────────────────────────────────────────────

export const mockFlag: FeatureFlag = {
  id: 'flag-1',
  project_id: 'proj-1',
  key: 'dark_mode',
  name: 'Dark Mode',
  description: 'Enable dark mode for users',
  archived: false,
  created_at: '2024-03-15T10:00:00.000Z',
  updated_at: '2024-03-15T10:00:00.000Z',
  environments: [
    {
      id: 'env-1',
      flag_id: 'flag-1',
      environment: 'development',
      enabled: true,
      updated_at: '2024-03-15T10:00:00.000Z',
      rules: []
    },
    {
      id: 'env-2',
      flag_id: 'flag-1',
      environment: 'staging',
      enabled: false,
      updated_at: '2024-03-15T10:00:00.000Z',
      rules: []
    },
    {
      id: 'env-3',
      flag_id: 'flag-1',
      environment: 'production',
      enabled: false,
      updated_at: '2024-03-15T10:00:00.000Z',
      rules: []
    }
  ]
};

export const mockArchivedFlag: FeatureFlag = {
  ...mockFlag,
  id: 'flag-2',
  key: 'old_feature',
  name: 'Old Feature',
  description: null,
  archived: true,
  environments: [
    { ...mockFlag.environments[0], id: 'env-4', flag_id: 'flag-2', enabled: false },
    { ...mockFlag.environments[1], id: 'env-5', flag_id: 'flag-2', enabled: false },
    { ...mockFlag.environments[2], id: 'env-6', flag_id: 'flag-2', enabled: false }
  ]
};

export const mockFlags: FeatureFlag[] = [mockFlag, mockArchivedFlag];

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const mockAuditLog: AuditLog = {
  id: 'audit-1',
  flag_id: 'flag-1',
  flag_key: 'dark_mode',
  flag_name: 'Dark Mode',
  actor: 'alice@example.com',
  actor_role: 'owner',
  action: 'toggled',
  payload: { environment: 'development', enabled: true },
  created_at: '2024-03-15T10:05:00.000Z'
};
