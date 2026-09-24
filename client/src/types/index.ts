export type Environment = 'development' | 'staging' | 'production';
export type RuleType = 'user_ids' | 'groups' | 'percentage';
export type AuditAction = 'created' | 'updated' | 'deleted' | 'toggled' | 'rule_added' | 'rule_deleted';

export interface Project {
  id: string;
  name: string;
  api_key?: string;
  created_at: string;
}

export interface TargetingRule {
  id: string;
  flag_environment_id: string;
  type: RuleType;
  value: string;
  created_at: string;
}

export interface FlagEnvironment {
  id: string;
  flag_id: string;
  environment: Environment;
  enabled: boolean;
  updated_at: string;
  rules: TargetingRule[];
}

export interface FeatureFlag {
  id: string;
  project_id: string;
  key: string;
  name: string;
  description: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  environments: FlagEnvironment[];
}

export interface AuditLog {
  id: string;
  flag_id: string;
  flag_key: string;
  flag_name: string;
  actor: string;
  action: AuditAction;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface FlagStats {
  total: number;
  active: number;
  archived: number;
  byEnvironment: Record<Environment, number>;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
