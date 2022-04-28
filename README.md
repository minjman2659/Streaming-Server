# 대용량 동영상 스트리밍 서버

Streaming-Server by Node.js(Express)

<br />

동영상 스트리밍의 유형은,

<b>1) 저장된 동영상을 제공하는 온디맨드 스트리밍</b> <br />
<b>2) 실시간으로 동영상을 제공하는 라이브 스트리밍</b>

두가지 유형으로 나뉜다. 지금 작성하는 정리 글은 우리 서비스의 계획에 맞추어 곧 활용하게 될 <b>온디맨드 스트리밍</b> 방식에 대해서 설명할 것이다.

그 전에, 동영상과 같이 대용량 파일을 처리하는데 있어서 꼭 필요한 개념인 <b>Stream</b>에 대해서 사전지식이 필요하기에 아래 글들을 참고하여 이해하고 진행하도록 하자.

*참고 1) [Node.js Streams: Everything you need to know](https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93)* <br />
*참고 2) [Stream 사용하기](https://darrengwon.tistory.com/1215)*

<br />

## 온디맨드 스트리밍
앞서 말한 것 처럼, 온디맨드 스트리밍 방식은 이미 저장된 동영상을 사용자에게 원하는 시간에 언제든지 제공할 수 있는 스트리밍 방식이다. 동영상 파일은 GB 단위를 넘어갈 만큼 대용량 파일의 가능성이 높으므로 백엔드 서버에서 동영상 파일들을 모두 갖고 있기에는 메모리적 부담이 클 수 밖에 없다. 그래서 AWS에서 정적 콘텐츠를 대상으로 무제한적으로 확장 가능한 스토리지를 제공하는 S3서비스를 활용하게 되었다.

### AWS에서 제시하는 동영상 스트리밍 Work Flow
![image](https://user-images.githubusercontent.com/81504356/164974142-f65dad8f-b78e-44da-b76b-036527624aef.png)

AWS에서 제시하는 온디맨드 스트리밍 방식은 위와 같은데, 구현하기 위해 필요한 서비스는 <b>S3, Lambda, MediaConvert, CloudFront</b> 이다. <br />
관리자가 동영상을 S3에 업로드하면 Lambda의 이벤트 트리거에 의해 MediaConvert를 동작시키고, MediaConvert는 동영상 파일을 원하는 형태로 트랜스코딩하여 다시 S3에 저장하게 된다. 이렇게 동영상 파일이 안전하고 원하는 형태로 저장되었다면 CloudFront를 이용해 엣지에 캐시하여 짧은 지연 시간과 높은 처리량으로 사용자에게 동영상을 전송할 수 있게 된다.

*출처) [Amazon CloudFront 미디어 스트리밍 자습서](https://aws.amazon.com/ko/cloudfront/streaming/)*

앞으로는 동영상 파일을 업로드하고 사용자에게 제공하기 까지의 과정을 단계별로 조금 더 상세하게 설명하고자 한다.

<br />

## 1. 동영상 업로드
동영상을 업로드 하기 위한 과정은, 3단계로 다음과 같이 진행된다.

<b> 1) 클라이언트에서 multipart/form-data 형식으로 서버에 동영상 파일을 업로드(전달)한다. </b> <br />
<b> 2) 서버에서는 전달받은 동영상을 특정한 형태(디스크 or 메모리 or 스트림 형태)로 보관하게 되고, </b> <br />
<b> 3) 전달받은 동영상 파일을 AWS-S3에 Multipart-Upload 방식을 통해 잘개 쪼개어 저장하게 된다. </b> <br />

먼저 클라이언트에서 form 태그로 동영상 파일을 전달할 때, enctype으로 <b>multipart/form-data</b> 속성값을 넣어 전달하게 된다. multipart/form-data는 전혀 다른 Content-type의 데이터(동영상 파일은 video/mp4이고, 동영상 제목은 application/x-www-form-urlencoded)가 HTTP-Request Body에 포함되어 전송될 때 그것을 분류하기 위한 타입으로, method가 POST일 때만 사용할 수 있는 속성이다.<br />
multipart/form-data에 대한 더 자세한 내용은 아래 블로그 링크를 참고하자.

