import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { CardDef } from '../../content/cards.ts';
import { playCardCharge, playCardPick, playCardReveal } from '../../lib/sound.ts';
import { CardBack, CardFront, GRADE_COLOR, cardElementColor } from './card-frame.tsx';

const FAN_COUNT = 7;
const FAN_TILT = 10;
const CARD_W = 88;
const CARD_H = 132;
const CHARGE_MS = 950; // 기 모으는 시간 — 라이저 길이와 맞춤

type Phase = 'fan' | 'charge' | 'reveal';

function fanStyle(i: number) {
  const offset = i - (FAN_COUNT - 1) / 2;
  return { x: offset * 36, y: Math.abs(offset) * 13, rotate: offset * FAN_TILT };
}

/** 폭발 입자 — 결정적 방향(인덱스 기반)으로 퍼져나가는 금빛 점들 */
function Burst({ color, big }: { color: string; big: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: big ? 30 : 20 }, (_, i) => {
        const angle = (i / (big ? 30 : 20)) * Math.PI * 2;
        const dist = 100 + (i % 5) * 28;
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 3 + (i % 4) * 3 };
      }),
    [big],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.9 + (i % 3) * 0.15, delay: 0.1, ease: 'easeOut' }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: i % 3 === 0 ? '#fff3cf' : i % 3 === 1 ? '#e8c766' : color,
            boxShadow: '0 0 8px 2px rgba(232,199,102,0.6)',
          }}
        />
      ))}
    </div>
  );
}

/** 소환진 — 카드 뒤에서 도는 점선 원 두 개 */
function SummonRing({ delay = 0 }: { delay?: number }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
        animate={{ opacity: 0.9, scale: 1, rotate: 360 }}
        transition={{
          opacity: { duration: 0.35, delay },
          scale: { duration: 0.5, delay, type: 'spring', stiffness: 120 },
          rotate: { duration: 10, repeat: Infinity, ease: 'linear', delay },
        }}
        className="pointer-events-none absolute h-72 w-72 rounded-full border-2 border-dashed border-gold/50"
        style={{ boxShadow: '0 0 20px rgba(201,162,39,0.25) inset' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
        animate={{ opacity: 0.6, scale: 1, rotate: -360 }}
        transition={{
          opacity: { duration: 0.4, delay: delay + 0.1 },
          scale: { duration: 0.55, delay: delay + 0.1, type: 'spring', stiffness: 120 },
          rotate: { duration: 14, repeat: Infinity, ease: 'linear', delay },
        }}
        className="pointer-events-none absolute h-56 w-56 rounded-full border border-gold/30"
      />
    </>
  );
}

/** 회전 광선 — 공개 순간 카드 뒤로 도는 빛줄기 */
function LightRays({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
      animate={{ opacity: 0.5, scale: 1, rotate: 360 }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { duration: 0.4 },
        rotate: { duration: 16, repeat: Infinity, ease: 'linear' },
      }}
      className="pointer-events-none absolute z-0 h-[26rem] w-[26rem] rounded-full"
      style={{
        background: `repeating-conic-gradient(${color}55 0deg 5deg, transparent 5deg 20deg)`,
        maskImage: 'radial-gradient(circle, black 20%, transparent 68%)',
        WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 68%)',
      }}
    />
  );
}

