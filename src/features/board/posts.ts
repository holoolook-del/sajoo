import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getDoc, getFirestore, increment, limit, onSnapshot, orderBy,
  query, serverTimestamp, Timestamp, updateDoc, where, type Firestore, type Unsubscribe,
} from 'firebase/firestore';
import {
  getDatabase, onDisconnect, onValue, ref, remove, set, serverTimestamp as rtdbTs,
  type Database,
} from 'firebase/database';
import { FIREBASE_CFG } from '../../lib/firebase.ts';
import { boardLastWrite, boardMarkFlag, boardStampWrite } from '../../lib/storage.ts';
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
const AUTH_TIMEOUT_MS = 15_000;
/** 익명 인증 — 로그인 UI 없이 기기별 uid. 글 작성·삭제 소유권 확인용.
 *  인앱 브라우저 등 저장소 제한 환경에서 인증이 멈출 수 있어 타임아웃을 두고,
 *  실패 시 캐시를 비워 다시 시도할 수 있게 한다. */
export function deviceUid(): Promise<string> {
  if (!authPromise) {
    authPromise = Promise.race([
      signInAnonymously(getAuth(app())).then((c) => c.user.uid),
      new Promise<string>((_, rej) =>
        setTimeout(() => rej(new BoardError('연결 시간이 초과됐어요')), AUTH_TIMEOUT_MS)),
    ]);
    authPromise.catch(() => { authPromise = null; });
  }
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
  likes: number;    // 좋아요 수 — likePost가 +1
  reports: number;  // 신고 수 — HIDE_AT_REPORTS 이상이면 클라이언트에서 가림
  comments: number; // 댓글 수 — addComment가 +1
  ts: number;      // ms epoch (serverTimestamp 해석 후)
}

/** 신고 이 수 이상이면 목록에서 가린다 */
export const HIDE_AT_REPORTS = 5;

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

/** 최신 글 스트림 — 반환값으로 구독 해제. onErr 없으면 실패가 조용히 무한 로딩이 된다.
 *  30일 지난 글은 쿼리에서 제외(TTL은 결제 계정 필요 — Blaze 등록 시 콘솔 TTL로 물리 삭제 가능). */
export function watchPosts(cb: (posts: Post[]) => void, onErr?: (e: unknown) => void): Unsubscribe {
  const cutoff = Timestamp.fromMillis(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const q = query(
    collection(firestore(), 'posts'),
    where('ts', '>', cutoff),
    orderBy('ts', 'desc'), limit(50),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        uid: String(v.uid ?? ''),
        nick: String(v.nick ?? '익명'),
        text: String(v.text ?? ''),
        card: v.card as ResultCard | undefined,
        likes: Number(v.likes ?? 0),
        reports: Number(v.reports ?? 0),
        comments: Number(v.comments ?? 0),
        ts: (v.ts?.toMillis?.() ?? Date.now()) as number,
      };
    }));
  }, onErr);
}

export function watchComments(
  postId: string,
  cb: (comments: Comment[]) => void,
  onErr?: (e: unknown) => void,
): Unsubscribe {
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
  }, onErr);
}

// ── 쓰기 ──

export async function addPost(nick: string, text: string, card?: ResultCard): Promise<void> {
  throttle('post');
  const check = checkText(text, POST_MAX_LEN);
  if (!check.ok) throw new BoardError(check.reason);
  if (card && text.trim().length > POST_MAX_LEN) throw new BoardError('내용이 너무 깁니다');
  const uid = await deviceUid();
  await addDoc(collection(firestore(), 'posts'), {
    uid, nick, text: text.trim(), ...(card ? { card } : {}),
    likes: 0, reports: 0, comments: 0, ts: serverTimestamp(),
  });
  boardStampWrite('post');
}

export async function addComment(postId: string, nick: string, text: string): Promise<void> {
  throttle('comment');
  const check = checkText(text, COMMENT_MAX_LEN);
  if (!check.ok) throw new BoardError(check.reason);
  const uid = await deviceUid();
  const fs = firestore();
  await addDoc(collection(fs, 'posts', postId, 'comments'), {
    uid, nick, text: text.trim(), ts: serverTimestamp(),
  });
  await updateDoc(doc(fs, 'posts', postId), { comments: increment(1) });
  boardStampWrite('comment');
}

/** 좋아요 +1 — 기기당 1회 플래그는 storage가, 증분 제한은 rules가 막는다 */
export async function likePost(postId: string): Promise<void> {
  await deviceUid();
  await updateDoc(doc(firestore(), 'posts', postId), { likes: increment(1) });
  boardMarkFlag('like', postId);
}

/** 신고 +1 — 누적 HIDE_AT_REPORTS 이상이면 클라이언트가 글을 가린다 */
export async function reportPost(postId: string): Promise<void> {
  await deviceUid();
  await updateDoc(doc(firestore(), 'posts', postId), { reports: increment(1) });
  boardMarkFlag('report', postId);
}

/** 내 기기에서 쓴 글만 삭제 가능 — 서버 측은 rules가 uid를 검증 (관리자는 전부 가능) */
export async function removePost(postId: string): Promise<void> {
  await deleteDoc(doc(firestore(), 'posts', postId));
}

/** 관리자 여부 — admins/{uid} 문서는 콘솔에서만 추가, 클라이언트는 본인 문서 get만 허용 */
export async function isAdmin(): Promise<boolean> {
  const uid = await deviceUid();
  return (await getDoc(doc(firestore(), 'admins', uid))).exists();
}

/** 댓글 삭제 — 관리자 전용(rules). comments 카운터 -1 감분은 rules가 관리자에만 허용 */
export async function removeComment(postId: string, commentId: string): Promise<void> {
  const fs = firestore();
  await deleteDoc(doc(fs, 'posts', postId, 'comments', commentId));
  await updateDoc(doc(fs, 'posts', postId), { comments: increment(-1) });
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

export function watchPresence(cb: (count: number) => void, onErr?: (e: unknown) => void): Unsubscribe {
  return onValue(ref(realtimeDb(), 'presence'), (snap) => cb(snap.size), onErr);
}
