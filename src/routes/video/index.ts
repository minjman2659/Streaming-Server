import * as express from 'express';
import { uploadVideoInLocal, getVideoFromLocal } from './video.ctrl';

const video = express.Router();

video.post('/local', uploadVideoInLocal);
video.get('/local/:videoName', getVideoFromLocal);

export default video;
