import { Request } from 'express';
import { FileFilterCallback } from 'multer';

export function videoFileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (file.mimetype !== 'video/mp4') {
    cb(new Error('올바른 동영상 확장자가 아닙니다.'));
  } else {
    cb(null, true);
  }
}
