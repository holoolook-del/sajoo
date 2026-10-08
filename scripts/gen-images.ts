/**
 * 이미지 1회 생성 — Replicate flux-schnell (bake-time, 런타임 외부 API 호출 0).
 * 실행: .env에 REPLICATE_API_TOKEN 추가 후 `pnpm gen:images`
 * 출력: public/assets/{cards,illust}/*.webp + icon.png → 빌드·프리캐시에 포함
 * 비용: ~27장 × $0.003 ≈ $0.08. 이미 있는 파일은 건너뛰어 재실행 안전.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_DECK } from '../src/content/cards.ts';

const MODEL = 'black-forest-labs/flux-schnell';
const OUT_DIR = 'public/assets';
const CALL_GAP_MS = 2_000; // 크레딧 $5 이상 계정은 상위 레이트리밋 — 최소 간격만 두고 429는 retry_after로 처리
const POLL_MS = 1500;
const TIMEOUT_MS = 120_000;

const STYLE =
  ', Korean traditional ink-and-color painting with dancheong color palette, ' +
  'deep indigo night background, ornate gold linework, hanji paper texture, ' +
  'rich detailed illustration, no text, no letters, no calligraphy, ' +
  'no seal stamps, no signboards, no scrolls, no cartouches, ' +
  'no border, no frame, pure illustration filling the whole frame edge to edge';

// ── 카드별 그림 주제 — 건축물·현판이 나올 만한 소재는 피함 (글자 유출 방지) ──
const CARD_SUBJECTS: Record<string, string> = {
  'yong-chul': 'a majestic blue dragon rising from dark sea waves toward a full moon',
  'geum-ui': 'a figure in shimmering gold-embroidered silk robes under moonlight',
  'hong-un': 'billowing crimson and gold auspicious clouds swirling above a dark mountain summit',
  'man-sa': 'a traditional sailboat gliding on a calm river with full favorable wind',
  'gwi-in': 'two figures meeting on a moonlit mountain path, one offering a glowing lantern',
  'go-jin': 'close-up of plum blossoms opening on a snow-dusted branch under moonlight',
  'il-chwi': 'tall green bamboo growing upward toward the sun and moon',
  'u-gong': 'a steadfast old man carrying stones in a woven basket before a towering mountain',
  'si-un': 'golden mist spiraling upward into bright auspicious clouds',
  'cheon-si': 'a winding river flowing between golden terraced fields under a huge moon',
  'yu-yu': 'a peaceful scholar floating leisurely on a small boat under willows',
  'tae-pyeong': 'a hen and chicks resting peacefully under a persimmon tree at dusk',
  'seo-haeng': 'a lone traveler walking a long winding road through gentle hills',
  'su-sin': 'an orderly garden of white stones and a lone pine tree in morning light',
  'sin-jung': 'a single crane standing deliberately still in a still pond',
  'yu-bi': 'a prepared oiled-paper umbrella leaning under gathering clouds',
  'jeon-hwa': 'dark storm clouds breaking apart to reveal golden light below',
  'an-bun': 'a round white moon jar beside blooming plum branches on an old wooden table',
  'baek-cheok': 'a lone figure balanced atop a tall pole over a misty abyss',
  'sa-myeon': 'a solitary figure on a hill surrounded by dark encircling forces at night',
  'o-wol': 'two wary figures sharing one small wooden boat on a dark misty river',
  'hwa-bul': 'dark petals and rain falling through heavy storm clouds at night',
  'pung-u': 'violent storm winds and rain lashing a narrow mountain pass between cliffs at night',
  'no-sim': 'a worried figure sitting alone under a dim oil lamp late at night',
};

const ELEMENT_MOOD: Record<string, string> = {
  목: 'deep green and teal accents',
  화: 'vermilion red and warm amber accents',
  토: 'ochre yellow and warm earth accents',
  금: 'ivory white and silver-gold accents',
  수: 'indigo blue and ink-black accents',
};

interface Job {
  file: string;
  prompt: string;
  aspect: string;
  mp: string;
}

const jobs: Job[] = [
  ...CARD_DECK.map((card) => ({
    file: `cards/${card.id}.webp`,
    prompt: `${CARD_SUBJECTS[card.id]}, ${ELEMENT_MOOD[card.element]}${STYLE}`,
    aspect: '2:3',
    mp: '1',
  })),
  {
    file: 'card-back.webp',
    prompt: `an ornate circular golden lotus and cloud emblem centered on deep indigo, symmetric dancheong border pattern, fortune card back design${STYLE}`,
    aspect: '2:3',
    mp: '1',
  },
  {
    file: 'icon.png',
    prompt: `a circular app icon emblem: stylized fortune wheel with eight trigram marks, gold on deep indigo, centered${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/hero.webp',
    prompt: `a luminous full moon over hanok rooftops and distant mountains, gentle clouds, wide serene night scene${STYLE}`,
    aspect: '21:9',
    mp: '1',
  },
  // ── 홈 메뉴 썸네일 ──
  {
    file: 'illust/menu-card.webp',
    prompt: `several ornate golden fortune cards lying face-down fanned out on dark silk, glowing golden backs with lotus emblem, magical particles${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/menu-fortune.webp',
    prompt: `a golden sunrise breaking over mountain ridges, warm rays piercing morning mist and clouds${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/menu-saju.webp',
    prompt: `four glowing stone pillars of different heights standing in a row under stars, cosmic symbols floating above${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/menu-luck.webp',
    prompt: `a long winding river of molten gold seen from above, flowing through dark mountain valleys at night${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/menu-compat.webp',
    prompt: `two glowing crimson threads floating through the night air, gently intertwining and tying into a loose knot under a full moon, red thread of fate, romantic and delicate${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/menu-history.webp',
    prompt: `an old silk almanac scroll unrolling on a dark wooden desk beside an ink brush and a small brass moon-phase dial, warm candlelight, nostalgic archival mood${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/menu-sleep.webp',
    prompt: `a cozy dark room with a round window showing the moonlit night sky, a small cat sleeping curled on the windowsill, a candle flickering softly, dreamy calm${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  // ── 몽환 배경 레이어 ──
  {
    file: 'bg/moon.webp',
    prompt: `a large luminous full moon with a soft golden halo, centered, surrounded by faint glowing haze, on a pure black background, dreamy ethereal${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'bg/clouds-a.webp',
    prompt: `a long horizontal band of wispy translucent clouds drifting across a pure black background, thin silver-lit edges, soft and airy, wide seamless composition${STYLE}`,
    aspect: '21:9',
    mp: '0.25',
  },
  {
    file: 'bg/clouds-b.webp',
    prompt: `a long horizontal band of thin scattered cloud wisps and fog drifting across a pure black background, very faint silver glow, sparse and dreamy, wide seamless composition${STYLE}`,
    aspect: '21:9',
    mp: '0.25',
  },
  {
    file: 'bg/girl.webp',
    prompt: `the back-view silhouette of a young girl with long hair sitting by a large open window gazing up at the night sky, deep indigo room, moonlight rim light on her outline, window frame visible, the lower part fading into darkness, quiet wistful mood${STYLE}`,
    aspect: '9:16',
    mp: '1',
  },
  {
    file: 'illust/menu-moktak.webp',
    prompt: `a round wooden fish drum (moktak) resting on a silk cushion, warm polished wood with carved scales, golden glow, temple stillness${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/menu-necut.webp',
    prompt: `a vertical strip of four small framed folk paintings hanging on a dark wall, minhwa tiger and peony motifs in the frames, warm lantern light${STYLE}`,
    aspect: '1:1',
    mp: '0.25',
  },
  {
    file: 'illust/moktak.webp',
    prompt: `a large round wooden fish drum (moktak) seen from the front, centered on a round embroidered silk cushion, polished warm brown wood with carved fish scales and eyes, wooden striker stick resting beside it, dark temple night background, warm candle glow from below${STYLE}`,
    aspect: '1:1',
    mp: '1',
  },
  {
    file: 'illust/onboarding.webp',
    prompt: `a mystical night scene with a glowing eight-trigram cosmic wheel floating above clouds and a distant mountain, welcoming and wondrous${STYLE}`,
    aspect: '4:3',
    mp: '1',
  },
];

function loadKey(): string {
  const m = readFileSync('.env', 'utf-8').match(/^REPLICATE_API_TOKEN=(.+)$/m);
  if (!m?.[1]?.trim()) throw new Error('.env에 REPLICATE_API_TOKEN이 없습니다');
  return m[1].trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let token = '';

async function runPrediction(job: Job): Promise<string> {
  const res = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt: job.prompt,
        aspect_ratio: job.aspect,
        num_outputs: 1,
        num_inference_steps: 4,
        megapixels: job.mp,
        output_format: job.file.endsWith('.png') ? 'png' : 'webp',
        output_quality: 85,
        go_fast: true,
      },
    }),
  });
  let pred: { status?: string; output?: unknown; urls?: { get: string }; error?: string; retry_after?: number } = await res.json();
  if (res.status === 429) {
    const waitSec = Number(res.headers.get('retry-after')) || pred.retry_after || 10;
    await sleep(waitSec * 1000 + 500);
    return runPrediction(job);
  }
  if (!res.ok) throw new Error(`predict ${res.status}: ${JSON.stringify(pred).slice(0, 200)}`);

  const deadline = Date.now() + TIMEOUT_MS;
  while (pred.status && ['starting', 'queued', 'processing'].includes(pred.status)) {
    if (Date.now() > deadline) throw new Error('생성 시간 초과');
    await sleep(POLL_MS);
    pred = await (await fetch(pred.urls!.get, { headers: { Authorization: `Bearer ${token}` } })).json();
  }
  if (pred.status !== 'succeeded') throw new Error(`생성 실패: ${pred.status} ${pred.error ?? ''}`);
  return String(Array.isArray(pred.output) ? pred.output[0] : pred.output);
}

async function main() {
  token = loadKey();
  mkdirSync(join(OUT_DIR, 'cards'), { recursive: true });
  mkdirSync(join(OUT_DIR, 'illust'), { recursive: true });
  mkdirSync(join(OUT_DIR, 'bg'), { recursive: true });

  let done = 0, skipped = 0, failed = 0;
  for (const job of jobs) {
    const path = join(OUT_DIR, job.file);
    if (existsSync(path)) { skipped++; continue; }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const url = await runPrediction(job);
        writeFileSync(path, Buffer.from(await (await fetch(url)).arrayBuffer()));
        console.log(`✓ ${job.file}`);
        ok = true; done++;
      } catch (e) {
        console.warn(`✗ ${job.file} 시도 ${attempt}/3: ${e instanceof Error ? e.message : e}`);
        if (attempt < 3) await sleep(3000);
      }
    }
    if (!ok) failed++;
    await sleep(CALL_GAP_MS);
  }
  console.log(`\n완료 ${done}, 건너뜀 ${skipped}, 실패 ${failed} / 전체 ${jobs.length}`);
  if (failed) process.exit(1);
}

void main();
