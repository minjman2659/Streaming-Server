import * as express from 'express';
import { uploadVideo, getVideo } from './video.ctrl';

const video = express.Router();

video.post('/', uploadVideo);
video.get('/', getVideo);

export default video;
