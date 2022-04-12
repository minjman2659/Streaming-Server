import { Request, Response, NextFunction } from 'express';

export const missingPath = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { url } = req;

  const removeLog = ['/favicon.ico'].includes(url);

  if (removeLog) {
    res.sendStatus(200);
    return;
  }

  const isContent = url.includes('/images');

  const message = isContent ? 'NOT_FOUND' : 'MISSING_PATH';
  next(message);
};
