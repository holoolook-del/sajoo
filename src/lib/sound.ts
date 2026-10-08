/**
 * 효과음 재생 — 미리 합성된 WAV를 HTMLAudioElement로 재생한다.
 * Web Audio 런타임 합성은 인앱 브라우저(카톡 웹뷰 등)에서 AudioContext가
 * 잠겨 무음이 되는 경우가 있어 파일 재생 방식을 쓴다 (scripts/gen-sounds.ts로 생성).
 * iOS·웹뷰 정책 대응: 첫 클릭 제스처 안에서 나머지 사운드를 무음 재생해 언락한다.
 */

const KEY = 'sajoo:sound';
const BASE = import.meta.env.BASE_URL;
const FILES = { pick: 'pick.wav', charge: 'charge.wav', reveal: 'reveal.wav' } as const;
type SoundKey = keyof typeof FILES;

const els = new Map<SoundKey, HTMLAudioElement>();
let unlocked = false;

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

function el(key: SoundKey): HTMLAudioElement {
  let a = els.get(key);
  if (!a) {
    a = new Audio(`${BASE}assets/audio/${FILES[key]}`);
    a.preload = 'auto';
    els.set(key, a);
  }
  return a;
}

function play(key: SoundKey): void {
  if (!isSoundEnabled()) return;
  const a = el(key);
  a.currentTime = 0;
  void a.play().catch(() => {});
}

/** 사용자 제스처 안에서 나머지 사운드를 무음으로 한 번 재생해 재생 권한을 연다 */
function primeOthers(except: SoundKey): void {
  if (unlocked) return;
  unlocked = true;
  for (const k of Object.keys(FILES) as SoundKey[]) {
    if (k === except) continue;
    const a = el(k);
    a.muted = true;
    void a
      .play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
      })
      .catch(() => {
        a.muted = false;
      });
  }
}

/** 카드 선택 — 반짝이는 아르페지오. 클릭 제스처 안에서 나머지도 언락한다 */
export function playCardPick(): void {
  primeOthers('pick');
  play('pick');
}

/** 카드 충전 — 기 모으는 라이저 */
export function playCardCharge(): void {
  play('charge');
}

/** 카드 공개 — 임팩트 + 팡파레 */
export function playCardReveal(): void {
  play('reveal');
}
