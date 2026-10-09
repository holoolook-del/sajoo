import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { BackHome } from '../components/back-home.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { ShareImageButton } from '../components/share-image-button.tsx';
import { StateView } from '../components/state-view.tsx';
import { QUIZZES, type QuizDef } from '../content/tests.ts';
import { playCardPick, playCardReveal } from '../lib/sound.ts';
import { hasProfile, loadTestResult, saveTestResult } from '../lib/storage.ts';

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
  return <QuizRunner key={quiz.id} quiz={quiz} />;
}

function QuizRunner({ quiz }: { quiz: QuizDef }) {
  const [started, setStarted] = useState(false);
  // answers[i] = i번 문항에서 고른 가중치 키 — 되돌아가기 지원
  const [answers, setAnswers] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const prevCode = loadTestResult(quiz.id);

  const step = answers.length;
  const q = quiz.questions[step];

  const score = useMemo(() => {
    const s: Record<string, number> = {};
    for (const w of answers) s[w] = (s[w] ?? 0) + 1;
    return s;
  }, [answers]);

  const code = done ? quiz.resolve(score) : null;
  const second = done && quiz.secondCode ? quiz.secondCode(score) : null;
  const result = code ? quiz.types[code] : null;
  const secondType = second ? quiz.types[second] : null;
  const accent = result?.accent ?? '#e8c766';

  const shareText = useMemo(() => {
    if (!result) return '';
    const title = secondType
      ? `${result.code}+${secondType.code} ${result.name}`
      : `${result.code}「${result.name}」`;
    return [
      `${quiz.shareLabel} ${title}`,
      result.desc,
      `태그: ${result.tags.join(' · ')}`,
      ...(result.jobs ? [`추천 직업: ${result.jobs.join(' · ')}`] : []),
      '너도 해봐!',
    ].join('\n');
  }, [quiz, result, secondType]);

  function choose(w: string) {
    playCardPick();
    const next = [...answers, w];
    setAnswers(next);
    if (next.length >= quiz.questions.length) {
      playCardReveal();
      saveTestResult(quiz.id, quiz.resolve(scoreOf(next)));
      setDone(true);
    }
  }

  function scoreOf(list: string[]) {
    return list.reduce<Record<string, number>>((s, k) => ((s[k] = (s[k] ?? 0) + 1), s), {});
  }

  function reset() {
    setStarted(false);
    setAnswers([]);
    setDone(false);
  }

  const maxBar = quiz.bars
    ? Math.max(...quiz.bars.map((b) => (score[b.a] ?? 0) + (b.b ? (score[b.b] ?? 0) : 0)), 1)
    : 1;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="pt-6">
        <BackHome />
        <h1 className="mt-2 text-2xl font-bold text-gold">{quiz.title}</h1>
        <p className="mt-1 text-sm text-hanji/60">{quiz.subtitle}</p>
      </header>

      {/* 인트로 */}
      {!started && !done && (
        <section className="rounded-xl border border-gold/30 bg-night-soft p-6 text-center">
          <p className="text-5xl">☯</p>
          <p className="mt-4 text-sm leading-6 text-hanji/80">
            질문 {quiz.questions.length}개 · 약 1분
            <br />
            정답은 없어요 — 솔직하게 골라주세요
          </p>
          {prevCode && quiz.types[prevCode] && (
            <p className="mt-3 text-xs text-hanji/50">
              지난 결과:{' '}
              <span className="font-bold" style={{ color: quiz.types[prevCode].accent ?? '#e8c766' }}>
                {prevCode} {quiz.types[prevCode].name}
              </span>
            </p>
          )}
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-5 w-full rounded-lg bg-gold py-3 font-bold text-night"
          >
            시작하기
          </button>
        </section>
      )}

      {/* 질문 */}
      {started && !done && q && (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAnswers(answers.slice(0, -1))}
              disabled={step === 0}
              className="rounded-lg border border-hanji/20 px-2.5 py-1 text-xs text-hanji/60 disabled:opacity-30"
              aria-label="이전 질문"
            >
              ←
            </button>
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
      {done && result && (
        <motion.section
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 17 }}
          className="flex flex-col gap-4"
        >
          <div
            className="rounded-2xl border-2 bg-night-soft p-6 text-center"
            style={{ borderColor: `${accent}99`, boxShadow: `0 0 30px ${accent}33` }}
          >
            <p className="text-xs text-hanji/50">{quiz.shareLabel}</p>
            <p className="mt-2 text-5xl font-bold tracking-wider" style={{ color: accent }}>
              {result.code}
              {secondType && <span className="text-3xl text-hanji/60">+{secondType.code}</span>}
            </p>
            <p className="mt-2 text-lg font-bold text-hanji">{result.name}</p>
            {secondType && (
              <p className="mt-1 text-xs text-hanji/50">보조 유형: {secondType.name}</p>
            )}
            <p className="mt-3 text-sm leading-6 text-hanji/80">{result.desc}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {result.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border px-2.5 py-0.5 text-[11px]"
                  style={{ borderColor: `${accent}66`, color: accent }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* 축별/유형별 점수 바 */}
          {quiz.bars && (
            <div className="rounded-xl border border-hanji/15 bg-night-soft p-4">
              <p className="text-xs text-hanji/50">성향 분포</p>
              <ul className="mt-3 space-y-2.5">
                {quiz.bars.map((b) => {
                  const aN = score[b.a] ?? 0;
                  const bN = b.b ? (score[b.b] ?? 0) : 0;
                  const total = aN + bN || 1;
                  const pctA = Math.round((aN / total) * 100);
                  return (
                    <li key={b.a}>
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-hanji/80">
                          {b.a} {b.b ? '' : b.label}
                        </span>
                        {b.b ? (
                          <span className="text-hanji/50">
                            {b.a} {pctA}% ↔ {b.b} {100 - pctA}%
                          </span>
                        ) : (
                          <span className="text-hanji/50">{Math.round((aN / maxBar) * 100)}%</span>
                        )}
                      </div>
                      {b.b ? (
                        <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-night">
                          <div className="h-full bg-gold" style={{ width: `${pctA}%` }} />
                          <div className="h-full flex-1 bg-dancheong" />
                        </div>
                      ) : (
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-night">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${(aN / maxBar) * 100}%` }} />
                        </div>
                      )}
                      {b.b && <p className="mt-0.5 text-[10px] text-hanji/40">{b.label}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {result.jobs && (
            <div className="rounded-xl border border-hanji/15 bg-night-soft p-4">
              <p className="text-xs text-hanji/50">이런 일이 잘 맞아요</p>
              <p className="mt-2 text-sm leading-6 text-hanji/85">{result.jobs.join(' · ')}</p>
            </div>
          )}

          {result.watch && (
            <div className="rounded-xl border border-hanji/15 bg-night-soft p-4">
              <p className="text-xs text-hanji/50">이건 조심</p>
              <p className="mt-2 text-sm leading-6 text-hanji/85">{result.watch}</p>
            </div>
          )}

          {(result.good || result.hard) && (
            <div className="rounded-xl border border-hanji/15 bg-night-soft p-4 text-sm">
              {result.good && (
                <p className="text-hanji/85">
                  <span className="text-gold-bright">잘 맞는 타입</span>{' '}
                  <span className="text-hanji/60">{result.good.join(' · ')}</span>
                </p>
              )}
              {result.hard && (
                <p className="mt-1.5 text-hanji/85">
                  <span className="text-vermilion">부딪히기 쉬운 타입</span>{' '}
                  <span className="text-hanji/60">{result.hard.join(' · ')}</span>
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <ShareButton label="결과 공유하기" text={shareText} />
            <ShareImageButton
              data={{
                label: quiz.title,
                big: secondType ? `${result.code}+${secondType.code}` : result.code,
                accent,
                title: result.name,
                lines: [result.desc, result.tags.join(' · ')],
              }}
            />
          </div>
          <button
            type="button"
            onClick={reset}
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
