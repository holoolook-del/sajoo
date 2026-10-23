/**
 * 결과별 OG 랜딩 페이지 생성 — `vite build` 뒤 dist/og/<슬러그>/index.html을 쓴다.
 * 카톡·슬랙 등 링크 미리보기 크롤러는 JS를 실행하지 않으므로 og 태그를 정적으로 깔아두고,
 * 방문자는 meta refresh + JS로 즉시 앱 해시 라우트로 리다이렉트한다.
 * 슬러그는 src/lib/og.ts의 STEM_OG·GRADE_OG와 동일해야 한다.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_DECK } from '../src/content/cards.ts';
import { DAY_MASTER_TEXT } from '../src/content/interpret.ts';
import { QUIZZES } from '../src/content/tests.ts';
import { GRADE_OG, OG_BASE, STEM_OG } from '../src/lib/og.ts';

const DIST = 'dist';

interface OgPage {
  path: string;      // og/ 이하 경로
  title: string;
  desc: string;
  image: string;     // OG_BASE 이하 상대 경로
  route: string;     // 앱 해시 라우트
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function html(p: OgPage): string {
  const url = `${OG_BASE}og/${p.path}/`;
  const redirect = `${OG_BASE}#${p.route}`;
  const img = `${OG_BASE}${p.image}`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.title)} — SAJOO</title>
<meta property="og:type" content="article" />
<meta property="og:site_name" content="SAJOO" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.desc)}" />
<meta property="og:image" content="${img}" />
<meta property="og:url" content="${url}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href="${redirect}" />
<meta http-equiv="refresh" content="0;url=${redirect}" />
</head>
<body style="background:#141210;color:#e8dcc0;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0">
<script>location.replace(${JSON.stringify(redirect)});</script>
<p><a href="${redirect}" style="color:#e8c766">SAJOO에서 결과 보기 →</a></p>
</body>
</html>
`;
}

function emit(p: OgPage): void {
  const dir = join(DIST, 'og', p.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html(p));
}

const pages: OgPage[] = [];

// 사주 캐릭터 — 일간 10종
for (const [hanja, slug] of Object.entries(STEM_OG)) {
  const m = DAY_MASTER_TEXT[hanja as keyof typeof DAY_MASTER_TEXT];
  if (!m) continue;
  pages.push({
    path: `saju/${slug}`,
    title: `「${m.title}」 — 나의 사주 캐릭터`,
    desc: `${m.nature} · ${m.keywords.map((k) => `#${k}`).join(' ')}`,
    image: 'assets/illust/menu-saju.webp',
    route: '/saju',
  });
}

// 오늘의 운세카드 — 24종
for (const c of CARD_DECK) {
  pages.push({
    path: `card/${c.id}`,
    title: `${c.name} ${c.hanja} — 오늘의 운세카드 「${c.grade}」`,
    desc: c.message,
    image: `assets/cards/${c.id}.webp`,
    route: '/card',
  });
}

// 오늘의 운세 — 등급별
for (const [grade, slug] of Object.entries(GRADE_OG)) {
  pages.push({
    path: `fortune/${slug}`,
    title: `오늘의 운세 「${grade}」 — SAJOO`,
    desc: '일진과 내 사주가 만든 오늘의 기운. 너의 오늘 운세도 확인해 봐!',
    image: 'assets/illust/menu-fortune.webp',
    route: '/fortune',
  });
  pages.push({
    path: `compat/${slug}`,
    title: `사주 궁합 「${grade}」 — SAJOO`,
    desc: '두 사람의 사주가 만드는 인연 점수. 우리 궁합도 확인해 봐!',
    image: 'assets/illust/menu-compat.webp',
    route: '/compat',
  });
}

// 심리테스트 — 퀴즈별 결과 유형
for (const q of Object.values(QUIZZES)) {
  for (const t of Object.values(q.types)) {
    pages.push({
      path: `test/${q.id}/${t.code}`,
      title: `${t.name} — ${q.title}`,
      desc: t.desc.slice(0, 80),
      image: `assets/illust/${q.img}.webp`,
      route: `/test/${q.id}`,
    });
  }
}

// 자유 게시판
pages.push({
  path: 'board',
  title: '자유 게시판 — SAJOO',
  desc: '익명으로 운세 이야기를 나누는 광장. 오늘 운세 이야기 들려줘!',
  image: 'assets/illust/menu-board.webp',
  route: '/board',
});

// 오늘의 학교 운세 — 날짜 시드라 결과가 매일 달라지므로 공유 미리보기는 랜딩만
pages.push({
  path: 'school',
  title: '오늘의 학교 운세 — SAJOO',
  desc: '급식·숙제·친구·게임 — 오늘 학교 운은? 너도 확인해 봐!',
  image: 'assets/illust/menu-school.webp',
  route: '/school',
});

// 심화 리포트 — 개인 사주 결과라 랜딩만
pages.push({
  path: 'report',
  title: '심화 사주 리포트 — SAJOO',
  desc: '신강신약·용신·대운·세운까지 — 9개 장으로 읽는 깊은 명식 감정서. 너도 받아봐!',
  image: 'assets/illust/menu-saju.webp',
  route: '/report',
});

for (const p of pages) emit(p);
console.log(`OG pages: ${pages.length}개 생성 → dist/og/`);
