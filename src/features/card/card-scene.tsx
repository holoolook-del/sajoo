import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { CardDef } from '../../content/cards.ts';
import { CardBack, CardFront, GRADE_COLOR, cardElementColor } from './card-frame.tsx';

const FAN_COUNT = 7;
const FAN_TILT = 10;
const CARD_W = 88;
const CARD_H = 132;

type Phase = 'fan' | 'chosen' | 'reveal';

function fanStyle(i: number) {
  const offset = i - (FAN_COUNT - 1) / 2;
  return { x: offset * 36, y: Math.abs(offset) * 13, rotate: offset * FAN_TILT };
}

/** 폭발 입자 — 결정적 방향(인덱스 기반)으로 퍼져나가는 금빛 점들 */
function Burst({ color }: { color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 90 + (i % 4) * 30;
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 3 + (i % 3) * 3 };
      }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: i % 3 === 0 ? '#e8c766' : color }}
        />
      ))}
    </div>
  );
}

/**
 * 운세카드 뽑기 연출.
 * 부모는 카드를 미리 계산해 두고(결정적), onPick에서 뽑기를 기록한다.
 */
export function CardDrawScene({
  card,
  onPick,
  onDone,
}: {
  card: CardDef;
  onPick: () => void;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('fan');
  const [chosen, setChosen] = useState<number | null>(null);

  const accent = cardElementColor(card.element);

  useEffect(() => {
    if (phase === 'chosen') {
      const t = setTimeout(() => setPhase('reveal'), reduce ? 100 : 650);
      return () => clearTimeout(t);
    }
  }, [phase, reduce]);

  function pick(i: number) {
    if (chosen !== null) return;
    setChosen(i);
    onPick();
    setPhase('chosen');
  }

  return (
    <div className="flex flex-col items-center">
      {/* 카드 영역 */}
      <div className="relative flex h-72 w-full items-center justify-center overflow-visible">
        {/* 배경 광원 */}
        <motion.div
          animate={{ opacity: phase === 'reveal' ? [0, 1, 0.6] : 0.35, scale: phase === 'reveal' ? 1.4 : 1 }}
          transition={{ duration: 1 }}
          className="pointer-events-none absolute h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}44 0%, transparent 70%)` }}
        />

        {Array.from({ length: FAN_COUNT }, (_, i) => {
          const isChosen = chosen === i;
          const fan = fanStyle(i);
          const faded = phase !== 'fan' && !isChosen;
          return (
            <motion.button
              key={i}
              type="button"
              aria-label={`운세카드 ${i + 1}`}
              disabled={chosen !== null}
              onClick={() => pick(i)}
              initial={{ opacity: 0, y: -160, x: 0, rotate: 0 }}
              animate={
                faded
                  ? { opacity: 0, y: 60, scale: 0.7, rotate: fan.rotate }
                  : isChosen
                    ? { x: 0, y: 0, rotate: 0, scale: 1.25, opacity: 1 }
                    : { x: fan.x, y: fan.y, rotate: fan.rotate, opacity: 1, scale: 1 }
              }
              transition={
                reduce
                  ? { duration: 0.1 }
                  : faded
                    ? { duration: 0.4, ease: 'easeIn' }
                    : isChosen
                      ? { type: 'spring', stiffness: 260, damping: 22 }
                      : { type: 'spring', stiffness: 180, damping: 20, delay: i * 0.06 }
              }
              className="absolute cursor-pointer outline-none"
              style={{ width: CARD_W, height: CARD_H, zIndex: isChosen ? 20 : i }}
            >
              {/* 플립 래퍼 */}
              <motion.div
                animate={{ rotateY: isChosen && phase === 'reveal' ? 180 : 0 }}
                transition={{ duration: reduce ? 0.1 : 0.7, delay: 0.1 }}
                className="relative h-full w-full"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                  <CardBack className={chosen === null ? 'transition-transform duration-200 hover:-translate-y-3' : ''} />
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <CardFront card={card} />
                </div>
              </motion.div>
            </motion.button>
          );
        })}

        {phase === 'reveal' && <Burst color={accent} />}
      </div>

      {/* 안내 / 결과 패널 */}
      {phase === 'fan' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-sm text-hanji/60"
        >
          끌리는 카드 하나를 뽑으세요
        </motion.p>
      )}

      {phase === 'reveal' && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0.1 : 0.75, duration: 0.5 }}
          className="mt-4 w-full max-w-sm rounded-xl border border-gold/30 bg-night-soft p-5 text-center"
        >
          <p className={`text-lg font-bold ${GRADE_COLOR[card.grade]}`}>{card.grade}</p>
          <p className="mt-1 text-2xl font-bold text-hanji">
            {card.name} <span className="text-hanji/50">{card.hanja}</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-hanji/80">{card.message}</p>
          <p className="mt-2 rounded-lg bg-gold/10 p-3 text-sm text-gold-bright">{card.advice}</p>
          <button
            type="button"
            onClick={onDone}
            className="mt-4 w-full rounded-lg bg-gold px-4 py-3 font-bold text-night"
          >
            오늘의 운세 받기
          </button>
        </motion.div>
      )}
    </div>
  );
}
