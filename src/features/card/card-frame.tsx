import type { CardDef, CardElement } from '../../content/cards.ts';
import type { Grade } from '../../lib/types.ts';

/** 오행 전통색 — 카드 테두리·광원에 사용 */
const ELEMENT_COLOR: Record<CardElement, string> = {
  목: '#2f8f6e',
  화: '#c8402a',
  토: '#c9a227',
  금: '#d9d4c4',
  수: '#34516e',
};

export const GRADE_COLOR: Record<Grade, string> = {
  대길: 'text-gold-bright',
  길: 'text-gold',
  평: 'text-hanji/80',
  흉: 'text-vermilion',
  대흉: 'text-vermilion',
};

export function cardElementColor(element: CardElement): string {
  return ELEMENT_COLOR[element];
}

/** 카드 뒷면 — 금색 문양 */
export function CardBack({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-xl border-2 border-gold/70 bg-night-soft shadow-[0_0_24px_rgba(201,162,39,0.25)] ${className}`}
    >
      <div className="flex h-4/5 w-4/5 items-center justify-center rounded-lg border border-gold/40 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.14),transparent_70%)]">
        <span className="text-3xl font-bold text-gold/80">命</span>
      </div>
    </div>
  );
}

/** 카드 앞면 — 한자 + 이름 + 오행색 테두리 */
export function CardFront({ card, className = '' }: { card: CardDef; className?: string }) {
  const c = cardElementColor(card.element);
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-between rounded-xl border-2 bg-night-soft p-3 ${className}`}
      style={{ borderColor: c, boxShadow: `0 0 32px ${c}55, inset 0 0 24px ${c}22` }}
    >
      <span className={`text-xs font-bold ${GRADE_COLOR[card.grade]}`}>{card.grade}</span>
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl font-bold text-hanji">{card.hanja.slice(0, 2)}</span>
        <span className="text-sm text-hanji/70">{card.name}</span>
      </div>
      <span className="text-[10px]" style={{ color: c }}>{card.element}의 기운</span>
    </div>
  );
}
