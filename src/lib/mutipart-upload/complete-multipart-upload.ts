import { S3, bucketName } from 'config/S3.config';

//* https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#completeMultipartUpload-property
export const completeMutipartUpload = async (
  key: string,
  multipartMap: any,
  uploadId: string,
) => {
  const completeMultipartParams = {
    Bucket: bucketName,
    Key: key,
    MultipartUpload: multipartMap,
    UploadId: uploadId,
  };

  try {
    const completeUpload = await S3.completeMultipartUpload(
      completeMultipartParams,
    ).promise();

    return { completeUpload };
  } catch (err) {
    console.info('COMPLETE_MULTIPART_UPLOAD_ERROR');
    throw new Error(err);
  }
};
