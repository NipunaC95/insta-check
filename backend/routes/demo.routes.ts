import { Router } from 'express';
import { createDemoSessions } from '../controllers/demo.controller.ts';

const router = Router();

// POST /api/demo - seeds mock sessions for testing comparison
router.post('/demo', createDemoSessions);

export default router;
