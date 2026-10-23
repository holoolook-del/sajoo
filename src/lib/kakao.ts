/**
 * 카카오톡 공유 — Kakao.Share JS SDK를 공유 시점에 지연 로드한다(초기 번들에 싣지 않음).
 * JS 키는 '비밀'이 아니다 — 카카오 앱에 등록된 JavaScript SDK 도메인에서만 동작하는
 * 공개용 키라 번들에 포함돼도 안전하다 (firebase.ts의 웹 config와 같은 성격).
 * 설정: developers.kakao.com 앱 'SAJOO'(ID 1619487)
 *   - 플랫폼 키 > JavaScript 키 > JS SDK 도메인: 사이트 도메인 등록 필수
 *   - 제품 링크 관리 > 웹 도메인: 공유 링크가 열 수 있는 도메인 등록 필수
 * env(VITE_KAKAO_JS_KEY)가 있으면 우선 사용 — 다른 앱으로 테스트할 때.
 */

const LITERAL_KEY = 'b63d94e3ffff640d31c30ce3a592326e';
const KEY = (import.meta.env.VITE_KAKAO_JS_KEY as string | undefined) || LITERAL_KEY;

export const kakaoReady = Boolean(KEY);

interface KakaoShareApi {
  uploadImage(p: { file: Blob[] }): Promise<{ infos: { original: { url: string } } }>;
  sendDefault(p: Record<string, unknown>): void;
}
interface KakaoSdk {
  init(key: string): void;
  isInitialized(): boolean;
  Share: KakaoShareApi;
}

let sdkPromise: Promise<KakaoSdk> | null = null;

function loadSdk(): Promise<KakaoSdk> {
  sdkPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
    s.onload = () => {
      const k = (window as { Kakao?: KakaoSdk }).Kakao;
      if (!k) { sdkPromise = null; reject(new Error('Kakao SDK 없음')); return; }
      if (!k.isInitialized()) k.init(KEY);
      resolve(k);
    };
    s.onerror = () => { sdkPromise = null; reject(new Error('Kakao SDK 로드 실패')); };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

/**
 * 결과 카드를 카카오톡 피드 메시지로 보낸다 — 이미지+텍스트+링크 버튼이 한 메시지에 담김.
 * 이미지는 Kakao.Share.uploadImage로 카카오 서버에 올려 URL을 받아 첨부한다.
 * sendDefault는 카톡 채팅방 선택 화면을 여는 동기 호출 — 반환 시점은 '화면을 열었다'이지 '발송'이 아니다.
 */
export async function shareToKakao(args: {
  title: string;
  description: string;
  imageBlob?: Blob;
  url: string;
}): Promise<'shared' | 'failed'> {
  try {
    const Kakao = await loadSdk();
    const up = args.imageBlob
      ? await Kakao.Share.uploadImage({ file: [args.imageBlob] })
      : null;
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: args.title,
        description: args.description.slice(0, 200),
        ...(up ? { imageUrl: up.infos.original.url } : {}),
        link: { webUrl: args.url, mobileWebUrl: args.url },
      },
      buttons: [
        { title: '내 운세 보러가기', link: { webUrl: args.url, mobileWebUrl: args.url } },
      ],
    });
    return 'shared';
  } catch {
    return 'failed';
  }
}
