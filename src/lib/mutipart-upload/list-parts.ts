import { S3, bucketName } from 'config/S3.config';

//* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listParts-property
export const listParts = async (key: string, uploadId: string) => {
  const listPartsParams = {
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
  };

  try {
    const data = await S3.listParts(listPartsParams).promise();
    return { data };
  } catch (err) {
    console.info('LIST_PARTS_ERROR');
    throw new Error(err);
  }
};
