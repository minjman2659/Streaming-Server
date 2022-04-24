import { S3, bucketName } from 'config/S3.config';

//* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#uploadPart-property
export const uploadPart = async (
  partSize: number,
  stream: Buffer,
  key: string,
  uploadId: string,
) => {
  try {
    const fileSize = stream.length;
    const numberOfParts = Math.ceil(fileSize / partSize);

    const multipartMap: any = { Parts: [] };
    let remainBytes = fileSize;

    for (let partNum = 1; partNum <= numberOfParts; partNum++) {
      let startOfPart = fileSize - remainBytes;
      let endOfPart = Math.min(partSize, startOfPart + remainBytes);
      if (partNum > 1) {
        endOfPart = startOfPart + Math.min(partSize, remainBytes);
        startOfPart++;
      }

      const uploadPartsParams = {
        Body: stream.slice(startOfPart, endOfPart + 1),
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNum,
      };

      const uploadPart = await S3.uploadPart(uploadPartsParams).promise();
      console.info(
        `개별 파트 업로드 성공 - Entity tag: ${uploadPart.ETag} Part: ${
          uploadPartsParams.PartNumber
        } Size: ${uploadPartsParams.Body.length / 1024 / 1024}MB`,
      );
      multipartMap.Parts.push({ ETag: uploadPart.ETag, PartNumber: partNum });
      remainBytes -= Math.min(partSize, remainBytes);
    }

    return { multipartMap };
  } catch (err) {
    console.info('UPLOAD_PARTS_ERROR');
    throw new Error(err);
  }
};
