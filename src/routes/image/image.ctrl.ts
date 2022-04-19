import { Request, Response, NextFunction } from 'express';
import { multerStorage } from 'middlewares';

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
  //* req.file에서
  //* originalname, mimetype, size, key, location 만 DB에 저장
  //* ex) 'cat.PNG', 'image/png', '24767', 'image/1650117510593_cat.PNG', 'https://amazon.com/cat.PNG'
};
