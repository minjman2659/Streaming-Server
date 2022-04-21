import { S3, bucketName } from 'config/S3.config';

//* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#createMultipartUpload-property
export const createMultipartUpload = async (key: string) => {
  const createMultipartParams = {
    Key: key,
    Bucket: bucketName,
    ContentType: 'video/mp4',
    ACL: 'public-read',
  };

  try {
    const { UploadId } = await S3.createMultipartUpload(
      createMultipartParams,
    ).promise();

    return { UploadId };
  } catch (err) {
    throw new Error(err);
  }
};
