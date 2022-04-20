import * as fs from 'fs';
import * as path from 'path';
import { S3, bucketName } from 'config/S3.config';

export const uploadVideoAws = async (
  file: Express.Multer.File,
  start: number,
) => {
  if (!file) {
    throw new Error('NO_FILE');
  }

  if (!fs.existsSync(file.path)) {
    throw new Error('FILE_NOT_EXIST');
  }

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

    const chunkSize = 10 * 1024 * 1024; // 10MB
    const readStream = fs.createReadStream(file.path);

    //* 2단계
    const uploadPartsPromise = new Promise((resolve, reject) => {
      const multipartMap: any = { Parts: [] };

      let partNumber = 1;
      let chunkAccumulator: any = null;

      readStream.on('error', err => {
        reject(err);
      });

      readStream.on('data', chunk => {
        if (!chunkAccumulator) {
          chunkAccumulator = chunk;
        } else {
          chunkAccumulator = Buffer.concat([chunkAccumulator, chunk]);
        }
        if (chunkAccumulator.length > chunkSize) {
          readStream.pause();

          const chunkMB = chunkAccumulator.length / 1024 / 1024;

          const uploadParams = {
            Bucket: bucketName,
            Key: key,
            PartNumber: partNumber,
            UploadId,
            Body: chunkAccumulator,
            ContentLength: chunkAccumulator.length,
          };

          S3.uploadPart(uploadParams, (err, data) => {
            if (err) {
              console.error('ERROR_UPLOADPART');
              reject(err);
            } else {
              console.info(
                `Data uploaded. Entity tag: ${data.ETag} Part: ${uploadParams.PartNumber} Size: ${chunkMB}`,
              );
              multipartMap.Parts.push({
                ETag: data.ETag,
                PartNumber: uploadParams.PartNumber,
              });
              partNumber++;
              chunkAccumulator = null;
              // resume to read the next chunk
              readStream.resume();
            }
          });
        }
      });

      readStream.on('end', () => {
        console.info('END_STREAM');
      });

      readStream.on('close', () => {
        console.info('CLOSE_STREAM');
        if (chunkAccumulator) {
          const chunkMB = chunkAccumulator.length / 1024 / 1024;
          //* upload the last chunk
          const lastParams = {
            Bucket: bucketName,
            Key: key,
            PartNumber: partNumber,
            UploadId,
            Body: chunkAccumulator,
            ContentLength: chunkAccumulator.length,
          };

          S3.uploadPart(lastParams, (err, data) => {
            if (err) {
              console.error('ERROR_LAST_UPLOADPART');
              reject(err);
            } else {
              console.info(
                `Last Data uploaded. Entity tag: ${data.ETag} Part: ${lastParams.PartNumber} Size: ${chunkMB}`,
              );
              multipartMap.Parts.push({
                ETag: data.ETag,
                PartNumber: lastParams.PartNumber,
              });
              chunkAccumulator = null;
              resolve(multipartMap);
            }
          });
        }
      });
    });

    const multipartMap = await uploadPartsPromise;
    console.info(`ALL_PARTS_UPLOADED`);

    //* 3단계
    const completeParams = {
      Bucket: bucketName,
      Key: key,
      MultipartUpload: multipartMap,
      UploadId,
    };

    const complete = await S3.completeMultipartUpload(completeParams).promise();
    const end = performance.now();
    console.log('끝 : ', end);
    console.log('runtime: ' + (end - start) + 'ms');
    return complete;
  } catch (err) {
    throw new Error(err);
  }
};
