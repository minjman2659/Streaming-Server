import * as multer from 'multer';
import * as path from 'path';
import { videosDir, imagesDir, videoFileFilter, imageFileFilter } from 'lib';

// const regex = / /gi;

export function multerStorage(fileType: string) {
  const storage = multer.diskStorage({
    destination: fileType === 'video' ? videosDir : imagesDir,
    filename: (req, file, cb) => {
      const { originalname } = file;
      // const trimedName = originalname.replace(regex, '');
      const ext = path.extname(originalname);
      const fileName = `${Date.now()}${ext}`;
      cb(null, fileName);
    },
  });

  const fileFilter = fileType === 'video' ? videoFileFilter : imageFileFilter;

  const fileUpload = multer({ storage, fileFilter }).single('file');
  return fileUpload;
}
