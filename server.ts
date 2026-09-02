import { startServer, app } from './backend/server.ts';

startServer().catch((err) => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});

export default app;
