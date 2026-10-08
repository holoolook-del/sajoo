import { useMemo } from 'react';
import { BackHome } from '../components/back-home.tsx';
import { CARD_DECK, getCardById } from '../content/cards.ts';
import { ELEMENT_COLOR } from '../content/meta.ts';
import { GRADE_COLOR } from '../features/card/card-frame.tsx';
import { buildHistory } from '../features/history/history.ts';
import { StateView } from '../components/state-view.tsx';
import { todayKST } from '../lib/date.ts';
import { listCardDraws } from '../lib/storage.ts';

export function HistoryPage() {
  const history = useMemo(() => buildHistory(), []);
  // 카드 도감 — 지금까지 뽑은 카드 id 집합
  const collected = useMemo(() => new Set(listCardDraws().map((d) => d.cardId)), []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-6">
        <BackHome />
        <h1 className="mt-2 text-2xl font-bold text-gold">지난 30일의 기록</h1>
        <p className="mt-1 text-sm text-hanji/60">오늘은 {todayKST()}</p>
      </header>

      {history.length === 0 && (
        <StateView
          message="아직 기록이 없습니다. 오늘의 운세를 보거나 카드를 뽑아 보세요."
          linkTo="/fortune"
          linkLabel="오늘의 운세 보기"
        />
      )}

      {/* 카드 도감 — 24장 수집 현황 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm text-hanji/60">카드 도감</h2>
          <p className="text-xs text-gold-bright">{collected.size}/{CARD_DECK.length}</p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {CARD_DECK.map((c) => {
            const got = collected.has(c.id);
            return (
              <div
                key={c.id}
                className={`flex flex-col items-center rounded-lg border p-2 text-center ${
                  got ? 'border-gold/40 bg-night' : 'border-hanji/10 opacity-40'
                }`}
                title={got ? `${c.name} ${c.hanja} — ${c.grade}` : '아직 뽑지 못한 카드'}
              >
                <span className="text-[10px] font-bold" style={{ color: got ? ELEMENT_COLOR[c.element] : undefined }}>
                  {got ? c.name : '？'}
                </span>
                <span className="text-[9px] text-hanji/40">{got ? c.hanja : '미수집'}</span>
              </div>
            );
          })}
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        {history.map((entry) => {
          const card = entry.draw ? getCardById(entry.draw.cardId) : undefined;
          return (
            <li
              key={entry.date}
              className="rounded-xl border border-hanji/15 bg-night-soft p-4"
            >
              <p className="text-sm font-bold text-gold-bright">{entry.date}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                {entry.fortune ? (
                  <p className="text-sm text-hanji/85">
                    일진 {entry.fortune.iljin}{' '}
                    <span className={`font-bold ${GRADE_COLOR[entry.fortune.grade]}`}>
                      {entry.fortune.grade}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-hanji/50">운세 기록 없음</p>
                )}
                {card && (
                  <p className="text-sm font-bold" style={{ color: ELEMENT_COLOR[card.element] }}>
                    {card.name}
                  </p>
                )}
              </div>
              {entry.fortune && (
                <p className="mt-1.5 text-xs leading-5 text-hanji/60">{entry.fortune.summary}</p>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
