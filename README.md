# FlagForge - Feature Flag Management System

FlagForge is a multi-tenant feature flag management system for creating, targeting, evaluating, and auditing feature releases across development, staging, and production environments. It includes a React dashboard, an Express API, PostgreSQL persistence, and an API-key-protected evaluation endpoint for application integrations.

## Features

*   **Multi-Environment Support**: Manage flags across Development, Staging, and Production environments independently.
*   **Targeting Rules**: Roll out features based on user IDs, user groups, or percentage-based rollouts.
*   **Evaluation API**: Evaluate individual flags or batches of flags with a project API key, user ID, and optional groups.
*   **Projects and API Keys**: Organize flags by project; rotate or revoke project keys. Keys are bcrypt-hashed at rest and shown only once when created or rotated.
*   **Organizations and Roles**: Workspaces support owner, admin, and member roles. Owners and admins can invite teammates with a single-use, 24-hour invitation link and manage eligible members.
*   **Authentication and Security**: Use HTTP-only cookie sessions, session expiry, CSRF protection for state-changing dashboard requests, role-based access control, Helmet, and validated environment configuration.
*   **Audit Logging**: Track flag and targeting-rule changes, including the acting user and role.
*   **Modern UI**: Responsive React dashboard with system theme detection and saved light/dark mode preference.

## Architecture

*   **Frontend**: React 18, TypeScript, Vite, Redux Toolkit, RTK Query, Tailwind CSS
*   **Backend**: Node.js, Express, TypeScript, Zod for validation, bcryptjs, and cookie-parser.
*   **Database**: PostgreSQL 15, `pg` (node-postgres), with migrations run on server startup.

## Getting Started

### Prerequisites

*   Node.js 18+
*   Docker & Docker Compose (for PostgreSQL)

### Local Development Setup

1.  **Start the Database**
  Copy the local environment template before starting the services:
  ```bash
  cp .env.example .env
  cp server/.env.example server/.env
  ```
  Use the same database username, password, and database name in both files.

    ```bash
    docker-compose up -d
    ```
    This starts PostgreSQL on `localhost:5433` and pgAdmin on `localhost:5050`. The database will be automatically created. Set the values in `.env` and `server/.env` to matching database credentials; do not commit either file.

2.  **Start the Backend**
    ```bash
    cd server
    npm install
    npm run dev
    ```
    *Note: The server automatically runs database migrations on startup.*

3.  **Start the Frontend**
    In a new terminal:
    ```bash
    cd client
    npm install
    npm run dev
    ```

4.  **Access the Application**
    *   Dashboard: [http://localhost:5173](http://localhost:5173)
    *   API: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
    *   pgAdmin: [http://localhost:5050](http://localhost:5050), using `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` from `.env`

### Dashboard workflow

1. Register the first user to create an organization. The first user becomes the organization owner.
2. Create projects and flags from the dashboard. Owners and admins can make changes; members have read access to the dashboard data.
3. From **Team**, owners and admins can invite members or admins with a single-use link that expires after 24 hours.
4. From **Projects**, create, rotate, or revoke an API key. A new key is returned only at creation or rotation time, so store it securely.

The dashboard API uses an HTTP-only session cookie. The API also exposes `/api/v1/auth/me` for session discovery and `/api/v1/auth/logout` for session termination.

### API overview

Dashboard routes are available under `/api/v1` and require an authenticated session. The main route groups are:

*   `/auth`: registration, login, logout, current-session lookup, and invitation acceptance.
*   `/organizations`: invitations and member management.
*   `/projects`: project management and API-key rotation or revocation.
*   `/flags`: flag, environment, targeting-rule, and flag-audit management.
*   `/stats` and `/audit`: dashboard metrics and organization audit history.
*   `/evaluate` and `/evaluate/batch`: SDK-style flag evaluation using `X-API-Key`.

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
    environment: 'development',   // 'development', 'staging', or 'production'
    userId: 'user-123',           // Optional: for user_ids or percentage targeting
    groups: ['beta-testers']      // Optional: for groups targeting
  })
});

const { data } = await response.json();

if (data.enabled) {
  // Show new feature
} else {
  // Show old feature
}
```
