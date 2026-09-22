# FlagForge - Feature Flag Management System

Feature flag management system built with React, Redux Toolkit, Node.js, and PostgreSQL.

## Features

*   **Multi-Environment Support**: Manage flags across Development, Staging, and Production environments independently.
*   **Targeting Rules**: Roll out features based on user IDs, user groups, or percentage-based rollouts.
*   **Audit Logging**: Track all changes to flags and targeting rules with a detailed history.
*   **Projects**: Organize flags by project and authenticate API requests using project-specific API keys.
*   **Modern UI**: Built with React, TailWind CSS, Redux Toolkit, and RTK Query featuring a responsive, dark-mode .

## Architecture

*   **Frontend**: React 18, TypeScript, Vite, Redux Toolkit, RTK Query, Tailwind CSS 
*   **Backend**: Node.js, Express, TypeScript, Zod for validation.
*   **Database**: PostgreSQL 15, `pg` (node-postgres).

## Getting Started

### Prerequisites

*   Node.js 18+
*   Docker & Docker Compose (for PostgreSQL)

### Local Development Setup

1.  **Start the Database**
    ```bash
    docker-compose up -d
    ```
    This starts PostgreSQL and pgAdmin. The database will be automatically created.

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
    *   pgAdmin: [http://localhost:5050](http://localhost:5050) (admin@flags.dev / admin)

## SDK Integration (Example)

To get the API key, open the **Projects** page in the dashboard and copy the key for the project. The API key identifies the project, so a `projectId` is not required. Then evaluate a feature flag from your client application with a `POST` request:

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
