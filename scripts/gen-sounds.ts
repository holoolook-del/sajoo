/**
 * 효과음 WAV 합성 스크립트 — 개발 시 1회 실행해 public/assets/audio/*.wav 생성.
 * Web Audio 런타임 합성은 인앱 브라우저(카톡 웹뷰 등)에서 AudioContext가 잠겨
 * 무음이 되는 경우가 있어, HTMLAudioElement가 재생할 실제 파일로 미리 렌더한다.
 * 실행: pnpm gen:sounds
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SR = 22050; // 샘플레이트 — 효과음 용도로 충분하고 용량 절반
const OUT_DIR = 'public/assets/audio';
const TAU = Math.PI * 2;

const sec = (s: number) => Math.floor(s * SR);

/** 종·하프 계열 — 사인 본음 + 옥타브·4옥타브 배음, 어택 후 지수 감쇠 */
function bell(buf: Float32Array, freq: number, at: number, dur: number, gain: number) {
  const start = sec(at);
  const n = sec(dur);
  for (let i = 0; i < n; i++) {
    const j = start + i;
    if (j >= buf.length) break;
    const t = i / SR;
    const env = Math.min(t / 0.006, 1) * Math.exp((-3.6 * t) / dur);
    const v =
      Math.sin(TAU * freq * t) +
      0.32 * Math.sin(TAU * freq * 2 * t) +
      0.1 * Math.sin(TAU * freq * 4 * t);
    buf[j] = (buf[j] ?? 0) + gain * env * v;
  }
}

/** 노이즈 — hp=true면 차분으로 고역 반짝임, 아니면 백색소음 감쇠 */
function noise(buf: Float32Array, at: number, dur: number, gain: number, hp: boolean) {
  const start = sec(at);
  const n = sec(dur);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const j = start + i;
    if (j >= buf.length) break;
    const t = i / SR;
    const w = Math.random() * 2 - 1;
    const v = hp ? (w - prev) * 0.7 : w * 0.5;
    prev = w;
    buf[j] = (buf[j] ?? 0) + gain * Math.exp((-6 * t) / dur) * v;
  }
}

/** 저음 임팩트 — 주파수가 170→45Hz로 떨어지는 사인 드롭 */
function boom(buf: Float32Array, at: number, dur: number, gain: number) {
  const start = sec(at);
  const n = sec(dur);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const j = start + i;
    if (j >= buf.length) break;
    const t = i / SR;
    const f = 45 + (170 - 45) * Math.exp(-9 * t);
    phase += (TAU * f) / SR;
    buf[j] = (buf[j] ?? 0) + gain * Math.exp((-5.5 * t) / dur) * Math.sin(phase);
  }
}

/** 상승 라이저 — 톱니파 160→1500Hz + 원폴 로우패스가 점점 열림 */
function riser(buf: Float32Array, at: number, dur: number, gain: number) {
  const start = sec(at);
  const n = sec(dur);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const j = start + i;
    if (j >= buf.length) break;
    const t = i / SR;
    const k = t / dur;
    const f = 160 * Math.pow(1500 / 160, k);
    phase += (TAU * f) / SR;
    const saw = 2 * (((phase / TAU) % 1) + 1) % 2 - 1; // 랩된 톱니파
    const a = 0.02 + 0.55 * Math.pow(k, 1.6); // 필터 개방
    lp += a * (saw - lp);
    const env = Math.min(1, t / (dur * 0.55)) * Math.pow(1 - k, 0.7);
    buf[j] = (buf[j] ?? 0) + gain * env * lp;
  }
}

/** 피크 정규화 후 PCM16 WAV로 쓰기 */
function writeWav(name: string, buf: Float32Array) {
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const scale = peak > 0 ? 0.92 / peak : 1;

  const n = buf.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + n * 2, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(n * 2, 40);

  const pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, (buf[i] ?? 0) * scale));
    pcm.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  writeFileSync(join(OUT_DIR, name), Buffer.concat([header, pcm]));
  console.log(`  ✓ ${name} (${(n / SR).toFixed(2)}s, ${((44 + n * 2) / 1024).toFixed(0)}KB)`);
}

mkdirSync(OUT_DIR, { recursive: true });
console.log('효과음 합성 중…');

// pick.wav — 반짝이는 3음 아르페지오 (C6→G6→C7) + 고역 반짝임
{
  const buf = new Float32Array(sec(0.9));
  bell(buf, 1046.5, 0, 0.5, 0.5);
  bell(buf, 1568, 0.07, 0.6, 0.45);
  bell(buf, 2093, 0.14, 0.7, 0.4);
  noise(buf, 0, 0.15, 0.1, true);
  writeWav('pick.wav', buf);
}

// charge.wav — 기 모으는 상승 라이저 (카드 연출 CHARGE_MS와 동일한 0.95초)
{
  const buf = new Float32Array(sec(1.0));
  riser(buf, 0, 0.9, 0.5);
  noise(buf, 0.5, 0.4, 0.06, true);
  writeWav('charge.wav', buf);
}

// reveal.wav — 저음 임팩트 + 장조 상승 팡파레 + 지속 화음
{
  const buf = new Float32Array(sec(2.0));
  boom(buf, 0, 0.45, 0.85);
  noise(buf, 0.02, 0.3, 0.3, true);
  bell(buf, 659.25, 0.05, 0.6, 0.45); // E5
  bell(buf, 880, 0.18, 0.7, 0.5); // A5
  bell(buf, 1108.73, 0.34, 0.8, 0.42); // C#6
  bell(buf, 1318.51, 0.46, 0.9, 0.42); // E6
  bell(buf, 1760, 0.58, 1.3, 0.45); // A6
  for (const n of [220, 277.18, 329.63, 440]) bell(buf, n, 0.55, 1.4, 0.16); // A장조 화음
  writeWav('reveal.wav', buf);
}

// knock.wav — 목탁 "톡": 속 빈 나무 공명(600Hz 본음+배음, 매우 빠른 감쇠) + 타격 클릭
{
  const buf = new Float32Array(sec(0.5));
  const start = 0;
  const n = sec(0.35);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t / 0.045); // 목탁은 여운이 짧다
    const v =
      Math.sin(TAU * 620 * t) +
      0.45 * Math.sin(TAU * 620 * 2.4 * t) + // 비정수 배음 — 나무통 울림
      0.2 * Math.sin(TAU * 620 * 4.1 * t);
    buf[start + i] = 0.7 * env * v;
  }
  noise(buf, 0, 0.03, 0.5, true); // 막대가 닿는 클릭
  writeWav('knock.wav', buf);
}

console.log('완료 — public/assets/audio/');
