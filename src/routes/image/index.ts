import * as express from 'express';
import { awsStorage } from 'lib';
import { uploadImageInLocal, uploadImageInAws } from './image.ctrl';

const image = express.Router();

image.post('/local', uploadImageInLocal); // 로컬에 이미지 업로드
image.post('/aws', awsStorage().single('file'), uploadImageInAws); // AWS-S3에 이미지 업로드

export default image;
