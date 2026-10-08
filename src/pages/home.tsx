import { todayKST } from '../lib/date.ts';

export function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-4xl font-bold text-gold">SAJOO</h1>
      <p className="text-hanji/70">나의 한국식 사주 · 오늘의 운세카드</p>
      <p className="text-sm text-hanji/50">{todayKST()}</p>
    </main>
  );
}
