import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  console.error('Unhandled server error on path:', req.path, err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File exceeds maximum upload size (10 MB). Please upload a smaller file.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected upload field: ${err.field}. Please use the standard upload dialog.`;
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
  });
}
