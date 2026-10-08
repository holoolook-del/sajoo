import { useEffect, useRef, useState } from 'react';
import { BackHome } from '../components/back-home.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { SoundToggle } from '../components/sound-toggle.tsx';
import { setBgm, type BgmKey } from '../lib/sound.ts';

interface Track {
  key: BgmKey;
  name: string;
  desc: string;
  /** 타일 장식 색 — 밤 팔레트 안에서 트랙 성격만 구분 */
  hue: string;
}

const TRACKS: Track[] = [
  { key: 'rain', name: '밤비', desc: '창가에 내리는 잔잔한 빗소리', hue: 'from-[#1c2a4a] to-night-soft' },
  { key: 'waves', name: '파도', desc: '해변에 밀려오는 진짜 물결', hue: 'from-[#14303c] to-night-soft' },
  { key: 'fire', name: '모닥불', desc: '타닥타닥 타는 장작 소리', hue: 'from-[#3a1e10] to-night-soft' },
  { key: 'forest', name: '밤의 숲', desc: '귀뚜라미 우는 한여름 밤', hue: 'from-[#12261e] to-night-soft' },
  { key: 'dream', name: '몽환 멜로디', desc: 'Kevin MacLeod — Dreamy Flashback', hue: 'from-[#2c2440] to-night-soft' },
  { key: 'epic', name: '웅장한 밤', desc: 'Kevin MacLeod — Ossuary 6: Air', hue: 'from-[#241a38] to-night-soft' },
];

/** 수면 타이머 선택지(분) — 0은 타이머 없음 */
const TIMERS = [0, 15, 30, 60] as const;

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function SleepPage() {
  const [current, setCurrent] = useState<BgmKey | null>(null);
  const [timerMin, setTimerMin] = useState(0); // 0 = 타이머 없음
  const [remain, setRemain] = useState<number | null>(null); // 남은 초
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null); // 카운트다운 표시
  const expireRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 실제 정지

  // 페이지를 떠나면 기본 BGM으로 복귀 (타이머도 정리)
  useEffect(() => {
    return () => {
      setBgm('bgm');
      if (tickRef.current) clearInterval(tickRef.current);
      if (expireRef.current) clearTimeout(expireRef.current);
    };
  }, []);

  const stopTimer = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (expireRef.current) clearTimeout(expireRef.current);
    tickRef.current = null;
    expireRef.current = null;
    setTimerMin(0);
    setRemain(null);
  };

  const startTimer = (minutes: number) => {
    stopTimer();
    if (minutes === 0) return;
    setTimerMin(minutes);
    setRemain(minutes * 60);
    tickRef.current = setInterval(() => {
      setRemain((r) => (r !== null && r > 0 ? r - 1 : r));
    }, 1000);
    // 만료 콜백 — 재생을 완전히 멈춘다 (기본 BGM으로도 돌아가지 않음)
    expireRef.current = setTimeout(() => {
      setBgm(null);
      setCurrent(null);
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      expireRef.current = null;
      setTimerMin(0);
      setRemain(null);
    }, minutes * 60 * 1000);
  };

  const toggle = (key: BgmKey) => {
    if (current === key) {
      setBgm(null);
      setCurrent(null);
      return;
    }
    setBgm(key); // 탭이 곧 제스처 — syncBgm이 이 안에서 바로 재생 시도
    setCurrent(key);
  };

  const currentName = TRACKS.find((t) => t.key === current)?.name;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="pt-6">
        <div className="flex items-center justify-between">
          <BackHome />
          <SoundToggle />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gold">숙면 사운드</h1>
        <p className="mt-1 text-sm text-hanji/60">
          잠이 올 때까지 틀어두는 밤의 소리 — 타이머를 걸어두면 알아서 꺼집니다
        </p>
      </header>

      {/* 트랙 목록 — 탭으로 재생/정지, 한 번에 하나만 */}
      <section className="grid grid-cols-2 gap-3" aria-label="사운드 목록">
        {TRACKS.map((t) => {
          const playing = current === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => toggle(t.key)}
              aria-pressed={playing}
              className={`rounded-xl border p-4 text-left transition-colors ${
                playing
                  ? 'border-gold/70 bg-gradient-to-b shadow-[0_0_20px_rgba(201,162,39,0.2)] ' + t.hue
                  : 'border-hanji/15 bg-night-soft hover:border-gold/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-hanji">{t.name}</p>
                {playing && (
                  <span className="flex items-end gap-0.5" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-0.5 animate-pulse rounded-full bg-gold-bright"
                        style={{ height: `${10 + i * 4}px`, animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-4 text-hanji/50">{t.desc}</p>
            </button>
          );
        })}
      </section>

      {/* 수면 타이머 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-hanji">자동 끄기</p>
          {remain !== null && (
            <p className="text-sm tabular-nums text-gold-bright">{fmt(remain)} 후 꺼짐</p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          {TIMERS.map((m) => {
            const active = timerMin === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => startTimer(m)}
                className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${
                  active
                    ? 'border-gold/60 bg-gold/10 text-gold-bright'
                    : 'border-hanji/15 text-hanji/60 hover:border-gold/40'
                }`}
              >
                {m === 0 ? '계속 재생' : `${m}분`}
              </button>
            );
          })}
        </div>
      </section>

      <p className="text-center text-xs text-hanji/40">
        {currentName ? `지금 「${currentName}」 재생 중` : '소리를 골라서 눌러보세요 — 다시 누르면 멈춥니다'}
      </p>

      <ShareButton
        label="친구에게 추천하기"
        text="잠 안 올 때 듣는 밤의 소리 모음 — 빗소리·파도·모닥불·몽환 멜로디\n사주 앱인데 수면음악까지 있어"
      />

      <footer className="text-center text-[10px] leading-4 text-hanji/30">
        음원 출처 — 비: Ylmir(CC0) · 파도: Wikimedia Commons(CC BY-SA 4.0) · 모닥불: qubodup(CC BY 3.0)
        · 숲: Wolfgang_(CC0) · 음악: Kevin MacLeod incompetech.com(CC BY 3.0)
      </footer>
    </main>
  );
}
