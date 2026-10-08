const APP_URL = () => `${location.origin}${import.meta.env.BASE_URL}`;

/** 결과 공유 — Web Share API(카톡 포함 OS 공유 시트) → 미지원·실패 시 클립보드 복사 */
export async function shareResult(
  text: string,
  title = 'SAJOO 사주',
): Promise<'shared' | 'copied' | 'canceled' | 'failed'> {
  const url = APP_URL();
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'canceled'; // 사용자가 닫음
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
