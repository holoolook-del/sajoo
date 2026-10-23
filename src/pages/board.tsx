import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BackHome } from '../components/back-home.tsx';
import { SoundToggle } from '../components/sound-toggle.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { QUIZZES } from '../content/tests.ts';
import { getCardById } from '../content/cards.ts';
import { firebaseReady } from '../lib/firebase.ts';
import {
  boardFlag, loadCardDraw, loadFortune, loadTestResult,
} from '../lib/storage.ts';
import { todayKST, timeAgo } from '../lib/date.ts';
import { ogUrl } from '../lib/og.ts';
import { useSaju } from '../features/saju/use-saju.ts';
import { interpretSaju } from '../lib/interpret.ts';
import { boardNickname, saveNickname } from '../features/board/nickname.ts';
import {
  addComment, addPost, deviceUid, isAdmin, likePost, removeComment, removePost, reportPost,
  watchComments, watchPosts, watchPresence,
  BoardError, HIDE_AT_REPORTS, type Comment, type Post, type ResultCard,
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
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loadErr, setLoadErr] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [sort, setSort] = useState<'new' | 'hot'>('new');
  const gotData = useRef(false);

  useEffect(() => {
    if (!firebaseReady) return;
    gotData.current = false;
    const un1 = watchPosts(
      (ps) => { gotData.current = true; setPosts(ps); },
      () => setLoadErr('목록을 불러오지 못했어요'),
    );
    const un2 = watchPresence(setOnline, () => {});
    void deviceUid().then(setMyUid).catch(() => setError('연결에 실패했어요 — 잠시 후 다시 열어주세요'));
    void isAdmin().then(setAdmin).catch(() => {});
    const slow = setTimeout(() => {
      if (!gotData.current) setLoadErr('연결이 느려요 — 네트워크를 확인하거나 다시 시도해주세요');
    }, 12_000);
    return () => { un1(); un2(); clearTimeout(slow); };
  }, [retryKey]);

  const shown = useMemo(() => {
    const list = posts ?? [];
    return sort === 'hot'
      ? [...list].sort((a, b) => b.likes - a.likes || b.ts - a.ts)
      : list;
  }, [posts, sort]);

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
            조금만 기다려 주세요.<br />
            <span className="text-xs text-hanji/40">
              계속 이 화면이 보이면 앱을 완전히 닫고 다시 열어주세요.
            </span>
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

      {loadErr && posts === null ? (
        <div className="rounded-xl border border-[#e0705a]/40 bg-night-soft py-10 text-center">
          <p className="text-sm text-hanji/70">{loadErr}</p>
          <button
            type="button"
            onClick={() => { setPosts(null); setLoadErr(''); setRetryKey((k) => k + 1); }}
            className="mt-3 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-night"
          >
            다시 시도
          </button>
        </div>
      ) : posts === null ? (
        <p className="py-10 text-center text-sm text-hanji/40">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="rounded-xl border border-hanji/10 bg-night-soft py-10 text-center text-sm text-hanji/40">
          아직 글이 없어요 — 첫 글을 남겨보세요
        </p>
      ) : (
        <>
          <div className="flex gap-2">
            {(['new', 'hot'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                  sort === s ? 'bg-gold text-night' : 'border border-hanji/20 text-hanji/50'
                }`}
              >
                {s === 'new' ? '최신' : '인기'}
              </button>
            ))}
          </div>
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {shown.map((p) =>
                p.reports >= HIDE_AT_REPORTS ? (
                  <li
                    key={p.id}
                    className="rounded-xl border border-hanji/8 bg-night-soft/50 px-4 py-3 text-center text-xs text-hanji/30"
                  >
                    신고로 가려진 글이에요
                  </li>
                ) : (
                  <PostItem key={p.id} post={p} mine={p.uid !== '' && p.uid === myUid} admin={admin} onError={setError} />
                ),
              )}
            </AnimatePresence>
          </ul>
        </>
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
  const [nickErr, setNickErr] = useState('');
  const [editingNick, setEditingNick] = useState(false);
  const [text, setText] = useState('');
  const [card, setCard] = useState<ResultCard | null>(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const live = checkText(text, POST_MAX_LEN);
  const { saju } = useSaju();
  const reading = saju ? interpretSaju(saju) : null;
  const fortune = loadFortune(todayKST());
  const dayCard = (() => { const d = loadCardDraw(todayKST()); return d ? getCardById(d.cardId) : undefined; })();

  /** 저장된 내 결과들을 카드로 올린다 — 바이럴용 '내 결과 자랑' */
  const myResults = [
    ...(reading && saju
      ? [{ label: '나의 사주 캐릭터', big: saju.dayMaster.hanja, title: `「${reading.dayMaster.title}」`, accent: '#e8c766' }]
      : []),
    ...(fortune
      ? [{ label: '오늘의 운세', big: fortune.grade, title: `${fortune.iljin} — ${fortune.summary}`, accent: '#e8c766' }]
      : []),
    ...(dayCard
      ? [{ label: '오늘의 운세카드', big: dayCard.name, title: `${dayCard.grade} · ${dayCard.hanja}`, accent: '#e8c766' }]
      : []),
    ...Object.values(QUIZZES)
      .map((q) => {
        const code = loadTestResult(q.id);
        const t = code ? q.types[code] : null;
        return code && t
          ? { label: q.title, big: code, title: `「${t.name}」`, accent: t.accent ?? '#e8c766' }
          : null;
      })
      .filter((c): c is ResultCard => c !== null),
  ];

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
            onBlur={() => {
              const t = nick.trim();
              const saved = t.length > 0 && saveNickname(t);
              setNick(saved ? t : boardNickname());
              setNickErr(t && !saved ? '사용할 수 없는 닉네임이에요' : '');
              setEditingNick(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            maxLength={12}
            autoFocus
            className="w-32 rounded-lg border border-gold/50 bg-night px-2 py-1 text-xs text-gold-bright outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setNickErr(''); setEditingNick(true); }}
            className="text-xs font-bold text-gold-bright"
            title="닉네임 바꾸기"
          >
            {nick} ✎
          </button>
        )}
        <span className="text-[10px] text-hanji/40">{text.length}/{POST_MAX_LEN}</span>
      </div>
      {nickErr && <p className="mt-1 text-[10px] text-[#e0705a]">{nickErr}</p>}

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

function PostItem({ post, mine, admin, onError }: { post: Post; mine: boolean; admin: boolean; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [cText, setCText] = useState('');
  const [cBusy, setCBusy] = useState(false);
  const [liked, setLiked] = useState(() => boardFlag('like', post.id));
  const [reported, setReported] = useState(() => boardFlag('report', post.id));
  const unref = useRef<(() => void) | null>(null);

  function toggleComments() {
    if (open) { unref.current?.(); unref.current = null; setOpen(false); return; }
    unref.current = watchComments(post.id, setComments, () => onError('댓글을 불러오지 못했어요'));
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
          {(mine || admin) && (
            <button
              type="button"
              onClick={() => {
                if (!mine && !window.confirm('관리자로 이 글을 지울까요?')) return;
                void removePost(post.id).catch(() => onError('지우지 못했어요'));
              }}
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={liked}
            onClick={() => {
              void likePost(post.id)
                .then(() => setLiked(true))
                .catch(() => onError('좋아요를 누르지 못했어요'));
            }}
            className={`text-[11px] ${liked ? 'text-[#e0705a]' : 'text-hanji/50'}`}
          >
            {liked ? '♥' : '♡'} 좋아요{post.likes > 0 ? ` ${post.likes}` : ''}
          </button>
          <button
            type="button"
            onClick={toggleComments}
            className="text-[11px] text-hanji/50"
          >
            {open ? '댓글 닫기' : `댓글${post.comments > 0 ? ` ${post.comments}` : ''}`}
          </button>
          {!mine && (
            <button
              type="button"
              disabled={reported}
              onClick={() => {
                if (!window.confirm('이 글을 신고할까요?')) return;
                void reportPost(post.id)
                  .then(() => setReported(true))
                  .catch(() => onError('신고하지 못했어요'));
              }}
              className={`text-[11px] ${reported ? 'text-hanji/30' : 'text-hanji/40'}`}
              title="신고"
            >
              {reported ? '신고됨' : '신고'}
            </button>
          )}
        </div>
        <ShareButton
          label="공유"
          url={ogUrl('board')}
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
                      {admin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm('관리자로 이 댓글을 지울까요?')) return;
                            void removeComment(post.id, c.id).catch(() => onError('댓글을 지우지 못했어요'));
                          }}
                          className="ml-1.5 text-[9px] text-[#e0705a]/60 underline"
                        >
                          삭제
                        </button>
                      )}
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
