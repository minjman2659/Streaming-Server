import * as path from 'path';
import * as multerS3 from 'multer-s3';
import * as multer from 'multer';
import { S3, bucketName } from 'config/S3.config';

export const awsStorageForImage = () => {
  const storage = multer({
    storage: multerS3({
      s3: S3,
      bucket: bucketName,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: 'public-read',
      key: (req, file, cb) => {
        cb(
          null,
          `image/${Date.now()}_${path.basename(file.originalname)}`.replace(
            / /g,
            '',
          ),
        );
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  return storage;
};
