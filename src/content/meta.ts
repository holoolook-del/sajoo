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

/** 오행 상생: A가 생하는 오행 (목→화→토→금→수→목) */
export const ELEMENT_GENERATES: Record<ElementKey, ElementKey> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
};

/** 오행 상극: A가 극하는 오행 (목→토→수→화→금→목) */
export const ELEMENT_CONTROLS: Record<ElementKey, ElementKey> = {
  목: '토', 토: '수', 수: '화', 화: '금', 금: '목',
};

export type TenGodKey =
  | '비견' | '겁재' | '식신' | '상관' | '편재'
  | '정재' | '편관' | '정관' | '편인' | '정인';
