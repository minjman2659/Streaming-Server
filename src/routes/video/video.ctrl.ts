import { Request, Response, NextFunction } from 'express';

export const uploadVideo = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.send('This is upload-video');
};

export const getVideo = (req: Request, res: Response, next: NextFunction) => {
  res.send('This is get-video');
};
