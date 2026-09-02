import multer from 'multer';

// Multer memory storage with 10MB file size limit
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit as specified
  },
  fileFilter: (req, file, cb) => {
    const originalName = file.originalname.toLowerCase();
    const isJson = originalName.endsWith('.json') || file.mimetype.includes('json');
    const isHtml = originalName.endsWith('.html') || originalName.endsWith('.htm') || file.mimetype.includes('html');
    const isZip =
      originalName.endsWith('.zip') ||
      file.mimetype.includes('zip') ||
      file.mimetype.includes('octet-stream');

    if (isJson || isHtml || isZip) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.originalname}. Only .json, .html, and .zip files are allowed.`));
    }
  },
});
