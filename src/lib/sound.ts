/**
 * 효과음 재생 — 미리 합성된 WAV를 HTMLAudioElement로 재생한다.
 * Web Audio 런타임 합성은 인앱 브라우저(카톡 웹뷰 등)에서 AudioContext가
 * 잠겨 무음이 되는 경우가 있어 파일 재생 방식을 쓴다 (scripts/gen-sounds.ts로 생성).
 * iOS·웹뷰 정책 대응: 첫 클릭 제스처 안에서 나머지 사운드를 무음 재생해 언락한다.
 */

const KEY = 'sajoo:sound';
const BASE = import.meta.env.BASE_URL;
const FILES = {
  pick: 'pick.wav',
  charge: 'charge.wav',
  reveal: 'reveal.wav',
  knock: 'knock.wav',
} as const;
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

/**
 * 사용자 제스처 안에서 나중에 자동 재생될 사운드만 무음으로 미리 재생해 권한을 연다.
 * 주의: 같은 제스처 안에서 곧바로 재생될 사운드를 프라임하면 muted 상태로 재생되다가
 * 프라임의 pause가 진짜 재생을 잘라먹는다 — '지금 재생할 것'과 '나중에 재생될 것'을 구분한다.
 */
function prime(keys: SoundKey[]): void {
  if (unlocked) return;
  unlocked = true;
  for (const k of keys) {
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

/** 카드 선택 — 반짝이는 아르페지오. 제스처 안에서 pick·charge는 직접 재생하고 reveal만 언락한다 */
export function playCardPick(): void {
  prime(['reveal']);
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

/** 목탁 타격 — 짧은 나무 노크. 탭 제스처 안에서 재생되므로 프라임 불필요 */
export function playKnock(): void {
  play('knock');
}
