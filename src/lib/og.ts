/**
 * OG 공유 랜딩 페이지 — 카톡 등 링크 미리보기는 JS를 실행하지 않으므로
 * 결과별 정적 og 페이지를 빌드 산출물(dist/og/<slug>/index.html)로 만든다.
 * 이 맵의 슬러그와 scripts/gen-og-pages.ts가 만드는 경로가 반드시 일치해야 한다.
 */

export const OG_BASE = 'https://holoolook-del.github.io/sajoo/';

/** 결과별 공유 링크 — 미리보기용 og 태그가 박힌 랜딩 페이지로, 열리면 앱 라우트로 즉시 리다이렉트 */
export function ogUrl(path: string): string {
  return `${OG_BASE}og/${path}/`;
}

/** 일간 한자 → og 경로 슬러그 */
export const STEM_OG: Record<string, string> = {
  '甲': 'gap', '乙': 'eul', '丙': 'byeong', '丁': 'jeong', '戊': 'mu',
  '己': 'gi', '庚': 'gyeong', '辛': 'sin', '壬': 'im', '癸': 'gye',
};

/** 등급 → og 경로 슬러그 */
export const GRADE_OG: Record<string, string> = {
  '대길': 'daegil', '길': 'gil', '평': 'pyeong', '흉': 'heung', '대흉': 'daeheung',
};
