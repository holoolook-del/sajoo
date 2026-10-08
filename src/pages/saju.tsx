import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { calcSaju } from '../lib/engine.ts';
import { loadProfile } from '../lib/storage.ts';

const PILLAR_LABELS = [
  { key: 'hour', label: '시주' },
  { key: 'day', label: '일주' },
  { key: 'month', label: '월주' },
  { key: 'year', label: '연주' },
] as const;

export function SajuPage() {
  const profile = loadProfile();
  const result = useMemo(
    () =>
      profile
        ? calcSaju({
            year: profile.year,
            month: profile.month,
            day: profile.day,
            hour: profile.hour,
            minute: profile.minute,
            calendar: profile.calendar,
            isLeapMonth: profile.isLeapMonth,
            gender: profile.gender,
          })
        : null,
    [profile],
  );

  if (!result || !result.ok) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="text-hanji/70">사주를 계산할 수 없습니다.</p>
        <Link to="/onboarding" className="text-gold underline">정보 다시 입력</Link>
      </main>
    );
  }

  const { pillars, dayMaster, lunar, hourIncluded } = result.data;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-6">
        <Link to="/" className="text-sm text-hanji/50">← 홈</Link>
        <h1 className="mt-2 text-2xl font-bold text-gold">{profile?.name}님의 사주팔자</h1>
        <p className="mt-1 text-sm text-hanji/60">
          음력 {lunar.year}년 {lunar.month}월 {lunar.day}일{lunar.isLeapMonth ? ' (윤달)' : ''}
          {!hourIncluded && ' · 시주 미입력(3주로 계산)'}
        </p>
      </header>

      <section className="grid grid-cols-4 gap-2">
        {PILLAR_LABELS.map(({ key, label }) => {
          const p = pillars[key];
          return (
            <div key={key} className="rounded-lg border border-gold/30 bg-night-soft p-3 text-center">
              <div className="text-xs text-hanji/50">{label}</div>
              {p ? (
                <>
                  <div className="mt-1 text-2xl font-bold text-hanji">{p.hanja}</div>
                  <div className="mt-1 text-sm text-gold-bright">{p.korean}</div>
                </>
              ) : (
                <div className="mt-1 text-sm text-hanji/40">미입력</div>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-lg border border-hanji/15 bg-night-soft p-4">
        <h2 className="text-sm text-hanji/60">일간(나를 나타내는 글자)</h2>
        <p className="mt-1 text-lg">
          <span className="text-2xl font-bold text-gold-bright">{dayMaster.hanja}</span>{' '}
          <span className="text-hanji">{dayMaster.korean}</span>{' '}
          <span className="text-hanji/60">— {dayMaster.element}의 {dayMaster.yinYang} 기운</span>
        </p>
      </section>
    </main>
  );
}
