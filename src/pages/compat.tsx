import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { compatScore } from '../features/compat/compat.ts';
import { GRADE_COLOR } from '../features/card/card-frame.tsx';
import { ProfileForm } from '../features/saju/profile-form.tsx';
import { useSaju } from '../features/saju/use-saju.ts';
import { StateView } from '../components/state-view.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { calcSaju } from '../lib/engine.ts';
import type { Profile } from '../lib/types.ts';

export function CompatPage() {
  const { profile, saju } = useSaju();
  // 상대방 정보는 화면 상태에만 둔다 — 저장하지 않는다 (명세상 궁합은 미저장)
  const [other, setOther] = useState<Profile | null>(null);

  const result = useMemo(() => {
    if (!saju || !other) return null;
    const rb = calcSaju({
      year: other.year, month: other.month, day: other.day,
      hour: other.hour, minute: other.minute,
      calendar: other.calendar, isLeapMonth: other.isLeapMonth, gender: other.gender,
    });
    return rb.ok ? compatScore(saju, rb.data) : 'error';
  }, [saju, other]);

  if (!saju || !profile) {
    return <StateView message="먼저 내 사주를 입력해 주세요." linkTo="/onboarding" linkLabel="정보 입력" />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-6">
        <Link to="/" className="text-sm text-hanji/50">← 홈</Link>
        <h1 className="mt-2 text-2xl font-bold text-gold">궁합 보기</h1>
        <p className="mt-1 text-sm text-hanji/60">
          {profile.name}님과 상대방의 인연을 봅니다. 상대 정보는 저장되지 않습니다.
        </p>
      </header>

      {!other && (
        <section className="rounded-xl border border-gold/30 bg-night-soft p-5">
          <h2 className="mb-4 text-sm font-bold text-hanji/80">상대방 정보</h2>
          <ProfileForm submitLabel="궁합 보기" onSubmit={setOther} />
        </section>
      )}

      {other && result === 'error' && (
        <section className="rounded-xl border border-vermilion/40 bg-night-soft p-5 text-center">
          <p className="text-hanji/70">상대방 사주를 계산할 수 없습니다.</p>
          <button
            type="button"
            onClick={() => setOther(null)}
            className="mt-3 rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold-bright"
          >
            다시 입력
          </button>
        </section>
      )}

      {other && result && result !== 'error' && (
        <>
          <section className="rounded-xl border border-gold/30 bg-night-soft p-5 text-center">
            <p className="text-sm text-hanji/60">
              {profile.name} × {other.name}
            </p>
            <p className="mt-2 text-5xl font-bold text-gold-bright">{result.score}</p>
            <p className={`mt-1 text-xl font-bold ${GRADE_COLOR[result.grade]}`}>{result.grade}</p>
            <p className="mt-3 text-sm leading-6 text-hanji/85">{result.summary}</p>
          </section>

          <section className="rounded-xl border border-hanji/15 bg-night-soft p-5">
            <h2 className="text-sm text-hanji/60">궁합 해석</h2>
            <ul className="mt-3 space-y-3">
              {result.detail.map((line, i) => (
                <li key={i} className="text-sm leading-6 text-hanji/85">{line}</li>
              ))}
            </ul>
          </section>

          <div className="flex justify-center">
            <ShareButton
              label="궁합 결과 공유하기"
              text={`${profile.name} × ${other.name} 궁합 ${result.score}점 「${result.grade}」\n${result.summary}\n너도 사주 궁합 해봐!`}
            />
          </div>

          <button
            type="button"
            onClick={() => setOther(null)}
            className="rounded-lg border border-gold/40 px-4 py-3 text-sm text-gold-bright"
          >
            다른 사람과 보기
          </button>
        </>
      )}
    </main>
  );
}
