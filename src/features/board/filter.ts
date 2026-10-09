/**
 * 게시판 텍스트 검사 — 순수 함수 (테스트 대상).
 * 욕설·도배·광고성 패턴을 걸러내고 사유를 돌려준다.
 * 서버 측 방어는 firestore.rules의 길이·필드 검증이 따로 담당한다.
 */

// 심한 욕설·혐오어만 — 가벼운 비속어는 막지 않는다 (자유게시판 성격)
const BLOCKED = [
  '시발', '씨발', 'ㅅㅂ', 'ㅆㅂ', '개새끼', '개새', '지랄', '병신', 'ㅂㅅ',
  '좆', '보지', '자지', '섹스', 'sex', 'fuck', '미친놈', '미친년',
  '니애미', '느금마', '창녀', '걸레',
];

const AD_PATTERNS = [
  /https?:\/\//i, // 링크 전면 차단 — 피싱·광고 방지
  /텔레그램|카톡방|오픈채팅/i,
  /(대출|투자|코인|수익률|부업|재테크).*(문의|상담|링크|연락)/,
];

export const POST_MAX_LEN = 300;
export const COMMENT_MAX_LEN = 150;
export const NICK_MAX_LEN = 12;

export interface CheckResult {
  ok: boolean;
  reason?: string;
}

export function checkText(text: string, maxLen: number): CheckResult {
  const t = text.trim();
  if (!t) return { ok: false, reason: '내용을 입력해 주세요' };
  if (t.length > maxLen) return { ok: false, reason: `${maxLen}자 이내로 적어주세요` };
  // 같은 글자 8회 이상 반복 — 도배 방지
  if (/(.)\1{7,}/u.test(t)) return { ok: false, reason: '같은 글자를 반복할 수 없어요' };

  const lowered = t.toLowerCase().replace(/\s+/g, '');
  if (BLOCKED.some((w) => lowered.includes(w))) {
    return { ok: false, reason: '부적절한 표현이 포함되어 있어요' };
  }
  if (AD_PATTERNS.some((re) => re.test(t))) {
    return { ok: false, reason: '링크나 광고성 내용은 올릴 수 없어요' };
  }
  return { ok: true };
}
