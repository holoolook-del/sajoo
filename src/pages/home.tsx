import { Link, Navigate } from 'react-router-dom';
import { SoundToggle } from '../components/sound-toggle.tsx';
import { todaysDraw } from '../features/card/draw.ts';
import { todayKST } from '../lib/date.ts';
import { hasProfile } from '../lib/storage.ts';

const A = import.meta.env.BASE_URL;

const MENUS = [
  { to: '/fortune', img: 'menu-fortune', title: '오늘의 운세 보기', desc: '일진이 들려주는 하루의 기운' },
  { to: '/saju', img: 'menu-saju', title: '내 사주팔자', desc: '네 개의 기둥으로 읽는 타고난 나' },
  { to: '/luck', img: 'menu-luck', title: '대운 · 세운 · 월운', desc: '10년의 흐름과 올해의 운세' },
  { to: '/compat', img: 'menu-compat', title: '궁합 보기', desc: '두 사람의 기운이 만나는 점' },
  { to: '/history', img: 'menu-history', title: '지난 30일의 기록', desc: '지나온 하루하루의 운과 카드' },
  // 심심풀이 — 기록 다음에 이어지는 가벼운 놀이 메뉴
  { to: '/moktak', img: 'menu-moktak', title: '공덕 목탁', desc: '두드릴수록 번뇌가 사라지는 소리' },
  { to: 'https://holoolook-del.github.io/necut/', img: 'menu-necut', title: '민화네컷', desc: '내 사진이 민화가 되는 네 컷' },
];

export function HomePage() {
  if (!hasProfile()) {
    return <Navigate to="/onboarding" replace />;
  }
  const hasCardDrawn = todaysDraw() !== null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-5 pb-8">
      <header className="relative overflow-hidden rounded-2xl border border-gold/30">
        <img
          src={`${A}assets/illust/hero.webp`}
          alt=""
          className="h-48 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-center">
          <h1 className="text-3xl font-bold tracking-wide text-gold drop-shadow-[0_0_12px_rgba(201,162,39,0.4)]">
            SAJOO
          </h1>
          <p className="mt-1 text-xs text-hanji/70">밤하늘 아래 펼쳐지는 나만의 운세 이야기</p>
        </div>
      </header>

      <div className="flex items-center justify-center gap-3">
        <p className="text-xs text-hanji/50">{todayKST()}</p>
        <SoundToggle />
      </div>

      <Link
        to="/card"
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-gold/50 bg-night-soft p-4 shadow-[0_0_24px_rgba(201,162,39,0.18)] transition-shadow hover:shadow-[0_0_32px_rgba(201,162,39,0.3)]"
      >
        <img
          src={`${A}assets/illust/menu-card.webp`}
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl border border-gold/40 object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-gold-bright">
            {hasCardDrawn ? '오늘의 카드 다시 보기' : '오늘의 운세카드 뽑기'}
          </p>
          <p className="mt-1 text-xs leading-5 text-hanji/60">
            {hasCardDrawn
              ? '오늘 뽑은 카드의 메시지를 다시 확인하세요'
              : '매일 자정에 새로워지는 24장의 운명 카드'}
          </p>
        </div>
        <span className="shrink-0 text-gold/60 transition-transform group-hover:translate-x-1">→</span>
      </Link>

      <nav className="grid grid-cols-2 gap-3" aria-label="운세 메뉴">
        {MENUS.map((m) => {
          const card = (
            <>
              <div className="relative">
                <img
                  src={`${A}assets/illust/${m.img}.webp`}
                  alt=""
                  className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-night/60 to-transparent" />
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-hanji">{m.title}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-hanji/50">{m.desc}</p>
              </div>
            </>
          );
          const cls =
            'group overflow-hidden rounded-xl border border-gold/30 bg-night-soft transition-colors hover:border-gold/60';
          return m.to.startsWith('http') ? (
            <a key={m.to} href={m.to} target="_blank" rel="noreferrer" className={cls}>
              {card}
            </a>
          ) : (
            <Link key={m.to} to={m.to} className={cls}>
              {card}
            </Link>
          );
        })}
      </nav>

      <footer className="mt-1 text-center">
        <Link to="/onboarding" className="text-xs text-hanji/40 underline">
          내 정보 수정
        </Link>
      </footer>
    </main>
  );
}
