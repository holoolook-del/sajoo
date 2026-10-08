import { Link, Navigate } from 'react-router-dom';
import { todaysDraw } from '../features/card/draw.ts';
import { todayKST } from '../lib/date.ts';
import { hasProfile } from '../lib/storage.ts';

export function HomePage() {
  if (!hasProfile()) {
    return <Navigate to="/onboarding" replace />;
  }
  const hasCardDrawn = todaysDraw() !== null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-8 text-center">
        <h1 className="text-4xl font-bold text-gold">SAJOO</h1>
        <p className="mt-1 text-sm text-hanji/50">{todayKST()}</p>
      </header>
      <nav className="flex flex-col gap-3">
        <Link
          to="/card"
          className="rounded-lg border border-gold/50 bg-night-soft p-4 text-center font-bold text-gold-bright shadow-[0_0_16px_rgba(201,162,39,0.15)]"
        >
          {hasCardDrawn ? '오늘의 카드 다시 보기' : '오늘의 운세카드 뽑기'}
        </Link>
        <Link
          to="/fortune"
          className="rounded-lg border border-gold/30 bg-night-soft p-4 text-center text-hanji"
        >
          오늘의 운세 보기
        </Link>
        <Link
          to="/saju"
          className="rounded-lg border border-gold/30 bg-night-soft p-4 text-center text-hanji"
        >
          내 사주팔자 보기
        </Link>
        <Link
          to="/luck"
          className="rounded-lg border border-gold/30 bg-night-soft p-4 text-center text-hanji"
        >
          대운 · 세운 · 월운
        </Link>
        <Link
          to="/compat"
          className="rounded-lg border border-gold/30 bg-night-soft p-4 text-center text-hanji"
        >
          궁합 보기
        </Link>
      </nav>
    </main>
  );
}
