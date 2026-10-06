# FlagForge - Feature Flag Management System

FlagForge is a multi-tenant feature flag management system for creating, targeting, evaluating, and auditing feature releases across development, staging, and production environments. It includes a React dashboard, an Express API, PostgreSQL persistence, Redis-backed distributed rate limiting, and an API-key-protected evaluation endpoint for application integrations.

## Features

- **Multi-Environment Support**: Manage flags across Development, Staging, and Production environments independently.
- **Targeting Rules**: Roll out features based on user IDs, user groups, or percentage-based rollouts.
- **Evaluation API**: Evaluate individual flags or batches of flags with a project API key, user ID, and optional groups.
- **Evaluation Limits**: Apply per-project request limits and monthly usage quotas across projects in each organization.
- **Projects and API Keys**: Organize flags by project; rotate or revoke project keys. Keys are bcrypt-hashed at rest and shown only once when created or rotated.
- **Organizations and Roles**: Workspaces support owner, admin, and member roles. Owners and admins can invite teammates with a single-use, 24-hour invitation link and manage eligible members.
- **Authentication and Security**: Use HTTP-only cookie sessions, session expiry, CSRF protection for state-changing dashboard requests, role-based access control, Helmet, and validated environment configuration.
- **Audit Logging**: Track flag and targeting-rule changes, including the acting user and role.
- **Modern UI**: Responsive React dashboard with system theme detection and saved light/dark mode preference.

## Architecture

- **Frontend**: React 18, TypeScript, Vite, Redux Toolkit, RTK Query, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Zod for validation, bcryptjs, cookie-parser, and Redis.
- **Data Stores**: PostgreSQL with `pg` (node-postgres), plus Redis for shared rate-limit counters. PostgreSQL migrations run on server startup.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Local Development Setup

1. **Configure local environment variables**
   Copy the environment templates before starting the services:

   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

   Set `POSTGRES_PASSWORD` and `JWT_SECRET` in the root `.env` before starting the stack. Use a strong, unique JWT secret of at least 32 characters. The containerized setup reads these values from the root `.env`; `server/.env` is only needed when running the backend directly on your host.

2. **Start the full stack**

   ```bash
   docker compose up --build -d
   ```

   This starts four containers: PostgreSQL, Redis, the backend API, and the frontend dashboard. The API is available at `localhost:4000` and the dashboard at `localhost` (port 80). PostgreSQL and Redis data are persisted in Docker volumes; Redis uses AOF persistence. PostgreSQL and Redis are also available on host ports `5433` and `6379` for local development tools.

   If you want to run the app locally without containers for debugging, run `npm install` and `npm run dev` in the `server` and `client` directories, and configure the server to use the PostgreSQL and Redis services started by Compose. The containerized Compose setup is the default for the repository.

3.  **Access the Application**
    - Dashboard (Docker Compose): [http://localhost](http://localhost)
    - Dashboard (Vite development server): [http://localhost:5173](http://localhost:5173)
    - API: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

_Note: The backend container automatically runs database migrations before starting the API._

The server uses a shared Redis instance to enforce per-project request limits and monthly evaluation quotas at both project and organization levels. Individual and batch evaluations have separate limits, and each flag in a batch counts toward usage. Requests exceeding a limit receive HTTP `429`.

### Dashboard workflow

1. Register the first user to create an organization. The first user becomes the organization owner.
2. Create projects and flags from the dashboard. Owners and admins can make changes; members have read access to the dashboard data.
3. From **Team**, owners and admins can invite members or admins with a single-use link that expires after 24 hours.
4. From **Projects**, create, rotate, or revoke an API key. A new key is returned only at creation or rotation time, so store it securely.

The dashboard API uses an HTTP-only session cookie. The API also exposes `/api/v1/auth/me` for session discovery and `/api/v1/auth/logout` for session termination.

### API overview

Dashboard routes are available under `/api/v1` and require an authenticated session. The main route groups are:

- `/auth`: registration, login, logout, current-session lookup, and invitation acceptance.
- `/organizations`: invitations and member management.
- `/projects`: project management and API-key rotation or revocation.
- `/flags`: flag, environment, targeting-rule, and flag-audit management.
- `/stats` and `/audit`: dashboard metrics and organization audit history.
- `/evaluate` and `/evaluate/batch`: SDK-style flag evaluation using `X-API-Key`.

## SDK Integration (Example)

To get an API key, open the **Projects** page in the dashboard and create or rotate a key. Copy it when it is displayed because it cannot be retrieved later. The API key identifies the project, so a `projectId` is not required. Then evaluate a feature flag from your client application with a `POST` request:

```javascript
const response = await fetch('http://localhost:4000/api/v1/evaluate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_PROJECT_API_KEY'
  },
  body: JSON.stringify({
    flagKey: 'new_checkout_flow',
    environment: 'development', // 'development', 'staging', or 'production'
    userId: 'user-123', // Optional: for user_ids or percentage targeting
    groups: ['beta-testers'] // Optional: for groups targeting
  })
});

const { data } = await response.json();

if (data.enabled) {
  // Show new feature
} else {
  // Show old feature
}
```
