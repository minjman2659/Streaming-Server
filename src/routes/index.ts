import * as express from 'express';
import { format } from 'date-fns';
import image from './image';
import video from './video';

const api = express.Router();

api.use('/image', image);
api.use('/video', video);

api.get('/ping', (req, res) => {
  const now = new Date();
  const time = format(now, 'yyyy-MM-dd HH:mm:ss');
  const text = `Current Time: ${time}`;
  res.send(text);
});

export default api;
