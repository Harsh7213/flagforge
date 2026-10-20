<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/flagforge-logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/flagforge-logo.svg">
    <img src="docs/flagforge-logo.svg" alt="FlagForge logo">
  </picture>
  <h3>Forge your flag now</h3>
  <p>Ship new features with confidence. FlagForge gives your team one place to control rollouts, target the right users, and see how every release is performing—without waiting for a full deployment to change course.</p>
  <p>Self-host FlagForge on your own infrastructure and keep control of your data.</p>
</div>

## Features

- **Multi-Environment Support**: Manage flags across Development, Staging, and Production environments independently.
- **Targeting Rules**: Roll out features based on user IDs, user groups, or percentage-based rollouts.
- **Evaluation API**: Evaluate individual flags or batches of flags with a project API key, user ID, and optional groups.
- **Projects and API Keys**: Organize flags by project; rotate or revoke project keys as required.
- **Organizations and Roles**: Invite your Team to flagforge to contribute, decide role of each member.
- **Audit Logging**: See History of flag changes. 
- **Distributed Rate Limiting**: Enforce consistent request limits across projects using Redis.

## Architecture

- **Frontend**: React 18, TypeScript, Vite, Redux Toolkit, RTK Query, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Zod .
- **Data Stores**: PostgreSQL, Redis for shared rate-limit counters. 

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
   If you want to run the app locally without containers for debugging, first setup PostgreSQL and Redis update the connection string in .env. Run `npm install` and `npm run dev` in the `server` and `client` directories. 

    The server's `REDIS_URL` must point to the host-mapped Redis port. If Redis is stopped or the URL/port does not match, startup fails with `ECONNREFUSED` on port `6379`.

3.  **Access the Application**
    - Dashboard (Docker Compose): [http://localhost](http://localhost)
    - Dashboard (Vite development server): [http://localhost:5173](http://localhost:5173)
    - API: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)

_Note: The backend container automatically runs database migrations before starting the API._

The server uses a shared Redis instance to enforce per-project request limits and monthly evaluation quotas at both project and organization levels. Individual and batch evaluations have separate limits, and each flag in a batch counts toward usage. Requests exceeding a limit receive HTTP `429`.

### API overview

Dashboard routes are available under `/api/v1` and require an authenticated session. The main route groups are:

- `/auth`: registration, login, logout, current-session lookup, and invitation acceptance.
- `/organizations`: invitations and member management.
- `/projects`: project management and API-key rotation or revocation.
- `/flags`: flag, environment, targeting-rule, and flag-audit management.
- `/stats` and `/audit`: dashboard metrics and organization audit history.
- `/evaluate` and `/batchEvaluate`: flag evaluation using `X-API-Key`.

## Evaluating a Feature Flag via API

To get an API key, open the **Projects** page in the dashboard and create or rotate a key. copy it when it is displayed because it cannot be retrieved later. Then evaluate a feature flag from your client application with a `POST` request:

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
    userName: ['user-123'], // Optional: for userName check 
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
