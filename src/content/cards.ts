import type { Grade } from '../lib/types.ts';

export type CardElement = '목' | '화' | '토' | '금' | '수';

export interface CardDef {
  id: string;
  name: string;
  hanja: string;
  grade: Grade;
  element: CardElement;
  /** 그날의 운세 해석 — 1~2문장 */
  message: string;
  /** 행동 조언 — 1문장 */
  advice: string;
}

export const CARD_DECK: CardDef[] = [
  // ── 대길 ──
  { id: 'yong-chul', name: '용출해월', hanja: '龍出海月', grade: '대길', element: '수', message: '구름을 뚫고 용이 바다로 나섭니다. 오래 품어 온 일이 드디어 세상에 얼굴을 내미는 날입니다.', advice: '망설이던 일을 오늘 시작하세요. 용기가 큰 그림의 첫 획을 긋습니다.' },
  { id: 'geum-ui', name: '금의환향', hanja: '錦衣還鄕', grade: '대길', element: '금', message: '비단옷을 입고 고향으로 돌아가는 형상. 쌓아 온 노력이 인정받아 빛나는 하루입니다.', advice: '떠벌리지 않아도 됩니다. 결과가 스스로 말하게 두세요.' },
  { id: 'hong-un', name: '홍운당두', hanja: '鴻運當頭', grade: '대길', element: '화', message: '큰 운이 머리 위에 당도했습니다. 길한 기운이 정점에 이른 날입니다.', advice: '좋은 기운은 겸손할 때 오래갑니다. 감사 한마디를 주변에 나누세요.' },
  { id: 'man-sa', name: '만사형통', hanja: '萬事亨通', grade: '대길', element: '목', message: '하는 일마다 막힘이 없이 트입니다. 순풍에 돛을 단 날입니다.', advice: '미뤄 둔 일이 있다면 오늘 처리하세요. 순서만 잡으면 술술 풀립니다.' },
  // ── 길 ──
  { id: 'gwi-in', name: '귀인래조', hanja: '貴人來助', grade: '길', element: '토', message: '귀인이 찾아와 돕는 날. 혼자 끙끙대던 일에 손이 닿습니다.', advice: '도움을 주저하지 말고 먼저 물어보세요.' },
  { id: 'go-jin', name: '고진감래', hanja: '苦盡甘來', grade: '길', element: '목', message: '쓴 것이 다하면 단 것이 옵니다. 견뎌낸 시간이 보상으로 돌아오는 중입니다.', advice: '오늘은 결과를 재지 말고 과정을 믿으세요.' },
  { id: 'il-chwi', name: '일취월장', hanja: '日就月將', grade: '길', element: '화', message: '나날이 자라는 상승의 기운. 작은 진전이 모여 큰 흐름을 만듭니다.', advice: '배움에 투자하기 좋은 날. 한 페이지라도 읽어 보세요.' },
  { id: 'u-gong', name: '우공이산', hanja: '愚公移山', grade: '길', element: '토', message: '우직한 노인이 산을 옮기듯, 꾸준함이 기적을 만드는 날입니다.', advice: '빠른 길보다 바른 길을 택하세요.' },
  { id: 'si-un', name: '시운상승', hanja: '時運上昇', grade: '길', element: '목', message: '때와 운이 함께 오릅니다. 기운이 오르는 곡선 위에 서 있습니다.', advice: '중요한 약속이나 면담을 오늘로 잡아 보세요.' },
  { id: 'cheon-si', name: '천시지리', hanja: '天時地利', grade: '길', element: '금', message: '하늘의 때와 땅의 이점이 맞물렸습니다. 조건이 갖춰진 날입니다.', advice: '준비해 온 계획을 실행에 옮기세요.' },
  { id: 'yu-yu', name: '유유자적', hanja: '悠悠自適', grade: '길', element: '수', message: '여유가 운을 부릅니다. 흐르는 물처럼 무리하지 않는 하루.', advice: '느긋하게 먼 곳을 보세요. 조급함이 오히려 해를 입힙니다.' },
  // ── 평 ──
  { id: 'tae-pyeong', name: '태평무사', hanja: '太平無事', grade: '평', element: '토', message: '잔잔한 하루. 큰 일도 큰 근심도 없는 무사의 날입니다.', advice: '평범함이 복입니다. 일상을 성실히 챙기세요.' },
  { id: 'seo-haeng', name: '서행천리', hanja: '徐行千里', grade: '평', element: '수', message: '천천히 가도 천 리를 갑니다. 속도보다 방향이 중요한 날.', advice: '서두르지 마세요. 오늘은 정확도가 답입니다.' },
  { id: 'su-sin', name: '수신제가', hanja: '修身齊家', grade: '평', element: '목', message: '몸을 닦고 집안을 가지런히 하는 상. 나부터 정돈하는 날입니다.', advice: '주변을 정리하면 마음도 정리됩니다.' },
  { id: 'sin-jung', name: '신중언행', hanja: '愼重言行', grade: '평', element: '금', message: '말과 행동에 무게를 두는 날. 한마디가 격을 만듭니다.', advice: '중요한 말은 하루 늦게 해도 됩니다.' },
  { id: 'yu-bi', name: '유비무환', hanja: '有備無患', grade: '평', element: '금', message: '준비가 있으면 근심이 없습니다. 점검과 복습의 날.', advice: '중요한 것들의 확인과 백업을 챙기세요.' },
  { id: 'jeon-hwa', name: '전화위복', hanja: '轉禍爲福', grade: '평', element: '화', message: '나쁘게 보이는 일이 복으로 뒤집히는 운. 시련이 디딤돌이 됩니다.', advice: '실망하지 마세요. 이면에 기회가 숨어 있습니다.' },
  { id: 'an-bun', name: '안분자족', hanja: '安分自足', grade: '평', element: '토', message: '분수를 알고 만족을 아는 날. 지금 가진 것에서 평온을 찾으세요.', advice: '비교하지 마세요. 내 기준으로 충분한 하루입니다.' },
  // ── 흉 ──
  { id: 'baek-cheok', name: '백척간두', hanja: '百尺竿頭', grade: '흉', element: '목', message: '백 자 장대 끝에 선 기분. 한 걸음 더는 신중함이 필요합니다.', advice: '무리한 도전보다 지금 자리를 굳히세요.' },
  { id: 'sa-myeon', name: '사면초가', hanja: '四面楚歌', grade: '흉', element: '수', message: '사방에서 적의 노래가 들리는 상. 고립감이 들 수 있는 날입니다.', advice: '혼자 끌어안지 말고 가까운 사람에게 연락하세요.' },
  { id: 'o-wol', name: '오월동주', hanja: '吳越同舟', grade: '흉', element: '수', message: '원수와도 한 배를 타는 날. 불편한 협력이 생길 수 있습니다.', advice: '감정보다 실리를 챙기세요. 타협이 전략입니다.' },
  { id: 'hwa-bul', name: '화불단행', hanja: '禍不單行', grade: '흉', element: '수', message: '나쁜 일이 겹칠 수 있는 날. 작은 실수가 연쇄될 수 있습니다.', advice: '시간과 비용에 여유를 두 배로 두세요.' },
  // ── 대흉 ──
  { id: 'pung-u', name: '풍우간관', hanja: '風雨間關', grade: '대흉', element: '수', message: '비바람이 몰아치는 관문. 오늘은 헤쳐나가는 날이 아닙니다.', advice: '중요한 결정과 이동은 미루고 몸을 아끼세요.' },
  { id: 'no-sim', name: '노심초사', hanja: '勞心焦思', grade: '대흉', element: '화', message: '마음이 애태워지는 날. 생각이 많아 몸이 지칩니다.', advice: '걱정을 메모로 옮기고 일찍 쉬세요. 내일은 다릅니다.' },
];

const byId = new Map(CARD_DECK.map((c) => [c.id, c]));

export function getCardById(id: string): CardDef | undefined {
  return byId.get(id);
}
