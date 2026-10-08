import { useMemo, useState } from 'react';
import { BackHome } from '../components/back-home.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { SoundToggle } from '../components/sound-toggle.tsx';
import { playCardPick, playCardReveal } from '../lib/sound.ts';

/**
 * 제비뽑기 — 한 폰으로 돌아가며 뽑는 모임용 추첨.
 * 인원과 당첨 수를 정하고 섞인 제비를 하나씩 뒤집는다.
 * 결과는 화면에만 — 저장하지 않는다.
 */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function LotsPage() {
  const [people, setPeople] = useState(4);
  const [winners, setWinners] = useState(1);
  // lots[i] = true면 i번 제비가 당첨
  const [lots, setLots] = useState<boolean[] | null>(null);
  const [opened, setOpened] = useState<Set<number>>(new Set());

  const maxWinners = people - 1;
  const winCount = lots ? Math.min(winners, maxWinners) : winners;
  const done = lots !== null && opened.size === lots.length;
  const winnerIdx = useMemo(
    () => (lots ?? []).map((w, i) => (w ? i + 1 : 0)).filter(Boolean),
    [lots],
  );

  function start() {
    const win = Math.min(winners, maxWinners);
    setLots(shuffle([...Array(win).fill(true), ...Array(people - win).fill(false)]));
    setOpened(new Set());
  }

  function open(i: number) {
    if (!lots || opened.has(i)) return;
    const isWin = lots[i];
    playCardPick();
    if (isWin) setTimeout(() => playCardReveal(), 150);
    setOpened((s) => new Set(s).add(i));
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="pt-6">
        <div className="flex items-center justify-between">
          <BackHome />
          <SoundToggle />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gold">제비뽑기</h1>
        <p className="mt-1 text-sm text-hanji/60">모임에서 돌아가며 하나씩 — 누가 걸릴까?</p>
      </header>

      {/* 설정 — 섞기 전에만 */}
      {!lots && (
        <section className="rounded-xl border border-gold/30 bg-night-soft p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-hanji">참가 인원</p>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setPeople(n); if (winners >= n) setWinners(n - 1); }}
                  className={`h-8 w-8 rounded-lg border text-sm ${
                    people === n ? 'border-gold/60 bg-gold/10 text-gold-bright' : 'border-hanji/15 text-hanji/60'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-bold text-hanji">당첨 수</p>
            <div className="flex gap-1.5">
              {Array.from({ length: maxWinners }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWinners(n)}
                  className={`h-8 w-8 rounded-lg border text-sm ${
                    winCount === n ? 'border-gold/60 bg-gold/10 text-gold-bright' : 'border-hanji/15 text-hanji/60'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={start}
            className="mt-5 w-full rounded-lg bg-gold py-3 font-bold text-night"
          >
            제비 섞기
          </button>
        </section>
      )}

      {/* 제비 — 뒤집힌 카드들, 하나씩 탭해서 공개 */}
      {lots && (
        <>
          <p className="text-center text-sm text-hanji/60">
            {done
              ? '결과가 모두 나왔습니다'
              : `${people}개의 제비 중 ${winCount}개가 당첨 — 돌아가며 하나씩 눌러보세요`}
          </p>
          <div className="grid grid-cols-4 gap-3">
            {lots.map((win, i) => {
              const isOpen = opened.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => open(i)}
                  disabled={isOpen}
                  aria-label={`제비 ${i + 1}번`}
                  className={`flex aspect-[3/4] flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                    isOpen
                      ? win
                        ? 'border-gold-bright bg-gold/15 shadow-[0_0_20px_rgba(232,199,102,0.35)]'
                        : 'border-hanji/15 bg-night opacity-60'
                      : 'border-gold/50 bg-night-soft hover:-translate-y-1 hover:border-gold-bright'
                  }`}
                >
                  {isOpen ? (
                    <>
                      <span className={`text-lg font-bold ${win ? 'text-gold-bright' : 'text-hanji/40'}`}>
                        {win ? '당첨' : '꽝'}
                      </span>
                      <span className="mt-1 text-[10px] text-hanji/40">{i + 1}번</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl text-gold/70">籤</span>
                      <span className="mt-1 text-[10px] text-hanji/40">{i + 1}번</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex flex-col gap-3">
            {opened.size > 0 && !done && (
              <p className="text-center text-xs text-hanji/40">
                {opened.size}/{lots.length}개 공개됨
              </p>
            )}
            {done && (
              <>
                <section className="rounded-xl border border-gold/50 bg-night-soft p-4 text-center">
                  <p className="text-sm font-bold text-gold-bright">
                    당첨: {winnerIdx.map((n) => `${n}번`).join(' · ')}
                  </p>
                </section>
                <ShareButton
                  label="결과 공유하기"
                  text={`제비뽑기 결과 — ${people}명 중 ${winCount}명 당첨\n당첨: ${winnerIdx.map((n) => `${n}번`).join(', ')}\n너희도 제비뽑기 해봐!`}
                />
              </>
            )}
            <button
              type="button"
              onClick={start}
              className="rounded-lg border border-gold/40 px-4 py-2.5 text-sm text-gold-bright"
            >
              다시 섞기
            </button>
            <button
              type="button"
              onClick={() => { setLots(null); setOpened(new Set()); }}
              className="text-xs text-hanji/40"
            >
              인원 다시 정하기
            </button>
          </div>
        </>
      )}
    </main>
  );
}
