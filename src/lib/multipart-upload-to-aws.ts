import * as path from 'path';
import {
  createMultipartUpload,
  uploadPart,
  completeMutipartUpload,
  listParts,
  abortMultipartUpload,
} from './mutipart-upload';

export const multipartUploadToAws = async (
  chunks: any[],
  uploadName: string,
) => {
  if (!chunks) {
    throw new Error('NO_CHUNKS');
  }

  if (!uploadName) {
    throw new Error('NO_UPLOADNAME');
  }

  const encoded = encodeURI(uploadName);
  const key = `video/${Date.now()}_${path.basename(encoded)}`.replace(/ /g, '');

  //* AWS S3에 대용량 파일을 빠르게 업로드 하기 위해서는 multipart를 이용해야 하는데, 이는 총 3단계에 걸쳐서 업로드를 진행한다.
  //* 대용량 동영상 파일을 작고 관리하기 쉬운 청크로 쪼개어 개별적으로 업로드한 후, 모든 파트들이 업로드 되었다면 S3에서 각 파트들을 합쳐 하나의 파일로 결합해 저장될 수 있다.
  //* 공식문서) https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html

  //? 1단계: 새로운 멀티파트 업로드를 시작한다는 신호를 S3에 보내기
  //* => 이후 2,3단계를 진행하는데 필요한 UploadId를 받아온다.
  let uploadId: string = null;
  try {
    const { UploadId } = await createMultipartUpload(key);
    uploadId = UploadId;
  } catch (err) {
    console.info('CREATE_MULTIPARTUPLOAD_ERROR');
    throw new Error(err);
  }

  const partSize = 10 * 1024 * 1024; // 10MB
  const stream = Buffer.concat(chunks);

  //? 2단계: S3에 업로드 할 동영상 파일을 partSize 만큼 쪼개어 각 개별 파트들을 업로드
  //* => 각 파트들을 업로드할 때마다 대응되는 ETag와 PartNumber을 받아온다(3단계에서 필요).
  try {
    const { multipartMap } = await uploadPart(partSize, stream, key, uploadId);
    console.info(`ALL_PARTS_UPLOADED`);

    //? 3단계: 모든 파트들이 업로드 되었을 때, 이제 하나의 파일로 결합할 수 있음을 S3에 알리기
    //* => 1단계의 UploadId와 2단계의 각 파트들의 ETag들이 필요하다.
    const { completeUpload } = await completeMutipartUpload(
      key,
      multipartMap,
      uploadId,
    );

    return completeUpload;
  } catch (err) {
    console.error(err);
    try {
      //* 2, 3단계에서 파트 업로드 중 에러가 발생했을 경우 파트 업로드를 중단하고,
      //* 현재 진행 중인 파트 업로드가 있는 경우 해당 파트 업로드가 성공하거나 실패할 수 있기 때문에 listParts를 진행하고 난 후,
      //* 만약 존재한다면 다시 abortMultipartUpload를 진행해 완전히 지운다.
      await abortMultipartUpload(key, uploadId);
      const { data } = await listParts(key, uploadId);
      if (data) {
        await abortMultipartUpload(key, uploadId);
      }
    } catch (err) {
      throw new Error(err);
    }
  }
};
