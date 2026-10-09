/**
 * 결과 이미지 합성 — 사주 결과를 공유용 세로 카드 이미지로 렌더링한다.
 * 캔버스 1080×1350 (4:5 — 피드·스토리 모두 무난). 서버 없이 기기에서 생성.
 * 공유는 navigator.share(files) → 미지원이면 PNG 저장.
 */
import type { Grade } from './types.ts';

export interface ShareCardData {
  /** 상단 작은 라벨 — '오늘의 운세카드' 같은 맥락 */
  label?: string;
  /** 메인 제목 — 카드명·캐릭터명·궁합 등 */
  title: string;
  /** 제목 옆 한자/부제 */
  subtitle?: string;
  /** 크게 강조할 한 글자 (일간 한자·궁합 점수 등) */
  big?: string;
  /** big 글자 주위 글로우 색 */
  accent?: string;
  /** 중앙에 넣을 이미지 (카드 일러스트 등) — 없으면 big 텍스트만 */
  imageUrl?: string;
  /** 등급 뱃지 */
  grade?: Grade;
  /** 본문 줄들 */
  lines: string[];
  /** 해시태그·키워드 줄 */
  keywords?: string[];
}

const W = 1080;
const H = 1350;
const GOLD = '#c9a227';
const GOLD_BRIGHT = '#e8c766';
const HANJI = '#e8dcc0';

const GRADE_FILL: Record<Grade, string> = {
  대길: GOLD_BRIGHT, 길: GOLD, 평: HANJI, 흉: '#c8402a', 대흉: '#c8402a',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** 텍스트를 최대 폭에 맞춰 줄바꿈 — 줄 수를 돌려준다 */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxW && line) {
      out.push(line);
      line = ch === ' ' ? '' : ch;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}

