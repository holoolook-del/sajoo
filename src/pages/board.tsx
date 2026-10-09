import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BackHome } from '../components/back-home.tsx';
import { SoundToggle } from '../components/sound-toggle.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { QUIZZES } from '../content/tests.ts';
import { firebaseReady } from '../lib/firebase.ts';
import { loadTestResult } from '../lib/storage.ts';
import { timeAgo } from '../lib/date.ts';
import { boardNickname, saveNickname } from '../features/board/nickname.ts';
import {
  addComment, addPost, deviceUid, removePost, watchComments, watchPosts, watchPresence,
  BoardError, type Comment, type Post, type ResultCard,
} from '../features/board/posts.ts';
import { checkText, COMMENT_MAX_LEN, POST_MAX_LEN } from '../features/board/filter.ts';

/**
 * 자유 게시판 — Firebase(Firestore + RTDB presence) 기반 익명 게시판.
 * firebase 설정(env)이 없으면 '준비 중' 화면을 보여주고 앱 나머지는 그대로 동작한다.
 * 프로필 불필요 — 공유 링크로 온 친구도 바로 읽고 쓸 수 있다.
 */
export function BoardPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [online, setOnline] = useState(0);
  const [myUid, setMyUid] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseReady) return;
    const un1 = watchPosts(setPosts);
    const un2 = watchPresence(setOnline);
    void deviceUid().then(setMyUid).catch(() => setError('연결에 실패했어요 — 잠시 후 다시 열어주세요'));
    return () => { un1(); un2(); };
  }, []);

  if (!firebaseReady) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
        <header className="pt-6">
          <div className="flex items-center justify-between">
            <BackHome />
            <SoundToggle />
          </div>
          <h1 className="mt-2 text-2xl font-bold text-gold">자유 게시판</h1>
        </header>
        <section className="rounded-xl border border-gold/30 bg-night-soft p-6 text-center">
          <p className="text-3xl">☾</p>
          <p className="mt-3 font-bold text-gold-bright">게시판을 여는 중이에요</p>
          <p className="mt-2 text-sm leading-6 text-hanji/60">
            운세 이야기를 나누는 익명 광장을 준비하고 있습니다.<br />
            조금만 기다려 주세요.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-6 pb-10">
      <header className="pt-6">
        <div className="flex items-center justify-between">
          <BackHome />
          <SoundToggle />
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gold">자유 게시판</h1>
            <p className="mt-1 text-xs text-hanji/50">익명으로 운세 이야기를 나누는 광장</p>
          </div>
          <p className="flex items-center gap-1.5 rounded-full border border-[#6ec4a0]/40 bg-night-soft px-2.5 py-1 text-[11px] text-[#6ec4a0]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6ec4a0]" />
            {online}명 접속 중
          </p>
        </div>
      </header>

      <WriteBox onError={setError} />
      {error && <p className="text-center text-xs text-[#e0705a]">{error}</p>}

      {posts === null ? (
        <p className="py-10 text-center text-sm text-hanji/40">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="rounded-xl border border-hanji/10 bg-night-soft py-10 text-center text-sm text-hanji/40">
          아직 글이 없어요 — 첫 글을 남겨보세요
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {posts.map((p) => (
              <PostItem key={p.id} post={p} mine={p.uid !== '' && p.uid === myUid} onError={setError} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <p className="text-center text-[10px] leading-4 text-hanji/30">
        익명 게시판입니다 — 닉네임은 기기에만 저장되며 개인정보를 적지 마세요.<br />
        욕설·광고·링크는 올릴 수 없습니다.
      </p>
    </main>
  );
}

// ── 글쓰기 박스 ──

function WriteBox({ onError }: { onError: (m: string) => void }) {
  const [nick, setNick] = useState(boardNickname());
  const [editingNick, setEditingNick] = useState(false);
  const [text, setText] = useState('');
  const [card, setCard] = useState<ResultCard | null>(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const live = checkText(text, POST_MAX_LEN);

  /** 완료한 테스트 결과를 카드로 올린다 — 바이럴용 '내 결과 자랑' */
  const myResults = Object.values(QUIZZES)
    .map((q) => {
      const code = loadTestResult(q.id);
      const t = code ? q.types[code] : null;
      return code && t
        ? { label: q.title, big: code, title: `「${t.name}」`, accent: t.accent ?? '#e8c766' }
        : null;
    })
    .filter((c): c is ResultCard => c !== null);

  async function submit() {
    if (!live.ok) { onError(live.reason ?? ''); return; }
    setBusy(true);
    onError('');
    try {
      await addPost(nick, text, card ?? undefined);
      setText('');
      setCard(null);
    } catch (e) {
      onError(e instanceof BoardError ? e.message : '올리지 못했어요 — 잠시 후 다시 시도해주세요');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-gold/30 bg-night-soft p-4">
      <div className="flex items-center justify-between">
        {editingNick ? (
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            onBlur={() => { const t = nick.trim(); if (t) { saveNickname(t); setNick(t); } else setNick(boardNickname()); setEditingNick(false); }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            maxLength={12}
            autoFocus
            className="w-32 rounded-lg border border-gold/50 bg-night px-2 py-1 text-xs text-gold-bright outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingNick(true)}
            className="text-xs font-bold text-gold-bright"
            title="닉네임 바꾸기"
          >
            {nick} ✎
          </button>
        )}
        <span className="text-[10px] text-hanji/40">{text.length}/{POST_MAX_LEN}</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="오늘 운세 어땠어요? 자유롭게 이야기해요"
        rows={3}
        className="mt-2 w-full resize-none rounded-lg border border-hanji/15 bg-night p-3 text-sm leading-6 text-hanji placeholder:text-hanji/30 outline-none focus:border-gold/50"
      />

      {card && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-hanji/15 bg-night p-2.5">
          <span className="text-lg font-bold" style={{ color: card.accent }}>{card.big}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-hanji/50">{card.label}</p>
            <p className="truncate text-xs font-bold text-hanji">{card.title}</p>
          </div>
          <button type="button" onClick={() => setCard(null)} className="text-xs text-hanji/40">✕</button>
        </div>
      )}

      <div className="mt-2 flex gap-2">
        {myResults.length > 0 && (
          <button
            type="button"
            onClick={() => setPicker((v) => !v)}
            className="rounded-lg border border-hanji/20 px-3 py-2 text-xs text-hanji/70"
          >
            내 결과 자랑
          </button>
        )}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !text.trim()}
          className="flex-1 rounded-lg bg-gold py-2 text-sm font-bold text-night disabled:opacity-40"
        >
          {busy ? '올리는 중…' : '남기기'}
        </button>
      </div>

      {picker && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {myResults.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => { setCard(r); setPicker(false); }}
              className="rounded-lg border border-hanji/15 bg-night p-2 text-left"
            >
              <p className="text-[10px] text-hanji/50">{r.label}</p>
              <p className="text-xs font-bold" style={{ color: r.accent }}>{r.big} {r.title}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ── 글 아이템 + 댓글 ──

function PostItem({ post, mine, onError }: { post: Post; mine: boolean; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [cText, setCText] = useState('');
  const [cBusy, setCBusy] = useState(false);
  const unref = useRef<(() => void) | null>(null);

  function toggleComments() {
    if (open) { unref.current?.(); unref.current = null; setOpen(false); return; }
    unref.current = watchComments(post.id, setComments);
    setOpen(true);
  }
  useEffect(() => () => unref.current?.(), []);

  async function submitComment() {
    const check = checkText(cText, COMMENT_MAX_LEN);
    if (!check.ok) { onError(check.reason ?? ''); return; }
    setCBusy(true);
    try {
      await addComment(post.id, boardNickname(), cText);
      setCText('');
    } catch (e) {
      onError(e instanceof BoardError ? e.message : '댓글을 달지 못했어요');
    } finally {
      setCBusy(false);
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-hanji/12 bg-night-soft p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gold-bright">{post.nick}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-hanji/40">{timeAgo(post.ts)}</span>
          {mine && (
            <button
              type="button"
              onClick={() => void removePost(post.id).catch(() => onError('지우지 못했어요'))}
              className="text-[10px] text-hanji/40 underline"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-hanji/85">{post.text}</p>

      {post.card && (
        <div className="mt-2 rounded-lg border border-hanji/15 bg-night p-3 text-center">
          <p className="text-[10px] text-hanji/50">{post.card.label}</p>
          <p className="mt-0.5 text-xl font-bold" style={{ color: post.card.accent }}>{post.card.big}</p>
          <p className="text-xs text-hanji/70">{post.card.title}</p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={toggleComments}
          className="text-[11px] text-hanji/50"
        >
          {open ? '댓글 닫기' : '댓글'}
        </button>
        <ShareButton
          label="공유"
          text={`${post.nick}: ${post.text}${post.card ? `\n${post.card.label} ${post.card.big} ${post.card.title}` : ''}\n— 사주 게시판에서`}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 border-t border-hanji/10 pt-2">
              {comments === null ? (
                <p className="py-2 text-center text-xs text-hanji/40">불러오는 중…</p>
              ) : comments.length === 0 ? (
                <p className="py-2 text-center text-xs text-hanji/30">첫 댓글을 남겨보세요</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {comments.map((c) => (
                    <li key={c.id} className="text-xs">
                      <span className="font-bold text-gold-bright/80">{c.nick}</span>
                      <span className="ml-1.5 text-hanji/80">{c.text}</span>
                      <span className="ml-1.5 text-[9px] text-hanji/30">{timeAgo(c.ts)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex gap-1.5">
                <input
                  value={cText}
                  onChange={(e) => setCText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void submitComment()}
                  placeholder={`${boardNickname()}(으)로 댓글 달기`}
                  maxLength={COMMENT_MAX_LEN}
                  className="min-w-0 flex-1 rounded-lg border border-hanji/15 bg-night px-2.5 py-1.5 text-xs text-hanji placeholder:text-hanji/30 outline-none focus:border-gold/50"
                />
                <button
                  type="button"
                  onClick={() => void submitComment()}
                  disabled={cBusy || !cText.trim()}
                  className="rounded-lg bg-gold/90 px-3 text-xs font-bold text-night disabled:opacity-40"
                >
                  등록
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
