import { Request } from 'express';
import { FileFilterCallback } from 'multer';

const imageExt = ['image/png', 'image/jpg', 'image/jpeg'];

export function imageFileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (!imageExt.includes(file.mimetype)) {
    cb(new Error('올바른 이미지 확장자가 아닙니다.'));
  }

  // 10MB
  if (file.size > 1024 * 1024 * 10) {
    cb(new Error('이미지 파일의 용량이 너무 큽니다.'));
  }

  cb(null, true);
}