async function render(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 배경 — 밤하늘 그래디언트 + 상단 달빛 글로우
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#07060d');
  bg.addColorStop(0.55, '#12101d');
  bg.addColorStop(1, '#0d0b14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, 340);
  glow.addColorStop(0, `${data.accent ?? GOLD}44`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 골드 이중 테두리
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  roundRect(ctx, 36, 36, W - 72, H - 72, 28);
  ctx.stroke();
  ctx.strokeStyle = `${GOLD}66`;
  ctx.lineWidth = 1;
  roundRect(ctx, 52, 52, W - 104, H - 104, 20);
  ctx.stroke();

  const font = '"Noto Serif KR", "Malgun Gothic", "Apple SD Gothic Neo", serif';
  ctx.textAlign = 'center';

  let y = 150;
  if (data.label) {
    ctx.fillStyle = `${HANJI}99`;
    ctx.font = `400 30px ${font}`;
    ctx.fillText(data.label, W / 2, y);
    y += 60;
  }

  // 중앙 비주얼 — 이미지 or big 글자
  if (data.imageUrl) {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = data.imageUrl!;
    });
    const iw = 420;
    const ih = (img.naturalHeight / img.naturalWidth) * iw;
    const ix = (W - iw) / 2;
    // 이미지 뒤 글로우
    const ig = ctx.createRadialGradient(W / 2, y + ih / 2, 0, W / 2, y + ih / 2, ih * 0.75);
    ig.addColorStop(0, `${data.accent ?? GOLD}55`);
    ig.addColorStop(1, 'transparent');
    ctx.fillStyle = ig;
    ctx.fillRect(0, y - 80, W, ih + 160);
    ctx.save();
    roundRect(ctx, ix, y, iw, ih, 18);
    ctx.clip();
    ctx.drawImage(img, ix, y, iw, ih);
    ctx.restore();
    ctx.strokeStyle = `${data.accent ?? GOLD}aa`;
    ctx.lineWidth = 2;
    roundRect(ctx, ix, y, iw, ih, 18);
    ctx.stroke();
    y += ih + 66;
  } else if (data.big) {
    const g = ctx.createRadialGradient(W / 2, y + 130, 0, W / 2, y + 130, 220);
    g.addColorStop(0, `${data.accent ?? GOLD}55`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 60, W, 380);
    ctx.fillStyle = data.accent ?? GOLD_BRIGHT;
    ctx.font = `700 240px ${font}`;
    ctx.shadowColor = `${data.accent ?? GOLD}88`;
    ctx.shadowBlur = 60;
    ctx.fillText(data.big, W / 2, y + 250);
    ctx.shadowBlur = 0;
    y += 330;
  }

  // 등급 뱃지
  if (data.grade) {
    ctx.font = `700 40px ${font}`;
    const gw = ctx.measureText(data.grade).width + 64;
    ctx.fillStyle = '#0d0b14';
    ctx.strokeStyle = GRADE_FILL[data.grade];
    ctx.lineWidth = 2;
    roundRect(ctx, (W - gw) / 2, y, gw, 66, 33);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = GRADE_FILL[data.grade];
    ctx.fillText(data.grade, W / 2, y + 46);
    y += 108;
  }

  // 제목
  ctx.fillStyle = HANJI;
  ctx.font = `700 72px ${font}`;
  ctx.fillText(data.title, W / 2, y + 20);
  y += 72;
  if (data.subtitle) {
    ctx.fillStyle = `${HANJI}88`;
    ctx.font = `400 34px ${font}`;
    ctx.fillText(data.subtitle, W / 2, y);
    y += 44;
  }

  // 본문 — 가운데 정렬 줄바꿈
  ctx.font = `400 34px ${font}`;
  ctx.fillStyle = `${HANJI}cc`;
  y += 40;
  for (const line of data.lines) {
    for (const wrapped of wrapLines(ctx, line, W - 240)) {
      ctx.fillText(wrapped, W / 2, y);
      y += 54;
    }
    y += 12;
  }

  // 키워드 칩
  if (data.keywords?.length) {
    y += 24;
    ctx.font = `400 28px ${font}`;
    const chips = data.keywords.map((k) => `#${k}`);
    const chipW = chips.map((c) => ctx.measureText(c).width + 36);
    let cx = (W - (chipW.reduce((a, b) => a + b, 0) + (chips.length - 1) * 16)) / 2;
    chips.forEach((c, i) => {
      const w = chipW[i]!;
      ctx.strokeStyle = `${GOLD}88`;
      ctx.lineWidth = 1.5;
      roundRect(ctx, cx, y - 36, w, 56, 28);
      ctx.stroke();
      ctx.fillStyle = GOLD_BRIGHT;
      ctx.fillText(c, cx + w / 2, y);
      cx += w + 16;
    });
  }

  // 푸터 — 앱 표시
  ctx.fillStyle = `${HANJI}55`;
  ctx.font = `400 26px ${font}`;
  ctx.fillText('사주 · 나를 보는 밤', W / 2, H - 110);
  ctx.fillStyle = `${GOLD}77`;
  ctx.font = `500 24px ${font}`;
  ctx.fillText('holoolook-del.github.io/sajoo', W / 2, H - 72);

  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('canvas 실패'))), 'image/png'),
  );
}

/**
 * 결과 이미지를 생성해 공유한다. 파일 공유 미지원이면 PNG 저장.
 * text·url을 넘기면 이미지와 함께 한 번에 공유된다 (카톡 등).
 */
export async function shareImageResult(
  data: ShareCardData,
  extra?: { text?: string; url?: string },
): Promise<'shared' | 'saved' | 'failed'> {
  try {
    const blob = await render(data);
    const file = new File([blob], 'saju-result.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        ...(extra?.text ? { text: extra.text } : {}),
        ...(extra?.url ? { url: extra.url } : {}),
      });
      return 'shared';
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saju-result.png';
    a.click();
    URL.revokeObjectURL(url);
    return 'saved';
  } catch {
    return 'failed';
  }
}
