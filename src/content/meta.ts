/** 오행·십신 공용 메타데이터 — 화면 공통으로 쓰는 도메인 상수 */

export type ElementKey = '목' | '화' | '토' | '금' | '수';
export const ELEMENT_KEYS: ElementKey[] = ['목', '화', '토', '금', '수'];

export const ELEMENT_COLOR: Record<ElementKey, string> = {
  목: '#2f8f6e',
  화: '#c8402a',
  토: '#c9a227',
  금: '#d9d4c4',
  수: '#34516e',
};

export const ELEMENT_HANJA: Record<ElementKey, string> = {
  목: '木', 화: '火', 토: '土', 금: '金', 수: '水',
};

export type TenGodKey =
  | '비견' | '겁재' | '식신' | '상관' | '편재'
  | '정재' | '편관' | '정관' | '편인' | '정인';
