import { useState } from 'react';
import { shareImageResult, type ShareCardData } from '../lib/share-image.ts';

/** 결과 이미지 공유 버튼 — 캔버스 합성 후 파일 공유/저장 */
export function ShareImageButton({ data, label = '이미지로 공유하기' }: { data: ShareCardData; label?: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'shared' | 'saved' | 'failed'>('idle');

  async function onClick() {
    if (state === 'busy') return;
    setState('busy');
    const r = await shareImageResult(data);
    setState(r === 'failed' ? 'failed' : r);
    setTimeout(() => setState('idle'), 2200);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'busy'}
      className="rounded-lg border border-gold/50 px-4 py-2.5 text-sm text-gold-bright transition-colors hover:bg-gold/10 disabled:opacity-50"
    >
      {state === 'busy' && '이미지 만드는 중…'}
      {state === 'shared' && '공유했어요'}
      {state === 'saved' && '이미지로 저장했어요'}
      {state === 'failed' && '공유에 실패했어요'}
      {state === 'idle' && label}
    </button>
  );
}
