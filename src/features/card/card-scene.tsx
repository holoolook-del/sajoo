import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react';
import type { CardDef } from '../../content/cards.ts';
import { playCardCharge, playCardPick, playCardReveal } from '../../lib/sound.ts';
import { CardBack, CardFront, GRADE_COLOR, cardElementColor } from './card-frame.tsx';

const DECK_COUNT = 12; // 덱처럼 겹쳐 보이는 카드 수
const SPACING = 64; // 카드 간격 — 카드폭(88)보다 좁아 겹침
const CARD_W = 88;
const CARD_H = 132;
const CHARGE_MS = 950; // 기 모으는 시간 — 라이저 길이와 맞춤

type Phase = 'fan' | 'charge' | 'reveal';

const clampIdx = (v: number) => Math.max(0, Math.min(DECK_COUNT - 1, v));

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
  const [centered, setCentered] = useState<number | null>(null);

  // 덱 트랙 위치 — 0이면 0번 카드가 중앙. 중간에서 시작
  const x = useMotionValue(-((DECK_COUNT - 1) / 2) * SPACING);

  useMotionValueEvent(x, 'change', (v) => {
    const i = clampIdx(Math.round(-v / SPACING));
    setCentered((c) => (c === i ? c : i));
  });

  const accent = cardElementColor(card.element);
  const bigGrade = card.grade === '대길' || card.grade === '길';

  useEffect(() => {
    if (phase === 'charge') {
      const t = setTimeout(() => setPhase('reveal'), reduce ? 100 : CHARGE_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'reveal') playCardReveal();
  }, [phase, reduce]);

  // 휠/스크롤로도 덱 넘기기 — 멈추면 가장 가까운 카드로 스냅
  const wheelSnap = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onWheel(e: React.WheelEvent) {
    if (phase !== 'fan') return;
    const nx = Math.max(-((DECK_COUNT - 1) * SPACING), Math.min(0, x.get() - e.deltaX - e.deltaY));
    x.set(nx);
    if (wheelSnap.current) clearTimeout(wheelSnap.current);
    wheelSnap.current = setTimeout(() => {
      animate(x, -clampIdx(Math.round(-x.get() / SPACING)) * SPACING, { type: 'spring', stiffness: 260, damping: 28 });
    }, 140);
  }

  function pick(i: number) {
    if (chosen !== null) return;
    setChosen(i);
    // 뽑은 카드를 중앙으로 — 덱이 미끄러져 그 자리로 감
    animate(x, -i * SPACING, { type: 'spring', stiffness: 240, damping: 26 });
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
        onWheel={onWheel}
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

        {/* 덱 트랙 — 좌우로 밀어 넘기기 (속도·관성 반영, 가운데 카드에 스냅) */}
        <motion.div
          className="absolute inset-0"
          style={{ x }}
          drag={phase === 'fan' ? 'x' : false}
          dragConstraints={{
            left: -((DECK_COUNT - 1) * SPACING) - 60,
            right: 60,
          }}
          dragElastic={0.15}
          dragTransition={{
            power: 0.35,
            timeConstant: 200,
            // 손가락 속도가 반영된 목표 지점을 가장 가까운 카드로 스냅
            modifyTarget: (v) => -clampIdx(Math.round(-v / SPACING)) * SPACING,
          }}
        >
          {Array.from({ length: DECK_COUNT }, (_, i) => {
            const isChosen = chosen === i;
            const isCenter = centered === i;
            const faded = phase !== 'fan' && !isChosen;
            return (
              <motion.button
                key={i}
                type="button"
                aria-label={`운세카드 ${i + 1}`}
                disabled={chosen !== null}
                onTap={() => pick(i)}
                initial={{ opacity: 0, y: -160 }}
                animate={
                  faded
                    ? { opacity: 0, y: 60, scale: 0.7 }
                    : isChosen && phase === 'charge' && !reduce
                      ? {
                          // 기 모으기 — 좌우로 떨리며 커짐
                          x: [i * SPACING, i * SPACING - 3, i * SPACING + 3, i * SPACING - 3, i * SPACING + 3, i * SPACING - 2, i * SPACING + 2, i * SPACING],
                          y: 0,
                          scale: [1.22, 1.3, 1.24, 1.34, 1.28],
                          opacity: 1,
                        }
                      : isChosen
                        ? { x: i * SPACING, y: -20, scale: phase === 'reveal' ? 1.9 : 1.3, opacity: 1 }
                        : { x: i * SPACING, y: 0, opacity: 1, scale: isCenter ? 1.12 : 0.95 }
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
                          : { type: 'spring', stiffness: 180, damping: 20, delay: i * 0.04 }
                }
                className="absolute cursor-pointer outline-none"
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: -CARD_W / 2,
                  marginTop: -CARD_H / 2,
                  width: CARD_W,
                  height: CARD_H,
                  zIndex: isChosen ? 20 : isCenter ? 10 : i,
                }}
              >
                {/* 가운데 온 카드 강조 — 팬 페이즈일 때 */}
                {phase === 'fan' && isCenter && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="pointer-events-none absolute -inset-1.5 -z-10 rounded-xl"
                    style={{ boxShadow: `0 0 24px ${accent}66` }}
                  />
                )}
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
        </motion.div>

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
          카드를 밀어 넘겨서, 끌리는 한 장을 눌러 뽑으세요
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
