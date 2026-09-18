import pool from './pool';

const SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  api_key         UUID NOT NULL DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key         VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  archived    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, key)
);

-- Flag environments (development / staging / production)
CREATE TABLE IF NOT EXISTS flag_environments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id      UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  environment  VARCHAR(50) NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flag_id, environment)
);

-- Targeting rules
CREATE TABLE IF NOT EXISTS targeting_rules (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_environment_id  UUID NOT NULL REFERENCES flag_environments(id) ON DELETE CASCADE,
  type                 VARCHAR(50) NOT NULL CHECK (type IN ('user_ids', 'groups', 'percentage')),
  value                TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_id     UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  actor       VARCHAR(255) NOT NULL DEFAULT 'system',
  action      VARCHAR(50) NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_name_lower ON organizations(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
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
