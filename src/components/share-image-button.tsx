import { useState } from 'react';
import { shareImageResult, type ShareCardData } from '../lib/share-image.ts';
import { APP_URL } from '../lib/share.ts';

/**
 * 결과 이미지 공유 버튼 — 캔버스 합성 후 파일+텍스트를 공유 시트로 보낸다.
 * 카톡 등은 이미지 공유의 텍스트를 버리므로 설명+링크는 클립보드에 미리 복사해 둔다.
 * 파일 공유 미지원 환경이면 이미지 저장+텍스트 복사.
 */
export function ShareImageButton({ data, label = '이미지+링크로 공유하기', text, url }: {
  data: ShareCardData;
  label?: string;
  /** 이미지와 함께 보낼 텍스트 — 없으면 데이터에서 자동 생성 */
  text?: string;
  /** 이미지와 함께 보낼 링크 — 없으면 앱 주소 */
  url?: string;
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'shared' | 'saved' | 'failed'>('idle');

  async function onClick() {
    if (state === 'busy') return;
    setState('busy');
    const body = [
      text ?? `${data.label ? `${data.label} — ` : ''}${data.big ? `${data.big} ` : ''}${data.title}`,
      url ?? APP_URL(),
    ].join('\n');
    // 클릭 제스처가 살아있는 지금 복사해 두면 카톡처럼 텍스트를 버리는 앱에도 붙여넣기가 된다
    await navigator.clipboard.writeText(body).catch(() => {});
    const r = await shareImageResult(data, { text: body, url: '' });
    if (r === 'canceled') {
      setState('idle');
      return;
    }
    setState(r);
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
      {state === 'shared' && '공유했어요 — 설명·링크도 복사돼 있어요'}
      {state === 'saved' && '이미지 저장됨 — 설명·링크는 복사됐어요'}
      {state === 'failed' && '공유에 실패했어요'}
      {state === 'idle' && label}
    </button>
  );
}
