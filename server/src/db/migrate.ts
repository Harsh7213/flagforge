import pool from './pool';
import { INPUT_LIMITS } from '../../../shared/inputLimits';

const SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(${INPUT_LIMITS.organizationName}) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(${INPUT_LIMITS.userName}) NOT NULL,
  email           VARCHAR(${INPUT_LIMITS.email}) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(8) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
  session_version INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization invitations
CREATE TABLE IF NOT EXISTS organization_invitations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           VARCHAR(${INPUT_LIMITS.email}) NOT NULL,
  role            VARCHAR(8) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token_hash      TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  invited_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(${INPUT_LIMITS.projectName}) NOT NULL,
  plan            VARCHAR(15) NOT NULL DEFAULT 'standard',
  api_key_id      TEXT UNIQUE,
  api_key_hash    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key         VARCHAR(${INPUT_LIMITS.flagKey}) NOT NULL,
  name        VARCHAR(${INPUT_LIMITS.flagName}) NOT NULL,
  description TEXT CHECK (LENGTH(description) <= ${INPUT_LIMITS.flagDescription}),
  archived    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, key)
);

-- Flag environments (development / staging / production)
CREATE TABLE IF NOT EXISTS flag_environments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id      UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  environment  VARCHAR(15) NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flag_id, environment)
);

-- Targeting rules
CREATE TABLE IF NOT EXISTS targeting_rules (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_environment_id  UUID NOT NULL REFERENCES flag_environments(id) ON DELETE CASCADE,
  type                 VARCHAR(20) NOT NULL CHECK (type IN ('user_ids', 'groups', 'percentage')),
  value                TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id     UUID,
  project_id  UUID NOT NULL,
  flag_key    VARCHAR(${INPUT_LIMITS.flagKey}) NOT NULL,
  flag_name   VARCHAR(${INPUT_LIMITS.flagName}) NOT NULL,
  actor       VARCHAR(${INPUT_LIMITS.userName}) NOT NULL DEFAULT 'system',
  actor_role  VARCHAR(8),
  action      VARCHAR(50) NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_logs_flag_id_fkey FOREIGN KEY (flag_id) REFERENCES feature_flags(id) ON DELETE SET NULL,
  CONSTRAINT audit_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name_lower ON organizations(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_project_id ON feature_flags(project_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_flag_environments_flag_id ON flag_environments(flag_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_env_id ON targeting_rules(flag_environment_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_flag_id ON audit_logs(flag_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    await client.query(SQL);
    console.log('✅ Database migrations completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default migrate;

// Allow running directly: ts-node src/db/migrate.ts
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
