import * as fs from 'fs';
import { S3, bucketName } from 'config/S3.config';

//* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#uploadPart-property
export const uploadPart = (
  chunkSize: number,
  readStream: fs.ReadStream,
  key: string,
  uploadId: string,
) => {
  const uploadParts = new Promise((resolve, reject) => {
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

        const uploadMultipartParams = {
          Bucket: bucketName,
          Key: key,
          PartNumber: partNumber,
          UploadId: uploadId,
          Body: chunkAccumulator,
          ContentLength: chunkAccumulator.length,
        };

        S3.uploadPart(uploadMultipartParams, (err, data) => {
          if (err) {
            console.error('ERROR_UPLOADPART');
            reject(err);
          } else {
            console.info(
              `개별 파트 업로드 성공 - Entity tag: ${data.ETag} Part: ${uploadMultipartParams.PartNumber} Size: ${chunkMB}`,
            );
            multipartMap.Parts.push({
              ETag: data.ETag,
              PartNumber: uploadMultipartParams.PartNumber,
            });
            partNumber++;
            chunkAccumulator = null;
            // 다음 파트 진행
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
        // 마지막 파트 업로드
        const lastParams = {
          Bucket: bucketName,
          Key: key,
          PartNumber: partNumber,
          UploadId: uploadId,
          Body: chunkAccumulator,
          ContentLength: chunkAccumulator.length,
        };

        S3.uploadPart(lastParams, (err, data) => {
          if (err) {
            console.error('ERROR_LAST_UPLOADPART');
            reject(err);
          } else {
            console.info(
              `마지막 파트 업로드 성공 - Entity tag: ${data.ETag} Part: ${lastParams.PartNumber} Size: ${chunkMB}`,
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

  return uploadParts;
};
