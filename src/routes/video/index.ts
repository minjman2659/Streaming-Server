import * as express from 'express';
import { multerStorage } from 'middlewares';
import {
  uploadVideoInLocal,
  getVideoFromLocal,
  uploadVideoInAws,
} from './video.ctrl';

const video = express.Router();

video.post('/local', uploadVideoInLocal);
video.post('/aws', multerStorage('video'), uploadVideoInAws);
video.get('/local/:videoName', getVideoFromLocal);

export default video;
