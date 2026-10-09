import { useState } from 'react';
import { shareResult } from '../lib/share.ts';

/** 결과 공유 버튼 — 공유 시트를 열거나 클립보드 복사 후 피드백 */
export function ShareButton({ text, label = '결과 공유하기', url }: { text: string; label?: string; url?: string }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');
  return (
    <button
      type="button"
      onClick={async () => {
        const r = await shareResult(text, undefined, url);
        if (r === 'copied') {
          setState('copied');
          setTimeout(() => setState('idle'), 2000);
        }
      }}
      className="rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-night transition-colors hover:bg-gold-bright"
    >
      {state === 'copied' ? '링크 복사됐어요 — 친구에게 붙여넣으세요' : label}
    </button>
  );
}
