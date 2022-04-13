import * as express from 'express';
import { uploadVideo, getVideo } from './video.ctrl';

const video = express.Router();

video.post('/', uploadVideo);
video.get('/:videoName', getVideo);

export default video;