*참고) [Multipart/form-data란?](https://junghyun100.github.io/Multipart_form-data/)*

서버에서는 클라이언트에서 전달받은 동영상 파일을 임시로 보관하기 위해 다양한 방식을 선택할 수 있는데, Node.js에서는 multipart/form-data 형태를 처리하는 다양한 노드 패키지가 존재한다. 다만, 각 라이브러리 마다 장단점이 존재하기 때문에 아래의 조건에 따라서 선택하는 것이 좋다. <br />
- Express로 구현된 서버인지
- 중간 파일을 저장해도 되는지, 아니면 Stream(하나의 청크 단위로 쪼개서 처리)에 담아서 처리할 것인지
- 만약 중간 파일을 저장한다면 인메모리와 디스크 중 어느 공간에 저장할 것인지

![image](https://user-images.githubusercontent.com/81504356/164977313-576afa03-523c-4e32-9848-57da773ed5ff.png)

이 글은 대용량의 동영상 파일을 저장하기 위한 서버이므로, 만약 Node.js 서버에 중간 파일로서 동영상을 저장하게 된다면 잠재적으로 메모리 누수나 하드디스크가 꽉 차서 서버가 중단될 수 있기 때문에 중간 저장 방식은 피해야만 했다. 그래서 본 서버는 stream 형태로 동영상 파일을 제공할 수 있게 도와주는 <b>busboy</b> 라이브러리를 사용하였다. (Multiparty 라이브러리 역시 stream 방식을 지원하지만, 공식문서에서 busboy를 추천하기 때문에 busboy를 선택했다) <br />
중간 서버에서 동영상 파일을 처리하는데 사용되는 각 라이브러리에 대해 더 상세한 비교 분석 내용은 아래 글을 참고하자.

*참고) [Choose between Formidable, Busboy, Multer and Multiparty for processing file uploads](https://bytearcher.com/articles/formidable-vs-busboy-vs-multer-vs-multiparty/)*

이제 stream 형태로 전달받는 동영상 파일을 AWS-S3에 저장하는 일만 남았다. AWS-S3에서는 대용량 파일을 더 효율적으로 저장할 수 있도록 Multipart-Upload 방식을 도입했는데, 덕분에 하나의 대용량 파일을 더 작고 관리하기 쉬운 chunk로 업로드할 수 있게 되었다. 그리고 단일 객체 업로드로는 최대 5GB의 파일만 가능했지만, Multipart-Upload 방식으로 인해 최대 5TB 파일도 저장할 수 있게 되었고, 네트워크 오류로 인해 실패한 업로드를 다시 시작하는 불편함을 최소화할 수 있게 되었다. 본 Node.js 서버 역시 Multipart-Upload 방식을 이용해서 AWS-S3에 대용량 동영상 파일을 저장할 수 있도록 코드를 구현하였다.

Multipart-Upload는 3단계의 프로세스에서 각 필요한 API를 호출하여 진행할 수 있다.

1) 멀티파트 업로드 시작(createMultipartUpload): AWS-S3에 멀티파트 업로드를 시작한다고 알리는 단계로, 2단계와 3단계를 진행하기 위해 필요한 UploadId를 응답받게 된다. <br />
2) 파트 업로드(uploadPart): 파일의 각 파트를 쪼개어 개별 업로드를 진행하는 단계이다. 각 파트별로 구분하기 위한 PartNumber와 ETag를 응답받게 된다. <br />
3) 멀티파트 업로드 완료(completeMultipartUpload): 모든 파트의 업로드가 완료되어 이제 하나의 파일로 결합할 수 있음을 AWS-S3에 알리는 단계이다. 파일이 저장된 경로를 응답받게 된다.

*출처) [AWS - Uploading and copying objects using multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)*

지금까지의 모든 과정을 성공적으로 진행하게 된다면, 사전에 생성한 S3 버킷에 클라이언트에서부터 업로드한 동영상 파일이 무사히 저장되어 있는 것을 발견할 수 있을 것이다.

<br />

## 2. MediaConvert와 Lambda로 저장된 동영상 파일 트랜스코딩 하기
AWS-S3에 동영상 파일이 성공적으로 저장되었다면, 다음으로 진행할 것은 원하는 형식으로 동영상 파일을 변환할 차례이다. 동영상 변환 작업을 가능하게 도와주는 것이 바로 **AWS-MediaConvert** 서비스이며, **Lambda**를 통해 동영상 변환 작업을 자동화할 수 있다. **MediaConvert**를 조금 더 자세하게 설명하자면, 영상 콘텐츠 파일에 **영상 변환(압축, 분할, 썸네일 이미지 추출, 영상 파일 포맷 변환 등)** 과 **패키징(여러 디바이스에서 영상 파일을 실행할 수 있도록 해주는 작업)**, **파일 접근 권한 제어**를 수행하는 서비스이다. MediaConvert 서비스를 사용하면 좋은 점은 다음과 같다.

