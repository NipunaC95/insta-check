import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.ts';

const router = Router();

// GET /api/dashboard/:uploadId - returns full statistics and user breakdowns
router.get('/dashboard/:uploadId', getDashboard);

export default router;
