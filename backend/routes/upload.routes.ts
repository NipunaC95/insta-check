import { Router } from 'express';
import { getUploads, deleteUpload, handleUpload } from '../controllers/upload.controller.ts';
import { uploadMiddleware } from '../middleware/upload.middleware.ts';

const router = Router();

// GET /api/uploads - lists all uploads
router.get('/uploads', getUploads);

// DELETE /api/uploads/:uploadId - deletes an upload session
router.delete('/uploads/:uploadId', deleteUpload);

// POST /api/upload - handles Instagram JSON or ZIP file upload
router.post(
  '/upload',
  uploadMiddleware.fields([
    { name: 'followers', maxCount: 1 },
    { name: 'following', maxCount: 1 },
    { name: 'archive', maxCount: 1 },
    { name: 'files', maxCount: 5 },
  ]),
  handleUpload
);

export default router;
