import * as express from 'express';
import {
  uploadVideoInLocal,
  getVideoFromLocal,
  uploadVideoInAws,
} from './video.ctrl';

const video = express.Router();

video.post('/local', uploadVideoInLocal); // 로컬에 동영상 업로드
video.post('/aws', uploadVideoInAws); // AWS-S3에 동영상 업로드(멀티파트 업로드 방식)
video.get('/local/:videoName', getVideoFromLocal); // 로컬에서 동영상 조회하기

export default video;
