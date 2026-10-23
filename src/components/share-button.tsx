import { useState } from 'react';
import { kakaoReady, shareToKakao } from '../lib/kakao.ts';
import { APP_URL, shareResult } from '../lib/share.ts';

/**
 * 결과 공유 버튼 — 공유 시트를 열거나 클립보드 복사 후 피드백.
 * kakaoReady면 '카톡으로 공유'도 함께 — 이미지 없이 텍스트+링크 피드 메시지로 간다.
 * 이미지 카드까지 보내려면 ShareImageButton 사용 (그쪽에 카톡 버튼이 이미 있으므로
 * 함께 쓰는 페이지는 kakao=false로 둔다).
 */
export function ShareButton({ text, label = '결과 공유하기', url, kakao = true }: {
  text: string;
  label?: string;
  url?: string;
  kakao?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');
  const [kakaoState, setKakaoState] = useState<'idle' | 'busy' | 'shared' | 'failed'>('idle');
  const link = url ?? APP_URL();

  async function onKakao() {
    if (kakaoState === 'busy') return;
    setKakaoState('busy');
    const r = await shareToKakao({
      title: text.split('\n')[0] || 'SAJOO',
      description: text,
      url: link,
    });
    setKakaoState(r);
    setTimeout(() => setKakaoState('idle'), 2200);
  }

  return (
    <>
      {kakao && kakaoReady && (
        <button
          type="button"
          onClick={() => void onKakao()}
          disabled={kakaoState === 'busy'}
          className="rounded-lg bg-[#FEE500] px-4 py-2.5 text-sm font-bold text-[#191919] transition-colors hover:brightness-95 disabled:opacity-50"
        >
          {kakaoState === 'busy' && '카톡 여는 중…'}
          {kakaoState === 'shared' && '카톡으로 보냈어요'}
          {kakaoState === 'failed' && '카톡 공유에 실패했어요'}
          {kakaoState === 'idle' && '카톡으로 공유'}
        </button>
      )}
      <button
        type="button"
        onClick={async () => {
          const r = await shareResult(text, undefined, link);
          if (r === 'copied') {
            setState('copied');
            setTimeout(() => setState('idle'), 2000);
          }
        }}
        className="rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-night transition-colors hover:bg-gold-bright"
      >
        {state === 'copied' ? '링크 복사됐어요 — 친구에게 붙여넣으세요' : label}
      </button>
    </>
  );
}
