import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCardById } from '../content/cards.ts';
import { ELEMENT_COLOR } from '../content/meta.ts';
import { GRADE_COLOR } from '../features/card/card-frame.tsx';
import { todaysDraw } from '../features/card/draw.ts';
import { dailyFortune, saveTodaysFortune } from '../features/fortune/today.ts';
import { useSaju } from '../features/saju/use-saju.ts';
import { StateView } from '../components/state-view.tsx';
import { todayKST } from '../lib/date.ts';

export function FortunePage() {
  const { saju } = useSaju();
  const today = todayKST();
  const fortune = useMemo(() => (saju ? dailyFortune(saju, today) : null), [saju, today]);

  // 방문할 때마다 오늘의 운세를 기록한다 (멱등 — 같은 값이 덮어씀, 히스토리 T7이 재사용)
  useEffect(() => {
    if (saju) saveTodaysFortune(saju, today);
  }, [saju, today]);

  const draw = todaysDraw();
  const drawnCard = draw ? getCardById(draw.cardId) : undefined;

  if (!fortune || !saju) {
    return <StateView message="오늘의 운세를 계산할 수 없습니다." />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-6">
        <Link to="/" className="text-sm text-hanji/50">← 홈</Link>
        <h1 className="mt-2 text-2xl font-bold text-gold">오늘의 운세</h1>
        <p className="mt-1 text-sm text-hanji/60">{today}</p>
      </header>

      {/* 일진 + 등급 */}
      <section className="flex items-center gap-5 rounded-xl border border-gold/30 bg-night-soft p-5">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-gold/50 bg-night">
          <span className="text-2xl font-bold text-hanji">{fortune.iljin.hanja}</span>
          <span className="mt-0.5 text-xs text-gold-bright">{fortune.iljin.korean}</span>
        </div>
        <div>
          <p className="text-xs text-hanji/50">오늘의 일진(日辰)</p>
          <p className={`mt-1 text-3xl font-bold ${GRADE_COLOR[fortune.grade]}`}>{fortune.grade}</p>
          <p className="mt-1 text-xs text-hanji/60">운세 점수 {fortune.score}</p>
        </div>
      </section>

      <p className="rounded-lg bg-gold/10 p-4 text-sm font-bold leading-6 text-gold-bright">
        {fortune.summary}
      </p>

      {/* 조합 해석 */}
      <section className="rounded-xl border border-hanji/15 bg-night-soft p-5">
        <h2 className="text-sm text-hanji/60">오늘의 기운 해석</h2>
        <ul className="mt-3 space-y-3">
          {fortune.detail.map((line, i) => (
            <li key={i} className="text-sm leading-6 text-hanji/85">{line}</li>
          ))}
        </ul>
      </section>

      {/* 운세카드 연동 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-5 text-center">
        {drawnCard ? (
          <>
            <p className="text-sm text-hanji/60">오늘 뽑은 카드</p>
            <p className="mt-2 text-xl font-bold" style={{ color: ELEMENT_COLOR[drawnCard.element] }}>
              {drawnCard.name}
            </p>
            <p className={`mt-1 text-sm ${GRADE_COLOR[drawnCard.grade]}`}>{drawnCard.grade}</p>
            <Link to="/card" className="mt-3 inline-block text-sm text-gold underline">카드 다시 보기 →</Link>
          </>
        ) : (
          <>
            <p className="text-sm text-hanji/70">오늘의 운세카드를 아직 뽑지 않았습니다.</p>
            <Link
              to="/card"
              className="mt-3 inline-block rounded-lg bg-gold px-4 py-2 font-bold text-night"
            >
              운세카드 뽑기
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
