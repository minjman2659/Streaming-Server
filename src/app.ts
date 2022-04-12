import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';
import api from 'routes';
import { missingPath, errorHandler, customCors } from 'middlewares';
import { imagesDir } from 'lib';

const template = path.join(__dirname, '../public', 'index.html');

export default class App {
  public app: express.Application;

  constructor() {
    const app: express.Application = express();
    this.app = app;
  }

  private router() {
    this.app.get('/', (req, res) => {
      res.sendFile(template);
    });
    this.app.use('/api', api);
  }

  private middlewares() {
    this.app.use(cookieParser());
    this.app.use(express.json()); // limit 고려
    this.app.use(customCors);

    this.app.use('/images', express.static(imagesDir));

    this.router();

    this.app.use(missingPath);
    this.app.use(errorHandler);
  }

  public listen(port: number) {
    this.middlewares();
    this.app.listen(port, () => {
      console.log(`Streaming-Server is running, port number is ${port}`);
    });
  }
}
