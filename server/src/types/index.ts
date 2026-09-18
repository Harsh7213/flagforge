export type Environment = 'development' | 'staging' | 'production';

export type RuleType = 'user_ids' | 'groups' | 'percentage';

export type AuditAction = 'created' | 'updated' | 'deleted' | 'toggled' | 'rule_added' | 'rule_deleted';

export interface Organization {
  id: string;
  name: string;
  created_at: Date;
}

export interface User {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface AuthUser {
  id: string;
  organizationId: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  api_key: string;
  created_at: Date;
}

export interface FeatureFlag {
  id: string;
  project_id: string;
  key: string;
  name: string;
  description: string | null;
  archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FlagEnvironment {
  id: string;
  flag_id: string;
  environment: Environment;
  enabled: boolean;
  updated_at: Date;
}

export interface TargetingRule {
  id: string;
  flag_environment_id: string;
  type: RuleType;
  value: string; // JSON string: string[] for user_ids/groups, number for percentage
  created_at: Date;
}

export interface AuditLog {
  id: string;
  flag_id: string;
  actor: string;
  action: AuditAction;
  payload: Record<string, unknown> | null;
  created_at: Date;
}

export interface FlagWithEnvironments extends FeatureFlag {
  environments: (FlagEnvironment & { rules: TargetingRule[] })[];
}

export interface EvaluationRequest {
  flagKey: string;
  userId?: string;
  groups?: string[];
  environment: Environment;
  projectId: string;
}

export interface EvaluationResult {
  flagKey: string;
  enabled: boolean;
  reason: string;
  environment: Environment;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
