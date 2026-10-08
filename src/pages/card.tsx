import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCardById } from '../content/cards.ts';
import { CardDrawScene } from '../features/card/card-scene.tsx';
import { CardFront, GRADE_COLOR } from '../features/card/card-frame.tsx';
import { dailyCard, drawToday, todaysDraw } from '../features/card/draw.ts';
import { todayKST } from '../lib/date.ts';
import { loadProfile } from '../lib/storage.ts';

export function CardPage() {
  const profile = loadProfile();
  const today = todayKST();
  const [drawn, setDrawn] = useState(() => todaysDraw(today));

  if (!profile) return null;

  // 오늘 이미 뽑은 경우: 기록된 카드를 다시 보여준다 (AC6)
  if (drawn) {
    const card = getCardById(drawn.cardId);
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
        <header className="pt-6">
          <Link to="/" className="text-sm text-hanji/50">← 홈</Link>
          <h1 className="mt-2 text-2xl font-bold text-gold">오늘의 운세카드</h1>
          <p className="mt-1 text-sm text-hanji/60">{today} · 오늘 뽑은 카드</p>
        </header>
        <div className="mx-auto h-44 w-32">
          {card ? (
            <CardFront card={card} />
          ) : (
            <p className="text-hanji/60">카드 정보를 찾을 수 없습니다.</p>
          )}
        </div>
        {card && (
          <section className="rounded-xl border border-gold/30 bg-night-soft p-5 text-center">
            <p className={`text-lg font-bold ${GRADE_COLOR[card.grade]}`}>{card.grade}</p>
            <p className="mt-1 text-2xl font-bold text-hanji">
              {card.name} <span className="text-hanji/50">{card.hanja}</span>
            </p>
            <p className="mt-3 text-sm leading-6 text-hanji/80">{card.message}</p>
            <p className="mt-2 rounded-lg bg-gold/10 p-3 text-sm text-gold-bright">{card.advice}</p>
            <p className="mt-3 text-xs text-hanji/40">카드는 매일 자정(한국 시간)에 새로 뽑을 수 있습니다.</p>
          </section>
        )}
      </main>
    );
  }

  const card = dailyCard(profile, today);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-6">
        <Link to="/" className="text-sm text-hanji/50">← 홈</Link>
        <h1 className="mt-2 text-2xl font-bold text-gold">오늘의 운세카드</h1>
        <p className="mt-1 text-sm text-hanji/60">{today}</p>
      </header>
      <CardDrawScene
        card={card}
        onPick={() => {
          drawToday(profile, today);
        }}
        onDone={() => setDrawn(todaysDraw(today))}
      />
    </main>
  );
}
