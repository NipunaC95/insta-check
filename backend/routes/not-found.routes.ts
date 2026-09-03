import { Router, Request, Response } from 'express';
import { dbService } from '../services/db.service.ts';

const router = Router();

// GET /api/not-found - Return list of usernames marked as account not found
router.get('/not-found', async (_req: Request, res: Response) => {
  try {
    const list = await dbService.getNotFoundUsers();
    res.json({ notFound: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch not found users' });
  }
});

// POST /api/not-found/toggle - Toggle not found state for a username
router.post('/not-found/toggle', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Valid username string is required' });
      return;
    }
    const result = await dbService.toggleNotFoundUser(username);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle not found user' });
  }
});

// POST /api/not-found - Set not found state explicitly
router.post('/not-found', async (req: Request, res: Response) => {
  try {
    const { username, notFound } = req.body;
    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Valid username string is required' });
      return;
    }
    const result = await dbService.setNotFoundUser(username, Boolean(notFound));
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to set not found user' });
  }
});

export default router;
