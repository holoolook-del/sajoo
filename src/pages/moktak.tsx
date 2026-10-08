import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShareButton } from '../components/share-button.tsx';
import { SoundToggle } from '../components/sound-toggle.tsx';
import { playKnock } from '../lib/sound.ts';
import { todayKST } from '../lib/date.ts';

const A = import.meta.env.BASE_URL;
const KEY = 'sajoo:moktak';

interface Count {
  total: number;
  date: string;
  today: number;
}

function load(): Count {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw) as Count;
      if (c.date === todayKST()) return c;
      return { total: c.total, date: todayKST(), today: 0 };
    }
  } catch {
    /* 파손된 저장값은 초기화 */
  }
  return { total: 0, date: todayKST(), today: 0 };
}

/** 공덕 마일스톤 — 도달할 때마다 축하 문구 */
const MILESTONES: [number, string][] = [
  [1080, '공덕 1,080 — 번뇌 열 번을 넘어섰습니다. 경지에 이르렀습니다.'],
  [540, '공덕 540 — 번뇌 다섯 바퀴를 넘겼습니다. 마음이 맑아집니다.'],
  [108, '공덕 108 — 백팔번뇌 소멸! 오늘 하루 번뇌가 떨어져 나갔습니다.'],
  [54, '공덕 54 — 백팔번뇌의 절반을 지웠습니다.'],
  [21, '공덕 21 — 마음이 고요해지기 시작합니다.'],
  [7, '공덕 7 — 일곱 번의 공덕, 소원이 향기를 얻습니다.'],
];

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function MoktakPage() {
  const [count, setCount] = useState<Count>(load);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [squash, setSquash] = useState(false);
  const idRef = useRef(0);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(count));
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [count]);

  const tap = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      playKnock();
      const rect = e.currentTarget.getBoundingClientRect();
      const id = ++idRef.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipples((r) => [...r.slice(-7), { id, x, y }]);
      setSquash(true);
      setTimeout(() => setSquash(false), 110);
      setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 700);

      const next = { total: count.total + 1, date: count.date, today: count.today + 1 };
      setCount(next);
      const hit = MILESTONES.find(([n]) => next.total === n);
      if (hit) {
        setMessage(hit[1]);
        if (msgTimer.current) clearTimeout(msgTimer.current);
        msgTimer.current = setTimeout(() => setMessage(null), 4000);
      }
    },
    [count],
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="pt-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-hanji/50">← 홈</Link>
          <SoundToggle />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gold">공덕 목탁</h1>
        <p className="mt-1 text-sm text-hanji/60">두드릴수록 마음이 맑아집니다</p>
      </header>

      <section className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={tap}
          aria-label="목탁 두드리기"
          className="relative w-full max-w-xs cursor-pointer select-none overflow-visible rounded-full outline-none"
        >
          <img
            src={`${A}assets/illust/moktak.webp`}
            alt="목탁"
            draggable={false}
            className={`w-full rounded-full border-2 border-gold/30 shadow-[0_0_40px_rgba(201,162,39,0.15)] transition-transform duration-100 ${
              squash ? 'scale-95' : 'scale-100'
            }`}
          />
          {/* 탭 위치에 퍼지는 물결 */}
          {ripples.map((r) => (
            <span
              key={r.id}
              className="pointer-events-none absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-2 border-gold-bright/70"
              style={{ left: r.x, top: r.y }}
            />
          ))}
        </button>

        <div className="text-center">
          <p className="text-5xl font-bold tabular-nums text-gold-bright">{count.today.toLocaleString()}</p>
          <p className="mt-1 text-xs text-hanji/50">오늘의 공덕 · 누적 {count.total.toLocaleString()}</p>
        </div>

        <div className="flex h-14 w-full items-center justify-center">
          {message ? (
            <p className="rounded-xl border border-gold/50 bg-night-soft px-4 py-2.5 text-center text-sm text-gold-bright shadow-[0_0_20px_rgba(201,162,39,0.2)]">
              {message}
            </p>
          ) : (
            <p className="text-xs text-hanji/40">목탁을 두드려 공덕을 쌓으세요</p>
          )}
        </div>

        <ShareButton
          label="공덕 자랑하기"
          text={`나 오늘 목탁으로 공덕 ${count.today.toLocaleString()}번 쌓았어 (누적 ${count.total.toLocaleString()}번)\n번뇌가 톡톡 사라지는 중 — 너도 두드려봐!`}
        />
      </section>
    </main>
  );
}
