import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { buildLuckView } from '../features/luck/luck.ts';
import { useSaju } from '../features/saju/use-saju.ts';
import { StateView } from '../components/state-view.tsx';
import { todayKST } from '../lib/date.ts';

const chipCls = 'flex w-14 shrink-0 flex-col items-center rounded-lg border p-2';
const chipBase = 'border-hanji/15 bg-night';
const chipNow = 'border-gold bg-gold/15 shadow-[0_0_12px_rgba(201,162,39,0.3)]';

export function LuckPage() {
  const { profile, saju } = useSaju();
  const today = todayKST();
  const view = useMemo(
    () => (saju && profile ? buildLuckView(saju, profile, today) : null),
    [saju, profile, today],
  );

  if (!view) {
    return <StateView message={`대운을 계산할 수 없습니다${profile?.hour === null ? ' (생시 미입력)' : ''}.`} />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-6">
        <Link to="/" className="text-sm text-hanji/50">← 홈</Link>
        <h1 className="mt-2 text-2xl font-bold text-gold">대운 · 세운 · 월운</h1>
        <p className="mt-1 text-sm text-hanji/60">
          {profile?.name}님 — 대운 {view.directionLabel}, {view.startAge}세부터 시작
        </p>
      </header>

      {/* 대운 10년 흐름 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-5">
        <h2 className="text-sm text-hanji/60">대운(大運) — 10년 운의 흐름</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {view.daewoon.map((d) => (
            <div key={d.age} className={`${chipCls} ${d.current ? chipNow : chipBase}`}>
              <span className="text-[10px] text-hanji/50">{d.age}세~</span>
              <span className="mt-1 text-lg font-bold text-hanji">{d.hanja}</span>
              <span className="text-xs text-gold-bright">{d.korean}</span>
              <span className="mt-1 text-[10px] text-hanji/60">{d.stemGod}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 올해 세운 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-5">
        <h2 className="text-sm text-hanji/60">세운(歲運) — {view.seun.year}년의 기운</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-gold/50 bg-night">
            <span className="text-xl font-bold text-hanji">{view.seun.hanja}</span>
            <span className="text-[11px] text-gold-bright">{view.seun.korean}</span>
          </div>
          <p className="text-sm leading-6 text-hanji/80">
            올해는 {view.seun.stemGod}·{view.seun.branchGod}의 기운이 내 사주와 만납니다.
          </p>
        </div>
      </section>

      {/* 월운 12개월 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-5">
        <h2 className="text-sm text-hanji/60">월운(月運) — {view.seun.year}년 달마다의 기운</h2>
        <div className="mt-3 grid grid-cols-6 gap-2">
          {view.wolun.map((w) => (
            <div key={w.month} className={`${chipCls.replace('w-14', '')} ${w.current ? chipNow : chipBase}`}>
              <span className="text-[10px] text-hanji/50">{w.month}월</span>
              <span className="mt-0.5 text-sm font-bold text-hanji">{w.korean}</span>
              <span className="text-[10px] text-hanji/60">{w.stemGod}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
