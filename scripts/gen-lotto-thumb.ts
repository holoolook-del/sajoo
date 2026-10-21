/**
 * 로또 메뉴 썸네일 1회 생성 — Replicate 대신 로컬 Canvas 렌더링
 * (번호 공은 프로그램으로 그리는 게 AI 생성보다 정확하고 무료).
 * 출력: public/assets/illust/menu-lotto.webp → 번들·프리캐시 포함.
 * 실행: pnpm gen:lotto:thumb  (Playwright devDependency 사용)
 */
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const OUT = 'public/assets/illust/menu-lotto.webp';
const W = 640;
const H = 384; // 16:9-ish — 다른 메뉴 썸네일 비율과 통일

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
// esbuild가 주입하는 __name 헬퍼가 브라우저에 없어 evaluate(함수)는 못 씀 → HTML+문자열 스크립트로
await page.setContent(`<canvas id="cv" width="${W}" height="${H}"></canvas><script>
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const w = ${W}, h = ${H};

const bg = ctx.createLinearGradient(0, 0, 0, h);
bg.addColorStop(0, '#0d0b16');
bg.addColorStop(0.55, '#1a1628');
bg.addColorStop(1, '#241d33');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, w, h);

for (let i = 0; i < 70; i++) {
  const x = Math.random() * w, y = Math.random() * h * 0.7;
  ctx.fillStyle = 'rgba(255,240,200,' + (0.15 + Math.random() * 0.5) + ')';
  ctx.beginPath();
  ctx.arc(x, y, Math.random() * 1.4 + 0.3, 0, Math.PI * 2);
  ctx.fill();
}

const glow = ctx.createRadialGradient(w / 2, h * 0.62, 10, w / 2, h * 0.62, w * 0.5);
glow.addColorStop(0, 'rgba(232,199,102,0.35)');
glow.addColorStop(1, 'rgba(232,199,102,0)');
ctx.fillStyle = glow;
ctx.fillRect(0, 0, w, h);

const ballColor = (n) => n <= 10 ? '#f2b720' : n <= 20 ? '#5aa0e6' : n <= 30 ? '#e05a4e' : n <= 40 ? '#9b9ba4' : '#7bc75a';
const nums = [7, 13, 22, 29, 34, 41];
const r = 44, gap = 14, y = h * 0.62;
const totalW = nums.length * r * 2 + (nums.length - 1) * gap;
nums.forEach((n, i) => {
  const x = w / 2 - totalW / 2 + r + i * (r * 2 + gap);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + r + 6, r * 0.85, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, ballColor(n));
  g.addColorStop(1, ballColor(n));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.55, r * 0.8, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + (r * 0.95) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillText(String(n), x, y + 2);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
});

ctx.strokeStyle = 'rgba(232,199,102,0.55)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(w * 0.28, h * 0.2);
ctx.lineTo(w * 0.72, h * 0.2);
ctx.stroke();
ctx.fillStyle = 'rgba(232,199,102,0.8)';
ctx.beginPath();
ctx.arc(w / 2, h * 0.2, 5, 0, Math.PI * 2);
ctx.fill();
</script>`);

const dataUrl = (await page.evaluate(
  "document.getElementById('cv').toDataURL('image/webp', 0.92)",
)) as string;
await browser.close();
writeFileSync(OUT, Buffer.from(dataUrl.split(',')[1]!, 'base64'));
console.log(`썸네일 생성 → ${OUT}`);
