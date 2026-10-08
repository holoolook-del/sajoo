import type { CardDef } from '../../content/cards.ts';
import { ELEMENT_COLOR, type ElementKey } from '../../content/meta.ts';
import type { Grade } from '../../lib/types.ts';

export const GRADE_COLOR: Record<Grade, string> = {
  대길: 'text-gold-bright',
  길: 'text-gold',
  평: 'text-hanji/80',
  흉: 'text-vermilion',
  대흉: 'text-vermilion',
};

export function cardElementColor(element: ElementKey): string {
  return ELEMENT_COLOR[element];
}

const ASSET = (p: string) => `${import.meta.env.BASE_URL}assets/${p}`;

/** 카드 뒷면 — 생성된 단청 문양 이미지 (없으면 금색 命 문양으로 대체) */
export function CardBack({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl border-2 border-gold/70 bg-night-soft shadow-[0_0_24px_rgba(201,162,39,0.25)] ${className}`}
    >
      <img
        src={ASSET('card-back.webp')}
        alt=""
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
        }}
      />
      <span className="absolute inset-0 -z-10 flex items-center justify-center text-3xl font-bold text-gold/80">命</span>
    </div>
  );
}

/** 카드 앞면 — 생성된 민화 일러스트 + 이름·등급·오행 오버레이 */
export function CardFront({ card, className = '' }: { card: CardDef; className?: string }) {
  const c = cardElementColor(card.element);
  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl border-2 bg-night-soft ${className}`}
      style={{ borderColor: c, boxShadow: `0 0 32px ${c}55, inset 0 0 24px ${c}22` }}
    >
      <img
        src={ASSET(`cards/${card.id}.webp`)}
        alt={card.name}
        className="absolute inset-0 h-full w-full scale-[1.12] object-cover"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-between bg-gradient-to-b from-night/70 via-transparent to-night/80 p-3">
        <span className={`text-xs font-bold ${GRADE_COLOR[card.grade]}`}>{card.grade}</span>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-hanji drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{card.name}</span>
          <span className="text-[10px] text-hanji/80">{card.hanja}</span>
        </div>
        <span className="text-[10px]" style={{ color: c }}>{card.element}의 기운</span>
      </div>
    </div>
  );
}
