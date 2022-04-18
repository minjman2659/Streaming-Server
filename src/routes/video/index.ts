import * as express from 'express';
import {
  uploadVideoInLocal,
  getVideoFromLocal,
  uploadVideoInAws,
} from './video.ctrl';

const video = express.Router();

video.post('/local', uploadVideoInLocal);
video.post('/aws', uploadVideoInAws);
video.get('/local/:videoName', getVideoFromLocal);

export default video;
