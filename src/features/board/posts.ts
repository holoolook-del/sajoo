import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getFirestore, limit, onSnapshot, orderBy, query,
  serverTimestamp, type Firestore, type Unsubscribe,
} from 'firebase/firestore';
import {
  getDatabase, onDisconnect, onValue, ref, remove, set, serverTimestamp as rtdbTs,
  type Database,
} from 'firebase/database';
import { FIREBASE_CFG } from '../../lib/firebase.ts';
import { boardLastWrite, boardStampWrite } from '../../lib/storage.ts';
import { checkText, COMMENT_MAX_LEN, POST_MAX_LEN } from './filter.ts';

/**
 * 게시판 데이터 — Firestore 'posts' 컬렉션 + 'posts/{id}/comments' + RTDB presence.
 * 스키마: docs/DECISIONS.md 참고. 작성자 식별은 익명 인증 uid.
 * 이 파일은 /board 라우트와 함께 지연 로드된다 — 초기 번들에 Firebase를 싣지 않기 위함.
 */

function app(): FirebaseApp {
  return getApps()[0] ?? initializeApp(FIREBASE_CFG);
}
function firestore(): Firestore {
  return getFirestore(app());
}
function realtimeDb(): Database {
  return getDatabase(app());
}
let authPromise: Promise<string> | null = null;
/** 익명 인증 — 로그인 UI 없이 기기별 uid. 글 작성·삭제 소유권 확인용. */
export function deviceUid(): Promise<string> {
  authPromise ??= signInAnonymously(getAuth(app())).then((c) => c.user.uid);
  return authPromise;
}

export interface ResultCard {
  label: string;   // 예: 'MBTI 기질 테스트'
  big: string;     // 예: 'INFP'
  title: string;   // 예: '열정적인 중재자'
  accent: string;  // 카드 강조색
}

export interface Post {
  id: string;
  uid: string;
  nick: string;
  text: string;
  card?: ResultCard;
  ts: number;      // ms epoch (serverTimestamp 해석 후)
}

export interface Comment {
  id: string;
  uid: string;
  nick: string;
  text: string;
  ts: number;
}

const POST_INTERVAL_MS = 30_000;    // 글 30초 간격
const COMMENT_INTERVAL_MS = 10_000; // 댓글 10초 간격

export class BoardError extends Error {}

function throttle(kind: 'post' | 'comment'): void {
  const gap = kind === 'post' ? POST_INTERVAL_MS : COMMENT_INTERVAL_MS;
  const remain = gap - (Date.now() - boardLastWrite(kind));
  if (remain > 0) {
    throw new BoardError(`${Math.ceil(remain / 1000)}초 후에 다시 쓸 수 있어요`);
  }
}

// ── 읽기 ──

/** 최신 글 스트림 — 반환값으로 구독 해제 */
export function watchPosts(cb: (posts: Post[]) => void): Unsubscribe {
  const q = query(collection(firestore(), 'posts'), orderBy('ts', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        uid: String(v.uid ?? ''),
        nick: String(v.nick ?? '익명'),
        text: String(v.text ?? ''),
        card: v.card as ResultCard | undefined,
        ts: (v.ts?.toMillis?.() ?? Date.now()) as number,
      };
    }));
  });
}

export function watchComments(postId: string, cb: (comments: Comment[]) => void): Unsubscribe {
  const q = query(
    collection(firestore(), 'posts', postId, 'comments'),
    orderBy('ts', 'asc'), limit(100),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        uid: String(v.uid ?? ''),
        nick: String(v.nick ?? '익명'),
        text: String(v.text ?? ''),
        ts: (v.ts?.toMillis?.() ?? Date.now()) as number,
      };
    }));
  });
}

// ── 쓰기 ──

export async function addPost(nick: string, text: string, card?: ResultCard): Promise<void> {
  throttle('post');
  const check = checkText(text, POST_MAX_LEN);
  if (!check.ok) throw new BoardError(check.reason);
  if (card && text.trim().length > POST_MAX_LEN) throw new BoardError('내용이 너무 깁니다');
  const uid = await deviceUid();
  await addDoc(collection(firestore(), 'posts'), {
    uid, nick, text: text.trim(), ...(card ? { card } : {}), ts: serverTimestamp(),
  });
  boardStampWrite('post');
}

export async function addComment(postId: string, nick: string, text: string): Promise<void> {
  throttle('comment');
  const check = checkText(text, COMMENT_MAX_LEN);
  if (!check.ok) throw new BoardError(check.reason);
  const uid = await deviceUid();
  await addDoc(collection(firestore(), 'posts', postId, 'comments'), {
    uid, nick, text: text.trim(), ts: serverTimestamp(),
  });
  boardStampWrite('comment');
}

/** 내 기기에서 쓴 글만 삭제 가능 — 서버 측은 rules가 uid를 검증 */
export async function removePost(postId: string): Promise<void> {
  await deleteDoc(doc(firestore(), 'posts', postId));
}

// ── 동시접속자 (Realtime DB presence) ──

/**
 * 앱이 떠 있는 동안 presence/{uid}를 유지하고, 연결이 끊기면 서버가 지운다.
 * 구독자 수 = 지금 접속 중인 기기 수.
 */
export async function startPresence(): Promise<void> {
  const uid = await deviceUid();
  const db = realtimeDb();
  const me = ref(db, `presence/${uid}`);
  onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) return;
    void onDisconnect(me).remove().then(() => set(me, rtdbTs()));
  });
  // 페이지를 닫아도 onDisconnect가 정리 — 명시적 cleanup도 지원
  window.addEventListener('beforeunload', () => void remove(me));
}

export function watchPresence(cb: (count: number) => void): Unsubscribe {
  return onValue(ref(realtimeDb(), 'presence'), (snap) => cb(snap.size));
}