- 서비스 운영을 AWS에서 해주기 때문에 관리 비용을 줄일 수 있다. 
- File Transcoding 기술에 대한 진입장벽이 낮아진다.
- 서비스를 쉽게 확장할 수 있으며, 비용 예측을 쉽게 할 수 있다.

즉, File Transcoding 기능을 쉽게 도입하고, 유지보수할 수 있다는 것이 큰 장점이다.

필자는 MediaConvert와 Lambda 서비스를 활용하여 화질별 영상 분할 저장과 썸네일 추출을 진행했다. 유튜브, 인프런 등의 여러 동영상 서비스를 보면 360p / 720p 등의 화질을 선택해서 감상할 수 있는 것을 발견할 수 있을 것이다. 이는 한 파일을 여러개로 보이는 것이 아니라 각 화질별로 동영상 파일을 분할 저장한 것으로, 아래 프로세스를 통해 진행할 수 있다.

동영상 변환 작업의 과정은 다음과 같다.

<b> 1) Node.js 서버에서 AWS-S3에 동영상을 업로드하면, 미리 설정해둔 트리거에 의해 Lambda 함수가 실행된다. </b> <br />
<b> 2) Lambda 함수에 의해 미리 설정해둔 MediaConvert 작업이 실행되고, </b> <br />
<b> 3) MediaConvert에 의해 각 화질별로 영상이 변환되어 S3에 저장된다. </b> <br />
<b> 4) 해당 작업의 모든 log는 CloudWatch에서 확인할 수 있다. </b> <br />

**주의) AWS-S3에 원본이 저장될 공간과 변환되어 저장될 공간을 분리해야 한다!**  

*참고) [[AWS] MediaConvert + lambda 를 이용해 원하는 화질로 파일 분리하기](https://lemontia.tistory.com/1034)*

<br />

## 3. CloudFront로 동영상 파일 스트리밍 하기
마지막 단계는 변환한 동영상 파일을 CloudFront 서비스를 이용해서 최종 사용자에게 제공 해야한다. 사용자는 변환된 동영상 덕분에 모든 디바이스에서 언제든지 동영상 콘텐츠를 감상할 수 있게 된다.

CloudFront 서비스를 활용해서 동영상을 제공하는 것의 장점은 다음과 같다.

- 캐싱을 통해 사용자에게 동영상 파일 제공하는데 지연 시간을 최소화 할 수 있고, 더 빠른 응답을 지원할 수 있다.
- CloudFront 서명 URL을 활용한다면, 무단 엑세스를 방지하고 애플리케이션 외부에서 재생할 수 없도록 동영상 콘텐츠를 보호할 수 있다.

*출처) [Amazon CloudFront란 무엇입니까?](https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)*

CloudFront와 S3를 연결시켰다면, 이제 MediaConvert로 변환된 HLS 동영상 파일을 재생시킬 웹페이지가 만들어져야 한다. 그런데 HLS는 Apple 기기 위주로 만든 방식이라 크롬에서 재생이 안된다. 그래서 AWS에서는 **Video.js**, **Google Shaka Player**, **hls.js** 를 활용하라고 한다.

*출처) [HLS를 사용한 비디오 재생](https://docs.aws.amazon.com/ko_kr/kinesisvideostreams/latest/dg/hls-playback.html)* <br />
*출처) [HTTP 라이브 스트리밍이란 무엇입니까? | HLS 스트리밍](https://www.cloudflare.com/ko-kr/learning/video/what-is-http-live-streaming/)*

보편적으로 video.js를 가장 많이 사용하는 것 같으니, [공식 문서](https://videojs.com/getting-started/)를 참고해서 코드를 작성하면 되겠다. <br />
(만약 동영상을 스트리밍하는데 에러가 발생한다면, CORS 에러일 확률이 높으니 AWS의 S3와 CloudFront에서 CORS 설정을 진행하면 해결 가능하다)

<br />

## # 기타
만약 비용적인 부분에서 큰 부담이 없고, 더 편리하게 동영상 서비스를 구현하고 싶다면 비디오와 관련된 각종 REST API를 제공하는 비디오 관리 유료 툴을 사용하는 것도 좋은 선택이 될 수 있다.

*참고 1) [WECANDEO](https://www.wecandeo.com/product/videopack)* <br />
*참고 2) [WECANDEO OPEN API](https://support.wecandeo.com/reference/videopack-api-getting-started)*
