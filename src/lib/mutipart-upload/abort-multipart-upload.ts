import { S3, bucketName } from 'config/S3.config';

//* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#abortMultipartUpload-property
export const abortMultipartUpload = async (key: string, uploadId: string) => {
  const abortMultipartParams = {
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
  };

  try {
    const data = await S3.abortMultipartUpload(abortMultipartParams).promise();
    return data;
  } catch (err) {
    console.info('ABORT_MULTIPART_UPLOAD');
    throw new Error(err);
  }
};
