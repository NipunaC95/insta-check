import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbService } from './services/db.service.ts';
import apiRouter from './routes/index.ts';
import { errorHandler } from './middleware/errorHandler.middleware.ts';

export const app = express();
export const PORT = Number(process.env.PORT) || 3000;

// Body Parsers with 15MB limit
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount API Routes under /api
app.use('/api', apiRouter);

// Centralized error handler for API errors
app.use('/api', errorHandler);

export async function startServer() {
  await dbService.init();

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Instagram Follower Insights server running on http://0.0.0.0:${PORT}`);
  });

  return server;
}
