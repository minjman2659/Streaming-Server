import * as express from 'express';
import { awsStorage } from 'lib';
import { uploadImageInLocal, uploadImageInAws } from './image.ctrl';

const image = express.Router();

image.post('/local', uploadImageInLocal);
image.post('/aws', awsStorage().single('file'), uploadImageInAws);

export default image;
