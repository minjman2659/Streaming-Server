import * as express from 'express';
import { uploadImage } from './image.ctrl';

const image = express.Router();

image.post('/', uploadImage);

export default image;
