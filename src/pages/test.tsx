import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { BackHome } from '../components/back-home.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { ShareImageButton } from '../components/share-image-button.tsx';
import { StateView } from '../components/state-view.tsx';
import { QUIZZES, type QuizDef } from '../content/tests.ts';
import { playCardPick, playCardReveal } from '../lib/sound.ts';
import { hasProfile } from '../lib/storage.ts';

/**
 * 설문형 테스트 공용 페이지 — /test/:id
 * 프로필 없이도 진입 가능 (공유 링크로 친구가 바로 들어오는 입구).
 */
export function TestPage() {
  const { id } = useParams();
  const quiz = id ? QUIZZES[id] : undefined;
  if (!quiz) {
    return <StateView message="없는 테스트입니다." linkTo="/" linkLabel="홈으로" />;
  }
  return <QuizRunner quiz={quiz} />;
}

function QuizRunner({ quiz }: { quiz: QuizDef }) {
  const [step, setStep] = useState(-1); // -1: 인트로
  const [score, setScore] = useState<Record<string, number>>({});
  const [done, setDone] = useState<string | null>(null);

  const q = quiz.questions[step];
  const result = done ? quiz.types[done] : null;

  const shareText = useMemo(() => {
    if (!result) return '';
    const lines = [
      `${quiz.shareLabel} ${result.code}「${result.name}」`,
      result.desc,
      `태그: ${result.tags.join(' · ')}`,
      ...(result.jobs ? [`추천 직업: ${result.jobs.join(' · ')}`] : []),
      '너도 해봐 → 나 사주랑 테스트 하러 가기',
    ];
    return lines.join('\n');
  }, [quiz, result]);

  function choose(w: string) {
    playCardPick();
    const next = { ...score, [w]: (score[w] ?? 0) + 1 };
    setScore(next);
    if (step + 1 < quiz.questions.length) {
      setStep(step + 1);
    } else {
      playCardReveal();
      setDone(quiz.resolve(next));
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="pt-6">
        <BackHome />
        <h1 className="mt-2 text-2xl font-bold text-gold">{quiz.title}</h1>
        <p className="mt-1 text-sm text-hanji/60">{quiz.subtitle}</p>
      </header>

      {/* 인트로 */}
      {step === -1 && !result && (
        <section className="rounded-xl border border-gold/30 bg-night-soft p-6 text-center">
          <p className="text-5xl">☯</p>
          <p className="mt-4 text-sm leading-6 text-hanji/80">
            질문 {quiz.questions.length}개 · 약 1분
            <br />
            정답은 없어요 — 솔직하게 골라주세요
          </p>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="mt-5 w-full rounded-lg bg-gold py-3 font-bold text-night"
          >
            시작하기
          </button>
        </section>
      )}

      {/* 질문 */}
      {step >= 0 && q && !result && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-night-soft">
              <motion.div
                className="h-full rounded-full bg-gold"
                animate={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-hanji/50">
              {step + 1}/{quiz.questions.length}
            </span>
          </div>
          <motion.section
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            <h2 className="py-4 text-center text-lg font-bold leading-7 text-hanji">{q.text}</h2>
            {q.choices.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => choose(c.w)}
                className="rounded-xl border border-gold/30 bg-night-soft px-5 py-4 text-left text-sm font-bold text-hanji transition-colors hover:border-gold-bright hover:bg-gold/10 active:scale-[0.98]"
              >
                {c.label}
              </button>
            ))}
          </motion.section>
        </>
      )}

      {/* 결과 */}
      {result && (
        <motion.section
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 17 }}
          className="flex flex-col gap-4"
        >
          <div className="rounded-2xl border-2 border-gold/60 bg-night-soft p-6 text-center shadow-[0_0_30px_rgba(201,162,39,0.2)]">
            <p className="text-xs text-hanji/50">{quiz.shareLabel}</p>
            <p className="mt-2 text-5xl font-bold tracking-wider text-gold-bright">{result.code}</p>
            <p className="mt-2 text-lg font-bold text-hanji">{result.name}</p>
            <p className="mt-3 text-sm leading-6 text-hanji/80">{result.desc}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {result.tags.map((t) => (
                <span key={t} className="rounded-full border border-gold/40 px-2.5 py-0.5 text-[11px] text-gold-bright">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {result.jobs && (
            <div className="rounded-xl border border-hanji/15 bg-night-soft p-4">
              <p className="text-xs text-hanji/50">이런 일이 잘 맞아요</p>
              <p className="mt-2 text-sm leading-6 text-hanji/85">{result.jobs.join(' · ')}</p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <ShareButton label="결과 공유하기" text={shareText} />
            <ShareImageButton
              data={{
                label: quiz.title,
                big: result.code,
                accent: '#e8c766',
                title: result.name,
                lines: [result.desc, result.tags.join(' · ')],
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => { setStep(-1); setScore({}); setDone(null); }}
            className="rounded-lg border border-gold/40 px-4 py-3 text-sm text-gold-bright"
          >
            다시 해보기
          </button>
          {!hasProfile() && (
            <Link
              to="/onboarding"
              className="rounded-lg bg-gold px-4 py-3 text-center font-bold text-night"
            >
              나도 내 사주 보러 가기
            </Link>
          )}
        </motion.section>
      )}

      <p className="mt-auto pb-2 text-center text-[11px] text-hanji/30">
        재미로 보는 테스트입니다 — 참고용으로만 봐주세요
      </p>
    </main>
  );
}
