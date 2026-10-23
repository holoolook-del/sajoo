import { useMemo } from 'react';
import { BackHome } from '../components/back-home.tsx';
import { ShareImageButton } from '../components/share-image-button.tsx';
import { SoundToggle } from '../components/sound-toggle.tsx';
import { schoolFortune, schoolSummary, type SchoolLuck } from '../content/school-fortune.ts';
import { todayKST } from '../lib/date.ts';
import { ogUrl } from '../lib/og.ts';
import type { Grade } from '../lib/types.ts';

const GRADE_CLS: Record<Grade, string> = {
  대길: 'text-gold-bright',
  길: 'text-gold',
  평: 'text-hanji',
  흉: 'text-[#e8905d]',
  대흉: 'text-[#c8402a]',
};

function starsOf(l: SchoolLuck): string {
  return '★'.repeat(l.stars) + '☆'.repeat(5 - l.stars);
}

export function SchoolPage() {
  const today = todayKST();
  const lucks = useMemo(() => schoolFortune(today), [today]);
  const summary = schoolSummary(lucks);
  const [, m, d] = today.split('-');
  const top = [...lucks].sort((a, b) => b.stars - a.stars)[0]!;

  const shareText = [
    `오늘의 학교 운세 (${Number(m)}월 ${Number(d)}일)`,
    ...lucks.map((l) => `${l.cat.emoji} ${l.cat.label} ${starsOf(l)} — ${l.msg}`),
    `총평: ${summary.text}`,
    '너도 오늘의 학교 운세 확인해 봐!',
  ].join('\n');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="pt-6">
        <div className="flex items-center justify-between">
          <BackHome />
          <SoundToggle />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gold">오늘의 학교 운세</h1>
        <p className="mt-1 text-sm text-hanji/60">
          {Number(m)}월 {Number(d)}일 — 급식·숙제·친구·게임, 오늘 운은?
        </p>
      </header>

      <section className="rounded-xl border border-gold/50 bg-night-soft p-4 text-center">
        <p className="text-sm text-hanji/60">오늘의 총평</p>
        <p className="mt-1 text-lg font-bold text-gold-bright">{summary.text}</p>
      </section>

      <section className="flex flex-col gap-3">
        {lucks.map((l) => (
          <div key={l.cat.id} className="rounded-xl border border-gold/30 bg-night-soft p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-hanji">
                <span className="mr-1.5" aria-hidden>{l.cat.emoji}</span>
                {l.cat.label}
              </p>
              <p className={`text-sm font-bold ${GRADE_CLS[l.grade]}`}>
                {l.grade} <span className="text-xs tracking-tighter">{starsOf(l)}</span>
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-hanji/80">{l.msg}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col items-center gap-2">
        <ShareImageButton
          label="친구에게 자랑하기"
          text={shareText}
          url={ogUrl('school')}
          data={{
            label: '오늘의 학교 운세',
            title: `${Number(m)}월 ${Number(d)}일`,
            big: top.cat.emoji,
            lines: lucks.map((l) => `${l.cat.emoji} ${l.cat.label} ${starsOf(l)}`),
            keywords: ['학교운세', '급식운', '숙제운', '친구운', '게임운'],
          }}
        />
        <p className="text-xs text-hanji/40">같은 날엔 친구들도 같은 결과 — 내일 또 바뀌어요</p>
      </div>
    </main>
  );
}
