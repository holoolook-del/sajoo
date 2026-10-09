/**
 * Firebase 설정 플래그 — SDK를 import하지 않는다(초기 번들에 Firebase가 들어가지 않게).
 * 실제 초기화는 지연 로드되는 features/board/posts.ts가 한다.
 *
 * VITE_FIREBASE_* env가 없으면 firebaseReady=false → 게시판은 '준비 중' 화면,
 * 앱 나머지는 외부 호출 없이 동작한다. env는 빌드 타임에 주입된다.
 *
 * 웹 config는 비밀이 아니다(번들에 포함되는 게 설계상 정상). 보안은
 * 저장소 루트의 firestore.rules / database.rules.json이 담당한다.
 */

export const FIREBASE_CFG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const firebaseReady = Boolean(
  FIREBASE_CFG.apiKey && FIREBASE_CFG.projectId && FIREBASE_CFG.databaseURL && FIREBASE_CFG.appId,
);
