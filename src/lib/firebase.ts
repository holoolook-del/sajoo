/**
 * Firebase 설정 — 게시판·동시접속자 기능의 유일한 외부 서비스.
 * SDK를 import하지 않는다(초기 번들에 Firebase가 들어가지 않게).
 * 실제 초기화는 지연 로드되는 features/board/posts.ts가 한다.
 *
 * ⚠️ 이 파일의 config 값들은 '비밀'이 아니다 — Firebase 웹 config는
 * 모든 클라이언트 번들에 포함되도록 설계된 공개값이다.
 * 보안은 저장소 루트의 firestore.rules / database.rules.json이 담당한다.
 *
 * 값이 없으면 firebaseReady=false → 게시판만 '준비 중' 화면,
 * 앱 나머지는 외부 호출 없이 동작한다.
 */

// Firebase 콘솔 → 프로젝트 설정 → 일반 → 내 앱(웹)의 config 값.
// env(VITE_FIREBASE_*)가 있으면 그걸 우선 사용 — 다른 프로젝트 테스트용.
const LITERAL = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  databaseURL: '',
  appId: '',
};

export const FIREBASE_CFG = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || LITERAL.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || LITERAL.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || LITERAL.projectId,
  databaseURL: (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined) || LITERAL.databaseURL,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) || LITERAL.appId,
};

export const firebaseReady = Boolean(
  FIREBASE_CFG.apiKey && FIREBASE_CFG.projectId && FIREBASE_CFG.databaseURL && FIREBASE_CFG.appId,
);
