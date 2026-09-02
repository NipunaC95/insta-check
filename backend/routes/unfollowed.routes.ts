import { Router, Request, Response } from 'express';
import { dbService } from '../services/db.service.ts';

const router = Router();

// GET /api/unfollowed - Return list of unfollowed usernames
router.get('/unfollowed', async (_req: Request, res: Response) => {
  try {
    const list = await dbService.getUnfollowedUsers();
    res.json({ unfollowed: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch unfollowed users' });
  }
});

// POST /api/unfollowed/toggle - Toggle unfollowed state for a username
router.post('/unfollowed/toggle', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Valid username string is required' });
      return;
    }
    const result = await dbService.toggleUnfollowedUser(username);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle unfollowed user' });
  }
});

// POST /api/unfollowed - Set unfollowed state explicitly
router.post('/unfollowed', async (req: Request, res: Response) => {
  try {
    const { username, unfollowed } = req.body;
    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Valid username string is required' });
      return;
    }
    const result = await dbService.setUnfollowedUser(username, Boolean(unfollowed));
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to set unfollowed user' });
  }
});

export default router;
