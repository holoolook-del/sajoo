/**
 * Web Audio API 합성 효과음 — 외부 파일 없이 코드로 생성 (오프라인·용량 0).
 * AudioContext는 첫 사용자 제스처(클릭) 안에서 생성되므로 자동재생 정책에 걸리지 않는다.
 * 음색은 삼각파+배음으로 따뜻하게, 마스터 게인으로 볼륨 확보.
 */

const KEY = 'sajoo:sound';
let ctx: AudioContext | null = null;
let out: GainNode | null = null;

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* 저장 불가 시 무시 */
  }
}

function audio(): AudioContext | null {
  if (!isSoundEnabled()) return null;
  try {
    ctx ??= new AudioContext();
    if (!out) {
      out = ctx.createGain();
      out.gain.value = 0.9;
      out.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 종·하프 계열 — 삼각파 본음 + 옥타브 배음, 어택~지수 감쇠 */
function bell(ac: AudioContext, freq: number, at: number, dur = 0.9, gain = 0.25) {
  if (!out) return;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(gain, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  g.connect(out);
  const base = ac.createOscillator();
  base.type = 'triangle';
  base.frequency.value = freq;
  base.connect(g);
  const oct = ac.createOscillator();
  const og = ac.createGain();
  oct.type = 'sine';
  oct.frequency.value = freq * 2;
  og.gain.value = 0.35;
  oct.connect(og).connect(g);
  base.start(at);
  oct.start(at);
  base.stop(at + dur);
  oct.stop(at + dur);
}

/** 노이즈 버스트 — 타격·공개 임팩트용 */
function noiseHit(ac: AudioContext, at: number, dur: number, from: number, to: number, gain = 0.4) {
  if (!out) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(to, at + dur);
  f.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(out);
  src.start(at);
}

/** 저음 임팩트 — 주파수가 떨어지는 사인파 드롭 */
function boom(ac: AudioContext, at: number) {
  if (!out) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(170, at);
  o.frequency.exponentialRampToValueAtTime(45, at + 0.3);
  g.gain.setValueAtTime(0.55, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + 0.5);
}

/** 상승 라이저 — 충전(기 모으기) 효과 */
function riser(ac: AudioContext, at: number, dur = 0.85) {
  if (!out) return;
  const o = ac.createOscillator();
  const f = ac.createBiquadFilter();
  const g = ac.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(160, at);
  o.frequency.exponentialRampToValueAtTime(1500, at + dur);
  f.type = 'lowpass';
  f.frequency.setValueAtTime(400, at);
  f.frequency.exponentialRampToValueAtTime(6000, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.16, at + dur * 0.75);
  g.gain.linearRampToValueAtTime(0.0001, at + dur + 0.05);
  o.connect(f).connect(g).connect(out);
  o.start(at);
  o.stop(at + dur + 0.1);
}

/** 카드 선택 — 반짝이는 3음 아르페지오 (C6→G6→C7) */
export function playCardPick(): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  bell(ac, 1046.5, t, 0.5, 0.2);
  bell(ac, 1568, t + 0.07, 0.6, 0.18);
  bell(ac, 2093, t + 0.14, 0.8, 0.15);
  noiseHit(ac, t, 0.2, 4000, 8000, 0.08);
}

/** 카드 충전 — 뽑힌 카드가 기를 모으는 동안의 라이저 */
export function playCardCharge(): void {
  const ac = audio();
  if (!ac) return;
  riser(ac, ac.currentTime);
}

/** 카드 공개 — 저음 임팩트 + 장조 팡파레 (E5·A5 → C#6·E6·A6 → A장조 화음) */
export function playCardReveal(): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  boom(ac, t);
  noiseHit(ac, t, 0.35, 2000, 9000, 0.2);
  bell(ac, 659.25, t + 0.05, 0.6, 0.22);
  bell(ac, 880, t + 0.18, 0.7, 0.24);
  bell(ac, 1108.73, t + 0.34, 0.8, 0.2);
  bell(ac, 1318.51, t + 0.46, 0.9, 0.2);
  bell(ac, 1760, t + 0.58, 1.3, 0.22);
  // 지속 화음 (A3·C#4·E4·A4)
  for (const n of [220, 277.18, 329.63, 440]) {
    bell(ac, n, t + 0.55, 1.5, 0.1);
  }
}
