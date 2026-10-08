import { Link } from 'react-router-dom';
import { ELEMENT_COLOR, ELEMENT_HANJA, type ElementKey } from '../content/meta.ts';
import { ELEMENT_TEXT } from '../content/interpret.ts';
import { interpretSaju } from '../lib/interpret.ts';
import { PillarTable } from '../features/saju/pillar-table.tsx';
import { useSaju } from '../features/saju/use-saju.ts';
import { StateView } from '../components/state-view.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { useMemo } from 'react';

export function SajuPage() {
  const { profile, saju } = useSaju();
  const reading = useMemo(() => (saju ? interpretSaju(saju) : null), [saju]);

  if (!saju || !reading) {
    return <StateView message="사주를 계산할 수 없습니다." linkTo="/onboarding" linkLabel="정보 다시 입력" />;
  }

  const { pillars, dayMaster, lunar, hourIncluded, voidBranches } = saju;
  const maxEl = Math.max(...reading.elementCounts.map((e) => e.count), 1);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-6">
        <Link to="/" className="text-sm text-hanji/50">← 홈</Link>
        <h1 className="mt-2 text-2xl font-bold text-gold">{profile?.name}님의 사주팔자</h1>
        <p className="mt-1 text-sm text-hanji/60">
          음력 {lunar.year}년 {lunar.month}월 {lunar.day}일{lunar.isLeapMonth ? ' (윤달)' : ''}
          {!hourIncluded && ' · 시주 미입력(3주로 계산)'}
        </p>
      </header>

      {/* 만세력식 팔자표 */}
      <section className="overflow-hidden rounded-xl border border-gold/30 bg-night-soft">
        <PillarTable pillars={pillars} />
        <p className="border-t border-hanji/10 px-3 py-2 text-xs text-hanji/50">
          공망(空亡): {voidBranches.join('·')} — 해당 지지의 기운이 비어 있어 그 자리의 십신이 약해집니다.
        </p>
      </section>

      {/* 나의 사주 캐릭터 — 일간을 공유하기 좋은 유형 카드로 */}
      <section className="rounded-xl border-2 border-gold/50 bg-night-soft p-5 text-center shadow-[0_0_24px_rgba(201,162,39,0.12)]">
        <p className="text-xs tracking-widest text-gold-bright">나의 사주 캐릭터</p>
        <p className="mt-3 text-4xl font-bold" style={{ color: ELEMENT_COLOR[dayMaster.element as ElementKey] }}>
          {dayMaster.hanja}
        </p>
        <p className="mt-1 text-xl font-bold text-hanji">
          「{reading.dayMaster.title}」
        </p>
        <p className="mt-1 text-xs text-hanji/50">
          {dayMaster.korean} — {reading.dayMaster.nature}, {dayMaster.element}의 {dayMaster.yinYang} 기운
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {reading.dayMaster.keywords.map((k) => (
            <span key={k} className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold-bright">
              #{k}
            </span>
          ))}
        </div>
        <p className="mt-4 text-left text-sm leading-6 text-hanji/85">{reading.dayMaster.text}</p>
        <dl className="mt-4 space-y-2.5 rounded-lg bg-night p-4 text-left">
          {(
            [
              ['사람들이 보는 나', reading.dayMaster.social.seen],
              ['내가 잘하는 것', reading.dayMaster.social.good],
              ['조심할 점', reading.dayMaster.social.watch],
              ['친해지면', reading.dayMaster.social.bond],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex gap-3 text-sm leading-6">
              <dt className="shrink-0 font-bold text-gold-bright">{label}</dt>
              <dd className="text-hanji/85">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <ShareButton
            label="내 사주 캐릭터 공유하기"
            text={`${profile?.name ?? '나'}의 사주 캐릭터는 「${reading.dayMaster.title}」(${dayMaster.korean}${dayMaster.hanja}) — ${reading.dayMaster.keywords.map((k) => '#' + k).join(' ')}\n너의 사주 캐릭터도 확인해봐!`}
          />
        </div>
      </section>

      {/* 오행 분포 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-5">
        <h2 className="text-sm text-hanji/60">오행(五行) 분포</h2>
        <div className="mt-3 flex items-end gap-3">
          {reading.elementCounts.map(({ element, count }) => (
            <div key={element} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(count / maxEl) * 100}%`,
                    backgroundColor: ELEMENT_COLOR[element],
                    minHeight: count > 0 ? '6px' : '2px',
                    opacity: count > 0 ? 1 : 0.25,
                  }}
                />
              </div>
              <span className="text-xs font-bold text-hanji">{ELEMENT_HANJA[element]}</span>
              <span className="text-[10px] text-hanji/50">{element} {count}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-hanji/85">{reading.balanceText}</p>
      </section>

      {/* 오행별 의미 */}
      <section className="rounded-xl border border-hanji/15 bg-night-soft p-5">
        <h2 className="text-sm text-hanji/60">오행의 의미</h2>
        <ul className="mt-3 space-y-2">
          {reading.elementCounts.map(({ element }) => (
            <li key={element} className="text-sm leading-6">
              <span className="font-bold" style={{ color: ELEMENT_COLOR[element] }}>
                {element}({ELEMENT_HANJA[element]})
              </span>
              <span className="text-hanji/50"> {ELEMENT_TEXT[element].virtue}</span>
              <span className="text-hanji/80"> — {ELEMENT_TEXT[element].text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 십신 해석 */}
      <section className="rounded-xl border border-gold/30 bg-night-soft p-5">
        <h2 className="text-sm text-hanji/60">십신(十神) — 사주에 드러난 성향</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {reading.tenGodCounts.map(({ god, count }) => (
            <span
              key={god}
              className="rounded-full border border-gold/40 px-3 py-1 text-xs text-hanji/80"
            >
              {god} {count}
            </span>
          ))}
        </div>
        {reading.tenGodTexts.map(({ god, text }) => (
          <p key={god} className="mt-3 text-sm leading-6 text-hanji/85">
            <span className="font-bold text-gold-bright">{god}</span> — {text}
          </p>
        ))}
      </section>
    </main>
  );
}
