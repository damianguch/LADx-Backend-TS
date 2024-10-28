import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

// Middleware to handle error during file upload
const uploadErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({
      status: 'E00',
      message: 'File upload error: ' + err.message
    });
    return;
  }
  next(err);
};

export { uploadErrorHandler };
