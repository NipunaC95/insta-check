import { Router, Request, Response } from 'express';
import { dbService } from '../services/db.service.ts';

const router = Router();

// GET /api/false-positive - Return list of usernames marked as false positive
router.get('/false-positive', async (_req: Request, res: Response) => {
  try {
    const list = await dbService.getFalsePositiveUsers();
    res.json({ falsePositive: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch false positive users' });
  }
});

// POST /api/false-positive/toggle - Toggle false positive state for a username
router.post('/false-positive/toggle', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Valid username string is required' });
      return;
    }
    const result = await dbService.toggleFalsePositiveUser(username);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle false positive user' });
  }
});

// POST /api/false-positive - Set false positive state explicitly
router.post('/false-positive', async (req: Request, res: Response) => {
  try {
    const { username, falsePositive } = req.body;
    if (!username || typeof username !== 'string') {
      res.status(400).json({ error: 'Valid username string is required' });
      return;
    }
    const result = await dbService.setFalsePositiveUser(username, Boolean(falsePositive));
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to set false positive user' });
  }
});

export default router;
