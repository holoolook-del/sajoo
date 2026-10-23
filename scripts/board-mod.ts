/**
 * 게시판 관리 CLI — .env의 BOARD_ADMIN_REFRESH_TOKEN으로 관리자 idToken 갱신 후 REST로 모더레이션.
 * 사용: pnpm tsx scripts/board-mod.ts <command>
 *   list                 글 목록 + 필터 위반 표시
 *   comments <postId>    글의 댓글 목록
 *   delete <postId>      글 삭제(관리자 권한)
 *   delcomment <p> <c>   댓글 삭제 + 글 comments 카운터 -1
 *   reports              신고 누적 글만 표시
 */
import { readFileSync } from 'node:fs';
import { checkText } from '../src/features/board/filter.ts';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const API_KEY = env.VITE_FIREBASE_API_KEY;
const REFRESH = env.BOARD_ADMIN_REFRESH_TOKEN;
const BASE = 'https://firestore.googleapis.com/v1/projects/sajoo-ad97c/databases/(default)/documents';

type FsDoc = { name: string; fields: Record<string, Record<string, unknown>> };
const str = (d: FsDoc, k: string) => String(d.fields?.[k]?.stringValue ?? '');
const num = (d: FsDoc, k: string) => Number(d.fields?.[k]?.integerValue ?? 0);
const id = (d: FsDoc) => d.name.split('/').pop()!;

async function idToken(): Promise<string> {
  const r = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${REFRESH}`,
    },
  );
  const j = (await r.json()) as { id_token?: string; error?: { message: string } };
  if (!j.id_token) throw new Error(`토큰 갱신 실패: ${j.error?.message}`);
  return j.id_token;
}

async function listDocs(path: string): Promise<FsDoc[]> {
  const r = await fetch(`${BASE}/${path}?pageSize=100`);
  const j = (await r.json()) as { documents?: FsDoc[] };
  return j.documents ?? [];
}

async function del(token: string, path: string) {
  const r = await fetch(`${BASE}/${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`삭제 실패 ${r.status}: ${await r.text()}`);
}

async function patchComments(token: string, postId: string, n: number) {
  const r = await fetch(`${BASE}/posts/${postId}?updateMask.fieldPaths=comments`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { comments: { integerValue: String(n) } } }),
  });
  if (!r.ok) throw new Error(`카운터 감분 실패 ${r.status}: ${await r.text()}`);
}

const fmtTs = (d: FsDoc) => {
  const t = d.fields?.ts?.timestampValue;
  return t ? new Date(String(t)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '?';
};
const flag = (text: string, nick: string) => {
  const bad = [checkText(text, 300).reason, checkText(nick, 12).reason].filter(Boolean);
  return bad.length ? ` ⚠ ${bad.join('/')}` : '';
};

const [cmd, a1, a2] = process.argv.slice(2);
try {
  if (cmd === 'list' || cmd === 'reports') {
    const posts = await listDocs('posts');
    for (const p of posts) {
      if (cmd === 'reports' && num(p, 'reports') === 0) continue;
      console.log(
        `${id(p)} | ${str(p, 'nick')} | ${fmtTs(p)} | ♥${num(p, 'likes')} ⚑${num(p, 'reports')} 💬${num(p, 'comments')}${flag(str(p, 'text'), str(p, 'nick'))}\n  ${str(p, 'text').slice(0, 80)}`,
      );
    }
    console.log(`— ${posts.length}개`);
  } else if (cmd === 'comments' && a1) {
    const cs = await listDocs(`posts/${a1}/comments`);
    for (const c of cs) console.log(`${id(c)} | ${str(c, 'nick')} | ${fmtTs(c)}${flag(str(c, 'text'), str(c, 'nick'))}\n  ${str(c, 'text').slice(0, 80)}`);
    console.log(`— ${cs.length}개`);
  } else if (cmd === 'delete' && a1) {
    const t = await idToken();
    await del(t, `posts/${a1}`);
    console.log(`삭제됨: posts/${a1}`);
  } else if (cmd === 'delcomment' && a1 && a2) {
    const t = await idToken();
    const [post] = [a1];
    await del(t, `posts/${post}/comments/${a2}`);
    const docs = await listDocs('posts');
    const p = docs.find((d) => id(d) === post);
    if (p) await patchComments(t, post, Math.max(0, num(p, 'comments') - 1));
    console.log(`댓글 삭제됨 + 카운터 감분: ${post}/comments/${a2}`);
  } else {
    console.log('usage: list | reports | comments <postId> | delete <postId> | delcomment <postId> <commentId>');
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
