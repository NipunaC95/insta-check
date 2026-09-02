import { Request, Response } from 'express';
import { dbService } from '../services/db.service.ts';

export async function getDashboard(req: Request, res: Response) {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    if (isNaN(uploadId)) {
      return res.status(400).json({ error: 'Invalid upload ID format.' });
    }

    const compareWithId = req.query.compareWithId
      ? parseInt(req.query.compareWithId as string, 10)
      : undefined;

    const dashboard = await dbService.getDashboard(uploadId, compareWithId);
    res.json(dashboard);
  } catch (err: any) {
    console.error(`Error computing dashboard for upload ${req.params.uploadId}:`, err);
    res.status(404).json({ error: err.message || 'Dashboard data not found.' });
  }
}
