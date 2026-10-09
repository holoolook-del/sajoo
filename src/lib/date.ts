const KST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** KST 기준 'YYYY-MM-DD'. '오늘' 판정(카드 리셋·일진)은 이 함수만 쓴다. */
export function todayKST(now: Date = new Date()): string {
  return KST_FORMATTER.format(now);
}

/** 게시판용 상대 시각 — '방금 전 / N분 전 / N시간 전 / M월 D일' */
export function timeAgo(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
