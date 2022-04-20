import * as fs from 'fs';
import * as path from 'path';
import { S3, bucketName } from 'config/S3.config';
import { NextFunction } from 'express';

export const uploadVideoAws = async (
  file: Express.Multer.File,
  start: number,
  next: NextFunction,
) => {
  const fileStream = fs.createReadStream(file.path);

  const encoded = encodeURI(file.originalname);
  const key = `video/${Date.now()}_${path.basename(encoded)}`.replace(/ /g, '');

  const params = {
    Key: key,
    Bucket: bucketName,
    ContentType: 'video/mp4',
    ACL: 'public-read',
  };

  //* AWS S3에 대용량 파일을 빠르게 업로드 하기 위해서는 multipart를 이용해야 하는데, 이는 총 3단계에 걸쳐서 업로드를 진행한다.
  //* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#createMultipartUpload-property  <- 공식문서 참고
  try {
    //* 1단계: 새로운 멅티파트 업로드를 시작한다는 신호를 S3에 보내기 -> UploadId를 받아온다
    const { UploadId } = await S3.createMultipartUpload(params).promise();

    let multiPartMap: any = {
      parts: [],
    };
    let partNumber = 0;
    fileStream
      .on('data', chunk => {
        partNumber++;
        fileStream.pause();
        let partRes = uploadParts(chunk, key, partNumber, UploadId, next);
        multiPartMap.parts[partNumber] = partRes;
        fileStream.resume();
      })
      .on('end', () => {
        console.log('done');
        const complete = completePart(key, multiPartMap, UploadId, next);
        const end = performance.now();
        console.log('끝 : ', end);
        console.log('runtime: ' + (end - start) + 'ms');
        return complete;
      });
  } catch (err) {
    next(err);
  }
};

function uploadParts(
  fileBuffer: string | Buffer,
  key: string,
  partNumber: number,
  uploadId: string,
  next: NextFunction,
) {
  const params = {
    Body: fileBuffer,
    Bucket: bucketName,
    Key: key,
    PartNumber: partNumber,
    UploadId: uploadId,
  };
  return new Promise((resolve, reject) => {
    try {
      S3.uploadPart(params, (err: any, data: any) => {
        if (err) {
          next(err);
          return;
        } else {
          resolve({
            ETag: data.ETag,
            PartNumber: partNumber,
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function completePart(
  key: string,
  multiPartMap: any,
  uploadId: string,
  next: NextFunction,
) {
  const params = {
    Bucket: bucketName,
    Key: key,
    MultipartUpload: multiPartMap,
    UploadId: uploadId,
  };
  return new Promise((resolve, reject) => {
    try {
      S3.completeMultipartUpload(params, (err, data) => {
        if (err) {
          next(err);
          return;
        } else {
          resolve(data);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
