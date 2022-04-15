import { Request, Response, NextFunction } from 'express';
import * as url from 'url';
import * as fs from 'fs';
import { multerStorage } from 'lib';

export const uploadVideo = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = performance.now();
  console.log('시작 : ', start);

  const videoUpload = multerStorage('video');

  videoUpload(req, res, err => {
    if (err) {
      next(err);
      return;
    }
    const video = {
      videoName: res.req.file.filename,
      videoPath: res.req.file.path,
    };

    const end = performance.now();
    console.log('끝 : ', end);
    console.log('runtime: ' + (end - start) + 'ms');

    res.status(201).send(video);
  });
};

export const getVideo = (req: Request, res: Response, next: NextFunction) => {
  const { pathname } = url.parse(req.url, true);
  // const { videoName } = req.params;
  const videoPath = `public/videos${pathname}`;
  console.log(videoPath);
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  let { range } = req.headers;
  if (!range) range = 'bytes=0-';
  console.log(range);

  const MAX_CHUNK_SIZE = 1000 * 1000 * 50;
  // range 헤더 파싱
  const parts = range.replace(/bytes=/, '').split('-');
  // 재생 구간 설정
  const start = parseInt(parts[0], 10);
  const _end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  const end = Math.min(_end, start + MAX_CHUNK_SIZE - 1);
  // console.log(start, _end, end);

  const header = {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': `bytes`,
    'Content-Type': 'video/mp4',
    'Content-Length': end - start + 1,
  };
  res.writeHead(206, header);
  const readStream = fs.createReadStream(videoPath, { start, end });
  readStream.pipe(res);
};