/**
 * 운세카드 뽑기 연출 — 가챠식 단계: 팬 → 기모으기(charge) → 공개(reveal).
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
  const bigGrade = card.grade === '대길' || card.grade === '길';

  useEffect(() => {
    if (phase === 'charge') {
      const t = setTimeout(() => setPhase('reveal'), reduce ? 100 : CHARGE_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'reveal') playCardReveal();
  }, [phase, reduce]);

  function pick(i: number) {
    if (chosen !== null) return;
    setChosen(i);
    playCardPick();
    playCardCharge();
    onPick();
    setPhase('charge');
  }

  return (
    <div className="flex flex-col items-center">
      {/* 카드 영역 — 공개 순간 화면 전체가 살짝 흔들림 */}
      <motion.div
        animate={phase === 'reveal' && !reduce ? { x: [0, -6, 6, -3, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="relative flex h-72 w-full items-center justify-center overflow-visible"
      >
        {/* 배경 광원 — charge부터 점점 강해짐 */}
        <motion.div
          animate={
            phase === 'reveal'
              ? { opacity: [0.4, 1, 0.7], scale: 1.6 }
              : phase === 'charge'
                ? { opacity: [0.35, 0.9], scale: [1, 1.3] }
                : { opacity: 0.35, scale: 1 }
          }
          transition={{ duration: phase === 'charge' ? CHARGE_MS / 1000 : 1 }}
          className="pointer-events-none absolute h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${accent}66 0%, ${accent}22 40%, transparent 70%)` }}
        />

        {phase !== 'fan' && <SummonRing />}
        {phase === 'reveal' && <LightRays color={accent} />}

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
                  : isChosen && phase === 'charge' && !reduce
                    ? {
                        // 기 모으기 — 좌우로 떨리며 커짐
                        x: [0, -3, 3, -3, 3, -2, 2, 0],
                        y: 0,
                        rotate: 0,
                        scale: [1.22, 1.3, 1.24, 1.34, 1.28],
                        opacity: 1,
                      }
                    : isChosen
                      ? { x: 0, y: 0, rotate: 0, scale: phase === 'reveal' ? 1.9 : 1.25, opacity: 1 }
                      : { x: fan.x, y: fan.y, rotate: fan.rotate, opacity: 1, scale: 1 }
              }
              transition={
                reduce
                  ? { duration: 0.1 }
                  : faded
                    ? { duration: 0.4, ease: 'easeIn' }
                    : isChosen && phase === 'charge'
                      ? { duration: CHARGE_MS / 1000, times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95, 1] }
                      : isChosen
                        ? { type: 'spring', stiffness: 260, damping: 22 }
                        : { type: 'spring', stiffness: 180, damping: 20, delay: i * 0.06 }
              }
              className="absolute cursor-pointer outline-none"
              style={{ width: CARD_W, height: CARD_H, zIndex: isChosen ? 20 : i }}
            >
              {/* 충전 오라 — 뽑힌 카드만 */}
              {isChosen && phase === 'charge' && !reduce && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 0.9, 0.6], scale: 1.5 }}
                  transition={{ duration: CHARGE_MS / 1000 }}
                  className="pointer-events-none absolute inset-0 -z-10 rounded-xl"
                  style={{ background: `radial-gradient(circle, ${accent}88 0%, transparent 70%)` }}
                />
              )}
              {/* 플립 래퍼 */}
              <motion.div
                animate={{ rotateY: isChosen && phase === 'reveal' ? 180 : 0 }}
                transition={{ duration: reduce ? 0.1 : 0.6, delay: 0.05, ease: [0.2, 0.8, 0.3, 1] }}
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

        {phase === 'reveal' && <Burst color={accent} big={bigGrade} />}

        {/* 공개 플래시 — 최상단 */}
        {phase === 'reveal' && !reduce && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0] }}
            transition={{ duration: 0.5, times: [0, 0.12, 1] }}
            className="pointer-events-none absolute inset-0 z-40"
            style={{ background: 'radial-gradient(circle, rgba(255,244,214,0.95) 0%, rgba(232,199,102,0.5) 40%, transparent 70%)' }}
          />
        )}
      </motion.div>

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

      {phase === 'charge' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1] }}
          transition={{ duration: CHARGE_MS / 1000 }}
          className="mt-4 text-sm font-bold text-gold-bright"
        >
          기가 모이는 중…
        </motion.p>
      )}

      {phase === 'reveal' && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            reduce
              ? { duration: 0.1 }
              : { type: 'spring', stiffness: 200, damping: 17, delay: 0.5 }
          }
          className="mt-4 w-full max-w-sm rounded-xl border-2 border-gold/60 bg-night-soft p-5 text-center shadow-[0_0_30px_rgba(201,162,39,0.25)]"
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
