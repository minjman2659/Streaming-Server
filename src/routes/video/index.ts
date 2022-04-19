import * as express from 'express';
import * as multer from 'multer';
import {
  uploadVideoInLocal,
  getVideoFromLocal,
  uploadVideoInAws,
} from './video.ctrl';

const { memoryStorage } = multer;
const storage = memoryStorage();

const upload = multer({ storage });

const video = express.Router();

video.post('/local', uploadVideoInLocal);
video.post('/aws', upload.single('file'), uploadVideoInAws);
video.get('/local/:videoName', getVideoFromLocal);

export default video;
