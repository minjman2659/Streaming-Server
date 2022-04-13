import * as multer from 'multer';
import * as path from 'path';
import { videosDir } from './videos-dir';

// const regex = / /gi;

const storage = multer.diskStorage({
  destination: videosDir,
  filename: (req, file, cb) => {
    const { originalname } = file;
    // const trimedName = originalname.replace(regex, '');
    const ext = path.extname(originalname);
    const videoName = `${Date.now()}${ext}`;
    cb(null, videoName);
  },
});

export const videoUpload = multer({ storage }).single('file');
