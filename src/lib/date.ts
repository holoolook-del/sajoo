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
