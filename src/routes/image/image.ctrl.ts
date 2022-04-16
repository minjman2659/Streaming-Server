import { Request, Response, NextFunction } from 'express';
import { multerStorage } from 'lib';

export const uploadImageInLocal = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const imageUpload = multerStorage('image');

  imageUpload(req, res, err => {
    if (err) {
      next(err);
      return;
    }
    const image = {
      imageName: res.req.file.filename,
      imagePath: res.req.file.path,
    };

    res.status(201).send(image);
  });
};

export const uploadImageInAws = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.send(req.file);
};
