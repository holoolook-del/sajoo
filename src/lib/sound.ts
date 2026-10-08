/**
 * Web Audio API 합성 효과음 — 외부 파일 없이 코드로 생성 (오프라인·용량 0).
 * AudioContext는 첫 사용자 제스처(클릭) 안에서 생성되므로 자동재생 정책에 걸리지 않는다.
 */

const KEY = 'sajoo:sound';
let ctx: AudioContext | null = null;

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
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 종소리 계열 — 사인파 + 옥타브 배음, 지수 감쇠 */
function bell(ac: AudioContext, freq: number, at: number, dur = 0.6, gain = 0.18) {
  for (const [mult, vol] of [
    [1, 1],
    [2.76, 0.25],
  ] as const) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    g.gain.setValueAtTime(gain * vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(ac.destination);
    o.start(at);
    o.stop(at + dur);
  }
}

/** 휙 — 백색소음을 밴드패스로 스윕 */
function whoosh(ac: AudioContext, at: number, dur = 0.35) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(400, at);
  f.frequency.exponentialRampToValueAtTime(3200, at + dur);
  f.Q.value = 1.2;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.35, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(at);
}

/** 카드 선택 — 짧은 종소리 두 울림 (오행 느낌의 상승) */
export function playCardPick(): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  bell(ac, 660, t, 0.5, 0.14);
  bell(ac, 990, t + 0.09, 0.7, 0.12);
}

/** 카드 공개 — 휙 + 오음계 팡파레 */
export function playCardReveal(): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  whoosh(ac, t, 0.3);
  // 라 계열 오음계 상승 (A C# E F# A) — 팡파레
  const notes = [440, 554.37, 659.25, 739.99, 880];
  notes.forEach((n, i) => bell(ac, n, t + 0.25 + i * 0.08, 0.9, 0.1));
}
