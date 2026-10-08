import { ELEMENT_COLOR, type ElementKey } from '../../content/meta.ts';
import type { SajuPillar } from '../../lib/engine.ts';

const COLS = [
  { key: 'hour' as const, label: '시주' },
  { key: 'day' as const, label: '일주' },
  { key: 'month' as const, label: '월주' },
  { key: 'year' as const, label: '연주' },
];

const ROWS = [
  { kind: 'tenGodStem' as const, cls: 'text-[11px] text-hanji/60' },
  { kind: 'stem' as const, cls: '' },
  { kind: 'tenGodBranch' as const, cls: 'text-[11px] text-hanji/60' },
  { kind: 'branch' as const, cls: '' },
  { kind: 'korean' as const, cls: 'text-sm font-bold text-gold-bright' },
];

const cellCls = 'border border-hanji/15 px-1 py-2 text-center';

function Char({ hanja, element, yinYang }: { hanja: string; element: string; yinYang: string }) {
  const color = ELEMENT_COLOR[element as ElementKey] ?? '#f3ead7';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-bold" style={{ color }}>{hanja}</span>
      <span className="text-[10px] text-hanji/50">{element}·{yinYang}</span>
    </div>
  );
}

function Cell({ p, kind }: { p: SajuPillar | null; kind: (typeof ROWS)[number]['kind'] }) {
  if (p === null) {
    if (kind === 'korean') return null;
    return kind === 'stem' || kind === 'branch'
      ? <span className="text-sm text-hanji/40">미입력</span>
      : <span className="text-hanji/30">—</span>;
  }
  switch (kind) {
    case 'tenGodStem': return <>{p.tenGodStem}</>;
    case 'tenGodBranch': return <>{p.tenGodBranch}</>;
    case 'korean': return <>{p.korean}</>;
    case 'stem': return <Char hanja={p.stemHanja} element={p.stemElement} yinYang={p.stemYinYang} />;
    case 'branch': return <Char hanja={p.branchHanja} element={p.branchElement} yinYang={p.branchYinYang} />;
  }
}

/** 만세력식 팔자표 — 행: 십신·천간·십신·지지·주명, 열: 시~연주 (생시 없으면 시주 빈칸) */
export function PillarTable({
  pillars,
}: {
  pillars: { year: SajuPillar; month: SajuPillar; day: SajuPillar; hour: SajuPillar | null };
}) {
  return (
    <table className="w-full table-fixed border-collapse" aria-label="사주팔자표">
      <thead>
        <tr>
          {COLS.map((c) => (
            <th key={c.key} className={`${cellCls} bg-night-soft text-xs text-hanji/50`} scope="col">{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.kind}>
            {COLS.map((c) => (
              <td key={c.key} className={`${cellCls} ${row.cls}`}>
                <Cell p={pillars[c.key]} kind={row.kind} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
