import { useMemo } from 'react';
import { BackHome } from '../components/back-home.tsx';
import { ShareButton } from '../components/share-button.tsx';
import { ShareImageButton } from '../components/share-image-button.tsx';
import { StateView } from '../components/state-view.tsx';
import { ELEMENT_COLOR, ELEMENT_HANJA, type ElementKey } from '../content/meta.ts';
import { buildDeepReport } from '../features/report/report.ts';
import { PillarTable } from '../features/saju/pillar-table.tsx';
import { useSaju } from '../features/saju/use-saju.ts';
import { interpretSaju } from '../lib/interpret.ts';
import { todayKST } from '../lib/date.ts';
import { ogUrl } from '../lib/og.ts';

const chapterCls = 'rounded-xl border border-gold/30 bg-night-soft p-5';
const chapterH = 'flex items-baseline gap-2 text-sm text-hanji/60';
const chapterNo = 'font-bold text-gold-bright';
const body = 'mt-3 text-sm leading-6 text-hanji/85';

export function ReportPage() {
  const { profile, saju } = useSaju();
  const today = todayKST();
  const report = useMemo(
    () => (saju && profile ? buildDeepReport(saju, profile, today) : null),
    [saju, profile, today],
  );
  const reading = useMemo(() => (saju ? interpretSaju(saju) : null), [saju]);

  if (!saju || !report || !reading) {
    return <StateView message="사주를 계산할 수 없습니다." linkTo="/onboarding" linkLabel="정보 다시 입력" />;
  }

  const { strength, yongsin, daewoon, seun, nextYear } = report;
  const shareText = [
    `${profile?.name ?? '나'}의 심화 사주 리포트`,
    `「${report.headline}」`,
    '',
    report.summary,
    '',
    `용신: ${yongsin.element}(${ELEMENT_HANJA[yongsin.element]}) — ${yongsin.label}`,
    daewoon?.current
      ? `지금의 대운: ${daewoon.current.korean} — ${daewoon.current.stemGod}의 기운`
      : null,
    `올해(${seun.year}): ${seun.korean} — ${seun.stemGod}의 해`,
    '',
    '너의 심화 리포트도 받아봐!',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="pt-6">
        <div className="no-print"><BackHome /></div>
        <p className="no-print mt-2 text-xs tracking-widest text-gold-bright">SAJOO 심층 명식 감정서</p>
        <h1 className="mt-1 text-2xl font-bold text-gold">「{profile?.name}」님의 심화 사주 리포트</h1>
        <p className="mt-1 text-sm text-hanji/60">
          음력 {saju.lunar.year}년 {saju.lunar.month}월 {saju.lunar.day}일 · 만세력 + 명리 해석 · {today} 기준
        </p>
      </header>

      {/* 제1장 — 원국과 총평 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제1장</span> 원국과 총평</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-hanji/10">
          <PillarTable pillars={saju.pillars} />
        </div>
        <p className="mt-4 text-base font-bold text-hanji">「{report.headline}」</p>
        <p className={body}>{report.summary}</p>
        <div className="mt-4 rounded-lg bg-night p-4">
          <p className="text-xs font-bold text-gold-bright">
            격국(格局) — {report.gyeokguk.name} · {report.gyeokguk.god} · {report.gyeokguk.source}
          </p>
          <p className="mt-1 text-sm leading-6 text-hanji/85">{report.gyeokguk.text}</p>
        </div>
        <dl className="mt-3 space-y-2.5 rounded-lg bg-night p-4">
          <div className="flex gap-3 text-sm leading-6">
            <dt className="shrink-0 font-bold text-gold-bright">득령 여부</dt>
            <dd className="text-hanji/85"><span className="font-bold text-hanji">{report.deukryeong.verdict}.</span> {report.deukryeong.text}</dd>
          </div>
          <div className="flex gap-3 text-sm leading-6">
            <dt className="shrink-0 font-bold text-gold-bright">통근</dt>
            <dd className="text-hanji/85">{report.rooted.text}</dd>
          </div>
        </dl>
        <div className="mt-3 rounded-lg bg-night p-4">
          <p className="text-xs font-bold text-gold-bright">
            신강·신약 판정 — {strength.verdict} (돕는 기운 {strength.support} : 새는 기운 {strength.drain})
          </p>
          <p className="mt-1 text-sm leading-6 text-hanji/85">
            <span className="font-bold text-hanji">{strength.title}.</span> {strength.text}
          </p>
          {strength.extreme && (
            <p className="mt-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm leading-6 text-gold-bright/90">
              <span className="font-bold">특수격 후보 — {strength.extreme}.</span> {strength.extremeText}
            </p>
          )}
        </div>
      </section>

      {/* 제2장 — 오행의 균형과 용신 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제2장</span> 오행의 균형과 용신(用神)</h2>
        <p className={body}>
          사주의 균형을 잡아줄 보완의 기운을 용신이라 부릅니다. {yongsin.reason}입니다.
        </p>
        <div
          className="mt-4 rounded-lg border-l-4 bg-night p-4"
          style={{ borderColor: ELEMENT_COLOR[yongsin.element] }}
        >
          <p className="text-sm font-bold" style={{ color: ELEMENT_COLOR[yongsin.element] }}>
            용신 — {yongsin.label}
          </p>
          <dl className="mt-2 space-y-1.5 text-sm leading-6">
            <div className="flex gap-3"><dt className="shrink-0 font-bold text-gold-bright">색</dt><dd className="text-hanji/85">{yongsin.color}</dd></div>
            <div className="flex gap-3"><dt className="shrink-0 font-bold text-gold-bright">방향</dt><dd className="text-hanji/85">{yongsin.direction}</dd></div>
            <div className="flex gap-3"><dt className="shrink-0 font-bold text-gold-bright">계절</dt><dd className="text-hanji/85">{yongsin.season}</dd></div>
            <div className="flex gap-3"><dt className="shrink-0 font-bold text-gold-bright">유리한 달</dt><dd className="text-hanji/85">{yongsin.months}</dd></div>
            <div className="flex gap-3"><dt className="shrink-0 font-bold text-gold-bright">습관</dt><dd className="text-hanji/85">{yongsin.habit}</dd></div>
            <div className="flex gap-3"><dt className="shrink-0 font-bold text-gold-bright">보완</dt><dd className="text-hanji/85">{yongsin.items}</dd></div>
          </dl>
          <p className="mt-2 text-sm leading-6 text-hanji/80">{yongsin.text}</p>
          <p className="mt-2 text-sm leading-6 text-hanji/80">
            <span className="font-bold text-hanji">실전 개운법 —</span> {yongsin.practice}
          </p>
        </div>
        {report.joho && (
          <div
            className="mt-3 rounded-lg border-l-4 bg-night p-4"
            style={{ borderColor: ELEMENT_COLOR[report.joho.element] }}
          >
            <p className="text-sm font-bold" style={{ color: ELEMENT_COLOR[report.joho.element] }}>
              조후용신(調候用神) — {report.joho.element}({ELEMENT_HANJA[report.joho.element]})
              {report.joho.sameAsYongsin && ' · 균형용신과 일치'}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-hanji/80">{report.joho.text}</p>
          </div>
        )}
        <p className="mt-3 text-sm leading-6 text-hanji/85">{reading.balanceText}</p>
      </section>

      {/* 제3장 — 십신의 재능 구조 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제3장</span> 십신으로 읽는 재능의 구조</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {reading.tenGodCounts.map(({ god, count }) => (
            <span key={god} className="rounded-full border border-gold/40 px-3 py-1 text-xs text-hanji/80">
              {god} {count}
            </span>
          ))}
        </div>
        {reading.tenGodTexts.map(({ god, text }) => (
          <p key={god} className={body}>
            <span className="font-bold text-gold-bright">{god}</span> — {text}
          </p>
        ))}
        {report.missingGodGroups.length > 0 && (
          <div className="mt-3 rounded-lg bg-night p-4">
            <p className="text-xs font-bold text-hanji/60">사주에 드러나지 않은 기운</p>
            {report.missingGodGroups.map((g) => (
              <p key={g.group} className="mt-1.5 text-sm leading-6 text-hanji/80">
                <span className="font-bold text-hanji">{g.group}</span> — {g.text}
              </p>
            ))}
          </div>
        )}
        {report.excessGodGroups.length > 0 && (
          <div className="mt-3 rounded-lg bg-night p-4">
            <p className="text-xs font-bold text-hanji/60">넘쳐서 문제가 되는 기운 — 십신 과다(過多)</p>
            {report.excessGodGroups.map((g) => (
              <p key={g.group} className="mt-1.5 text-sm leading-6 text-hanji/80">
                <span className="font-bold text-hanji">{g.group} {g.count}개</span> — {g.text}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* 제4장 — 십이운성: 지지 자리별 인생 단계 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제4장</span> 십이운성(十二運星) — 지지 자리의 인생 단계</h2>
        <p className="mt-2 text-xs leading-5 text-hanji/50">
          일간이 각 지지 자리에서 맞는 기운의 인생 단계 — 씨앗(장생)부터 왕의 자리(제왕), 저장고(묘), 다시 씨 맺기(태)까지.
        </p>
        <ul className="mt-3 space-y-3">
          {report.stages.map((s) => (
            <li key={s.where} className="rounded-lg bg-night p-3.5">
              <p className="text-sm font-bold text-hanji">
                {s.where} {s.branch} — <span className="text-gold-bright">{s.stage}</span>
                <span className="ml-2 text-[11px] font-normal text-hanji/50">{s.stageDesc}</span>
              </p>
              <p className="mt-1.5 text-sm leading-6 text-hanji/85">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 제5장 — 원국의 관계망: 천간 합충 + 지지 합형 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제5장</span> 원국의 관계망 — 천간의 합충·지지의 합형</h2>
        {report.stemRelations.length === 0 && report.relations.length === 0 && report.formations.length === 0 ? (
          <p className={body}>사주 글자 사이에 뚜렷한 합·충 관계가 없습니다 — 자리 간의 긴장이 적은 편이라, 흐름이 온전히 오행의 균형에 달려 있습니다.</p>
        ) : (
          <>
            {report.formations.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-hanji/60">국(局) — 지지가 모여 이루는 큰 기운</p>
                <ul className="mt-2 space-y-3">
                  {report.formations.map((f) => (
                    <li key={f.name} className="rounded-lg border border-gold/30 bg-night p-3.5">
                      <p className="text-sm font-bold text-hanji">
                        {f.kind} — <span className="text-gold-bright">{f.name}</span>
                        <span
                          className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] font-normal ${
                            f.favor === '용신운'
                              ? 'border-gold bg-gold/15 text-gold-bright'
                              : f.favor === '기신운'
                                ? 'border-hanji/30 text-hanji/60'
                                : 'border-hanji/15 text-hanji/50'
                          }`}
                        >
                          {f.favor}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-hanji/50">{f.members} → {f.god}의 기운으로 결집</p>
                      <p className="mt-1.5 text-sm leading-6 text-hanji/85">{f.text}</p>
                      {f.damage && (
                        <p className="mt-1.5 rounded bg-dancheong/10 px-2.5 py-1.5 text-xs leading-5 text-dancheong">
                          {f.damage}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.stemRelations.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-hanji/60">천간(天干) — 하늘의 글자끼리 맺는 결</p>
                <ul className="mt-2 space-y-3">
                  {report.stemRelations.map((r) => (
                    <li key={`${r.pair}-${r.name}`} className="rounded-lg bg-night p-3.5">
                      <p className="text-sm font-bold text-hanji">
                        {r.pair} — <span className="text-gold-bright">{r.name}</span>
                        <span className="ml-2 text-[11px] font-normal text-hanji/50">{r.hanja}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-hanji/50">{r.gods}의 결 · {r.adjacent ? '이웃한 자리 — 강하게 작용' : '떨어진 자리 — 약하게 작용'}</p>
                      <p className="mt-1.5 text-sm leading-6 text-hanji/85">{r.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.relations.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-hanji/60">지지(地支) — 땅의 글자끼리 맺는 결</p>
                <ul className="mt-2 space-y-3">
                  {report.relations.map((r) => (
                    <li key={r.pair} className="rounded-lg bg-night p-3.5">
                      <p className="text-sm font-bold text-hanji">
                        {r.pair} — <span className="text-gold-bright">{r.kind}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-hanji/50">{r.positionText}</p>
                      <p className="mt-1.5 text-sm leading-6 text-hanji/85">{r.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* 제6장 — 신살과 공망 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제6장</span> 사주에 박힌 별 — 신살·공망</h2>
        {report.sinsal.length === 0 && report.voids.length === 0 ? (
          <p className={body}>눈에 띄는 신살·공망이 없습니다 — 뚜렷한 별의 흔적보다 오행과 십신의 흐름으로 읽는 사주입니다.</p>
        ) : (
          <>
            {report.sinsal.length > 0 && (
              <ul className="mt-3 space-y-3">
                {report.sinsal.map((s) => (
                  <li key={s.key}>
                    <p className="text-sm font-bold text-hanji">
                      {s.name} <span className="text-hanji/50">{s.hanja}</span>
                      <span className="ml-2 rounded-full border border-gold/40 px-2 py-0.5 text-[10px] text-gold-bright">{s.where}</span>
                    </p>
                    <p className="mt-1 text-sm leading-6 text-hanji/80">{s.text}</p>
                  </li>
                ))}
              </ul>
            )}
            {report.voids.length > 0 && (
              <div className="mt-4 rounded-lg bg-night p-4">
                <p className="text-xs font-bold text-hanji/60">공망(空亡) — 기운이 비는 자리</p>
                {report.voids.map((v) => (
                  <p key={v.where} className="mt-1.5 text-sm leading-6 text-hanji/80">
                    <span className="font-bold text-hanji">{v.where} {v.branch}의 {v.god}</span> — {v.text}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* 제7장 — 대운의 물줄기 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제7장</span> 인생의 큰 물줄기 — 대운(大運)</h2>
        {daewoon ? (
          <>
            <p className="mt-2 text-xs text-hanji/50">{daewoon.directionLabel} · {daewoon.startAge}세부터 시작</p>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {daewoon.list.map((d) => (
                <div
                  key={d.age}
                  className={`flex w-14 shrink-0 flex-col items-center rounded-lg border p-2 ${
                    d.current
                      ? 'border-gold bg-gold/15 shadow-[0_0_12px_rgba(201,162,39,0.3)]'
                      : 'border-hanji/15 bg-night'
                  }`}
                >
                  <span className="text-[10px] text-hanji/50">{d.age}세~</span>
                  <span className="mt-1 text-lg font-bold text-hanji">{d.hanja}</span>
                  <span className="text-xs text-gold-bright">{d.korean}</span>
                  <span className="mt-1 text-[10px] text-hanji/60">{d.stemGod}</span>
                </div>
              ))}
            </div>
            {daewoon.current && (
              <div className="mt-3 rounded-lg bg-night p-4">
                <p className="text-sm font-bold text-gold-bright">
                  지금의 대운 — {daewoon.current.korean}({daewoon.current.hanja}) · {daewoon.current.age}세~{daewoon.current.age + 9}세
                </p>
                <span
                  className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] ${
                    daewoon.current.favor === '용신운'
                      ? 'border-gold bg-gold/15 text-gold-bright'
                      : daewoon.current.favor === '기신운'
                        ? 'border-hanji/30 text-hanji/60'
                        : 'border-hanji/15 text-hanji/50'
                  }`}
                >
                  {daewoon.current.favor}
                </span>
                <p className="mt-2 text-sm leading-6 text-hanji/85">{daewoon.current.stemText}</p>
                {daewoon.current.branchGod !== daewoon.current.stemGod && (
                  <p className="mt-1.5 text-sm leading-6 text-hanji/70">
                    <span className="font-bold text-hanji/80">속의 흐름 — {daewoon.current.branchGod}:</span> {daewoon.current.branchText}
                  </p>
                )}
                <p className="mt-1.5 text-xs leading-5 text-hanji/55">{daewoon.current.favorText}</p>
                <p className="mt-1.5 text-xs leading-5 text-hanji/55">
                  이 대운에서 내 기운의 단계 — <span className="font-bold text-hanji/75">{daewoon.current.stage}({daewoon.current.stageDesc})</span>. {daewoon.current.stageText}
                </p>
              </div>
            )}
            {report.luckRelations.filter((l) => l.source === '대운').length > 0 && (
              <div className="mt-3 rounded-lg bg-night p-4">
                <p className="text-xs font-bold text-hanji/60">이 대운이 건드리는 내 사주의 자리</p>
                {report.luckRelations.filter((l) => l.source === '대운').map((l) => (
                  <p key={l.pair} className="mt-1.5 text-sm leading-6 text-hanji/80">
                    <span className="font-bold text-hanji">{l.pair} — {l.kind}</span><br />{l.text}
                  </p>
                ))}
              </div>
            )}
            {daewoon.next && (
              <p className="mt-3 text-sm leading-6 text-hanji/70">
                <span className="font-bold text-hanji/80">다음 대운 예고 — {daewoon.next.age}세부터 {daewoon.next.korean}:</span> {daewoon.next.stemText}
              </p>
            )}
          </>
        ) : (
          <p className={body}>생시를 입력하면 대운의 흐름까지 읽을 수 있습니다 — 사주 페이지에서 태어난 시간을 추가해 보세요.</p>
        )}
      </section>

      {/* 제8장 — 올해와 내년 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제8장</span> 올해와 내년 — 세운(歲運)</h2>
        {([seun, nextYear] as const).map((s, i) => (
          <div key={s.year} className="mt-3 rounded-lg bg-night p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-gold/50 bg-night-soft">
                <span className="text-xl font-bold text-hanji">{s.hanja}</span>
                <span className="text-[11px] text-gold-bright">{s.korean}</span>
              </div>
              <div className="text-sm font-bold text-hanji">
                {s.year}년{i === 0 ? ' — 올해' : ' — 내년'}
                <span className="block text-xs font-normal text-hanji/50">
                  {s.stemGod}·{s.branchGod}의 기운
                </span>
                <span
                  className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-normal ${
                    s.favor === '용신운'
                      ? 'border-gold bg-gold/15 text-gold-bright'
                      : s.favor === '기신운'
                        ? 'border-hanji/30 text-hanji/60'
                        : 'border-hanji/15 text-hanji/50'
                  }`}
                >
                  {s.favor}
                </span>
              </div>
            </div>
            <p className="mt-2.5 text-sm leading-6 text-hanji/85">{s.text}</p>
            <p className="mt-1 text-xs leading-5 text-hanji/55">{s.favorText}</p>
          </div>
        ))}
        {report.luckRelations.filter((l) => l.source === '세운').length > 0 && (
          <div className="mt-3 rounded-lg bg-night p-4">
            <p className="text-xs font-bold text-hanji/60">올해의 기운이 건드리는 내 사주의 자리</p>
            {report.luckRelations.filter((l) => l.source === '세운').map((l) => (
              <p key={l.pair} className="mt-1.5 text-sm leading-6 text-hanji/80">
                <span className="font-bold text-hanji">{l.pair} — {l.kind}</span><br />{l.text}
              </p>
            ))}
          </div>
        )}
        {report.wolun && (
          <div className="mt-4">
            <p className="text-xs font-bold text-hanji/60">올해의 달별 흐름 — {seun.year}년 월운(月運)</p>
            {(() => {
              const best = report.wolun!.filter((w) => w.favor === '용신운').map((w) => `${w.month}월`);
              return best.length > 0 ? (
                <p className="mt-1.5 text-xs leading-5 text-gold-bright">가장 유리한 달 — {best.join('·')}</p>
              ) : (
                <p className="mt-1.5 text-xs leading-5 text-hanji/50">올해는 뚜렷한 용신운의 달이 없습니다 — 중립운의 달이 오히려 내 뜻대로 움직이기 좋은 시기입니다.</p>
              );
            })()}
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {report.wolun.map((m) => (
                <div
                  key={m.month}
                  className={`rounded-lg border px-1.5 py-2 text-center ${
                    m.current
                      ? 'border-gold bg-gold/15'
                      : 'border-hanji/15 bg-night'
                  }`}
                >
                  <p className="text-[10px] text-hanji/50">{m.month}월</p>
                  <p className="mt-0.5 text-sm font-bold text-hanji">{m.hanja}</p>
                  <p className="text-[10px] text-gold-bright">{m.stemGod}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      m.favor === '용신운'
                        ? 'font-bold text-gold-bright'
                        : m.favor === '기신운'
                          ? 'text-hanji/60'
                          : 'text-hanji/40'
                    }`}
                  >
                    {m.favor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 제9장 — 고민별 상담소 */}
      <section className={chapterCls}>
        <h2 className={chapterH}><span className={chapterNo}>제9장</span> 고민별 상담소</h2>
        <dl className="mt-3 space-y-4">
          {reading.concerns.map((c) => (
            <div key={c.key}>
              <dt className="text-sm font-bold text-gold-bright">{c.label}</dt>
              <dd className="mt-1 text-sm leading-6 text-hanji/85">{c.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 제10장 — 종합 조언 */}
      <section className="rounded-xl border-2 border-gold/50 bg-night-soft p-5 shadow-[0_0_24px_rgba(201,162,39,0.12)]">
        <h2 className={chapterH}><span className={chapterNo}>제10장</span> 종합 조언</h2>
        <ul className="mt-3 space-y-3">
          {report.advice.map((a, i) => (
            <li key={i} className="rounded-lg bg-night p-4 text-sm leading-6 text-hanji/85">{a}</li>
          ))}
        </ul>
        <div className="no-print mt-4 flex flex-wrap justify-center gap-2">
          <ShareButton label="내 심화 리포트 공유하기" text={shareText} url={ogUrl('report')} />
          <ShareImageButton
            label="감정서 이미지로 공유하기"
            data={{
              label: '심화 사주 리포트',
              big: saju.dayMaster.hanja,
              accent: ELEMENT_COLOR[saju.dayMaster.element as ElementKey],
              title: report.gyeokguk.name,
              subtitle: `${saju.dayMaster.korean} — ${strength.verdict}의 사주`,
              lines: [
                `용신 — ${yongsin.element}(${ELEMENT_HANJA[yongsin.element]}): ${yongsin.label}`,
                daewoon?.current
                  ? `지금의 대운 — ${daewoon.current.korean}: ${daewoon.current.stemGod}의 기운`
                  : '',
                `올해(${seun.year}) — ${seun.korean}: ${seun.stemGod}의 해`,
                report.summary.slice(0, 90) + '…',
              ].filter(Boolean),
            }}
            text={shareText}
            url={ogUrl('report')}
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-gold/40 bg-night px-5 py-2 text-sm font-bold text-gold-bright transition hover:bg-gold/10"
          >
            인쇄·PDF로 저장
          </button>
        </div>
      </section>

      <p className="text-center text-[10px] leading-4 text-hanji/30">
        만세력 — 한국천문연구원 간지 데이터 기반 · 해석 — 명리 정통 관법(신강신약·용신·십신·합충형해·대운·세운) 정리 · 재미로 보는 참고 자료
      </p>
    </main>
  );
}
