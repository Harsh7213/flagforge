import migrate from './db/migrate';
import { connectRedis } from './db/redis';
import { createApp } from './app';

const app = createApp();
const PORT = parseInt(process.env.PORT || '4000', 10);

// ── Startup ──────────────────────────────────────────────────────────
async function start() {
  try {
    await connectRedis();
    await migrate();
    app.listen(PORT, () => {
      console.log(`\n🚀 Feature Flags API running at http://localhost:${PORT}`);
      console.log(`   Health:   http://localhost:${PORT}/health`);
      console.log(`   API:      http://localhost:${PORT}/api/v1`);
      console.log(`   Env:      ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
