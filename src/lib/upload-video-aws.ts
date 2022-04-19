// import * as fs from 'fs';
import * as path from 'path';
import { S3, bucketName } from 'config/S3.config';

export const uploadVideoAws = (file: Buffer, fileName: string) => {
  // const fileStream = fs.createReadStream(file.toString('base64'));
  // fileStream.on('error', err => {
  //   next(err);
  //   return;
  // });
  const encoded = encodeURI(fileName);
  const key = `video/${Date.now()}_${path.basename(encoded)}`.replace(/ /g, '');

  const params = {
    Key: key,
    Bucket: bucketName,
    Body: file,
    ContentType: 'video/mp4',
    ACL: 'public-read',
  };

  return new Promise((resolve, reject) => {
    S3.upload(params, (err: any, data: any) => {
      if (err) {
        reject(err);
      } else {
        console.log('Uploaded Successfully!');
        resolve(data);
      }
    });
  });
};
