import { describe, expect, it } from 'vitest';
import { checkText, POST_MAX_LEN } from './filter.ts';
import { genNickname } from './nickname.ts';

describe('checkText', () => {
  it('정상 텍스트는 통과', () => {
    expect(checkText('오늘 운세가 좋았어요', POST_MAX_LEN).ok).toBe(true);
  });
  it('빈·공백 텍스트는 거부', () => {
    expect(checkText('', POST_MAX_LEN).ok).toBe(false);
    expect(checkText('   ', POST_MAX_LEN).ok).toBe(false);
  });
  it('길이 초과는 거부', () => {
    expect(checkText('가'.repeat(POST_MAX_LEN + 1), POST_MAX_LEN).ok).toBe(false);
    // 같은 글자 반복은 도배 필터에 걸리므로, 경계값은 순환 텍스트로 검사
    const t = '가나다라마바사아자차카타파하'.repeat(POST_MAX_LEN / 14);
    expect(checkText(t, POST_MAX_LEN).ok).toBe(true);
  });
  it('같은 글자 도배는 거부', () => {
    expect(checkText('ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ', POST_MAX_LEN).ok).toBe(false);
    expect(checkText('ㅋㅋㅋㅋㅋㅋㅋ', POST_MAX_LEN).ok).toBe(true); // 7회까지 허용
  });
  it('욕설은 거부', () => {
    expect(checkText('이런 시발', POST_MAX_LEN).ok).toBe(false);
    expect(checkText('ㅅㅂㅅㅂ', POST_MAX_LEN).ok).toBe(false);
    expect(checkText('개새끼야', POST_MAX_LEN).ok).toBe(false);
  });
  it('링크·광고는 거부', () => {
    expect(checkText('http://scam.com 들어와봐', POST_MAX_LEN).ok).toBe(false);
    expect(checkText('https://naver.com', POST_MAX_LEN).ok).toBe(false);
    expect(checkText('텔레그램으로 와', POST_MAX_LEN).ok).toBe(false);
    expect(checkText('부업 문의 주세요', POST_MAX_LEN).ok).toBe(false);
  });
});

describe('genNickname', () => {
  it('수식어+동물+숫자 형태로 만든다', () => {
    const nick = genNickname(() => 0.5);
    expect(nick).toMatch(/^\D+\d{2}$/u);
    expect(nick.length).toBeLessThanOrEqual(12);
  });
  it('시드가 달라도 12자 이내', () => {
    for (const r of [0, 0.99, 0.1]) {
      expect(genNickname(() => r).length).toBeLessThanOrEqual(12);
    }
  });
});
