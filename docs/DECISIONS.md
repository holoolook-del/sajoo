# DECISIONS

## 스택 (이유 한 줄 / 선택하지 않은 대안)
- 프레임워크: Vite + React + TypeScript (SSR 불필요한 완전 정적 번들 / Next.js — 서버 기능 미사용으로 과함)
- 언어: TypeScript strict (계산·데이터 정확도가 생명 / JS — 타입 없이 간지·오행 다루기 위험)
- 스타일: Tailwind CSS + 커스텀 단청 테마 (빠른 스타일링 / CSS Modules — 테마 관리 수작업)
- 애니메이션: motion(구 framer-motion) (카드 플립·스프링 물리 / 순수 CSS — 제어 한계)
- 만세력: `manseryeok` (KASI 정본, 의존성 0, ~40KB / 직접 구현 — 절기 정확도 불가)
- DB: localStorage `lib/storage.ts` 래퍼 (≪1MB, 동기·단순 / IndexedDB — 이 규모엔 과함)
- 인증: 없음 (개인 로컬 앱 / —)
- 콘텐츠: 번들된 풀이문 DB+조합 규칙, Replicate 생성 이미지 번들 (오프라인·무료 / 런타임 API — 사용자 거부)
- PWA: vite-plugin-pwa Workbox precache (완전 오프라인 표준 / 수동 SW — 검증 비용)
- 배포: GitHub Actions → GitHub Pages, base `/sajoo/` (push 자동 배포, 공개 저장소 확인됨 / Vercel — 사용자가 Pages 선택)
- 패키지 매니저: pnpm 10, lockfile로 버전 고정, package.json 정확한 버전
- 테스트: Vitest(단위: 계산·규칙·검증) + Playwright(e2e: 카드 뽑기 등 핵심 AC만)
- 코드 검사: ESLint + knip(미사용) + jscpd(중복)
- 이미지: `scripts/gen-images.ts`가 Replicate flux-schnell 호출→`public/assets/` 저장→커밋 (개발 중 1회, 비용 1만원 이하)

## 폴더 구조와 책임
```
sajoo/
├─ .github/workflows/deploy.yml    Pages 자동 배포
├─ docs/                           SPEC·DECISIONS·TASKS·PROGRESS·CODE_INDEX·INTERVIEW_LOG·reference/
├─ public/assets/{cards,illust}/   AI 생성 이미지(번들), icons/ PWA 아이콘
├─ scripts/                        gen-images.ts 등 개발 전용 스크립트
├─ src/
│  ├─ main.tsx, App.tsx            진입 + 라우팅
│  ├─ pages/                       화면 단위 조합
│  ├─ features/{saju,fortune,card,luck,compat,history}/  기능별 UI+해석 조합
│  ├─ content/                     순수 데이터: 풀이문 DB·카드 정의·오행/십신 메타
│  ├─ lib/                         엔진 래퍼·storage·KST 날짜·포맷 (하위 순수층)
│  └─ components/                  도메인 무관 공용 UI + StateView·CardFrame·PageShell
└─ e2e/                            Playwright 핵심 흐름
```

## 모듈 경계 (의존 방향)
- `pages → features → {lib, content, components}` 한 방향만.
- features끼리 직접 import 금지 — 공유 로직은 lib/, 데이터는 content/로 내린다.
- lib·content·components는 상위(pages/features)를 import하지 않는다.

## 규칙
- 네이밍: 파일 kebab-case, 컴포넌트 PascalCase, 함수·변수 camelCase, 상수 SCREAMING_SNAKE. 도메인 용어: `pillar` `stem` `branch` `element` `tenGod` `daewoon` `iljin`으로 통일
- 데이터 접근 위치: 로컬 저장·조회는 전부 `lib/storage.ts` 경유(키 `sajoo:*`), 모든 레코드에 `v:1` 버전 필드
- 에러 처리 형태: 계산·검증 함수는 `{ ok: true, data } | { ok: false, error }` 반환. UI는 StateView로 빈/로딩/에러 통일. 사용자 문구 한국어, 개발 정보는 console만
- 비밀정보: GEMINI_API_KEY는 `.env` 전용, 커밋 금지, 코드·클라이언트 번들에 포함 금지
- 시간: 저장은 ISO/KST date 문자열, '오늘' 판정은 `lib/date.ts`의 KST 기준 단일 함수만 사용

## 명령어
- dev: `pnpm dev` / verify: `pnpm verify` (typecheck+lint+test+build) / e2e: `pnpm e2e`
- 단일 테스트: `pnpm vitest run <파일>` / audit:code: `pnpm audit:code` (knip + jscpd)
- 이미지 생성: `pnpm gen:images` (REPLICATE_API_TOKEN 필요)

## 데이터 모델
```ts
type Profile = {
  v: 1; name: string;                                  // 1~10자
  calendar: 'solar' | 'lunar'; isLeapMonth: boolean;
  year: number; month: number; day: number;            // 라이브러리 지원 범위 검증
  hour: number | null; minute: number | null;          // null = 생시 모름 → 3주
  gender: 'male' | 'female';                           // 대운 순/역행 필수
  createdAt: string;
}
type CardDraw = { v: 1; date: string; cardId: string; drawnAt: string }       // date=KST, 하루 1장
type FortuneRecord = { v: 1; date: string; iljin: string; grade: Grade; summary: string }
// 궁합 상대: 메모리만, 저장 안 함. 히스토리: date 인덱스, 30일 초과분 정리.
```
- 변경은 추가 위주. `v`를 올리고 storage에서 마이그레이션.

## 이미지 생성 교체 기록 (T8)
- Gemini 무료 티어는 이미지 모델 쿼터가 0 — 사용 불가로 판명 (모든 이미지 모델 429/limit 0 실측)
- Replicate `black-forest-labs/flux-schnell`로 전환 (장당 ~$0.003, 크레딧 기충전 계정 재사용)
- 함정: 레이트리밋(6/min·버스트1 → 호출 간격 11초), 동아시아 화풍은 도장·현판 형태의 가짜 문자가 이미지에 새어나옴 → 건축물 소재 회피 + 'no text/seals' 강화 + 카드 앞면 CSS 크롭(scale 1.12)으로 모서리 낙관 제거

## PWA 함정 기록 (T-last)
- `includeManifestIcons`(vite-plugin-pwa 기본 true)는 manifest 아이콘을 프리캐시에 revision付き로 추가한다. 같은 파일이 `globPatterns`로도 잡히면(revision:null) 같은 URL에 두 revision이 등록돼 workbox가 `add-to-cache-list-conflicting-entries`를 던지고 **install 리스너 등록 전에 죽는다 → SW는 활성화되지만 캐시 0개의 빈 껍데기가 된다**. `includeManifestIcons: false`로 해결. SW가 activated 상태인 것만으로는 오프라인 준비가 안 된 것 — `caches.keys()`에 `workbox-precache-*`가 있는지 직접 검증해야 한다.
- 오프라인 e2e: Playwright `context.setOffline`과 `route.abort`는 서비스워커보다 먼저 요청을 차단해 프리캐시 검증에 쓸 수 없다. `e2e/offline.spec.ts`가 `vite preview`를 직접 spawn하고 테스트 중간에 kill해서 진짜 오프라인을 만든다. (playwright.preview.config.ts에는 webServer가 없다 — 스펙이 서버 수명주기를 소유)

## 몽환 배경·수면음원 (T12)
- 배경 연출은 three.js가 아니라 생성 이미지+CSS/캔버스로 구현 — flux로 만든 달·구름을 mix-blend-screen으로 띄우고 구름은 이미지 2장 이어붙인 translateX(-50%) 무한 드리프트, 별은 2D 캔버스 트윙클. WebGL(번들 ~600KB) 없이 같은 시각 효과를 내고 오프라인 PWA 부담이 없다
- 루프 음원의 seamlessness는 합성 단계에서 해결 — gen-sounds.ts의 bell/noise/pad 인덱스를 버퍼 길이로 나머지 연산(wraparound)해 끝 샘플이 시작으로 자연스럽게 이어지게 한다. 런타임 크로스페이드보다 단순하고 확실
- 수면 음원(6트랙 ~6MB)은 프리캐시에서 제외(globIgnores)하고 workbox CacheFirst 런타임 캐시 — 첫 방문 설치 용량을 지키면서 한 번 재생된 곡은 오프라인에서도 재생


## 해석 데이터베이스의 근거 (T13)
- **계산(만세력)**: manseryeok 라이브러리 — 한국천문연구원 간지·음양력 데이터 기반. 신뢰 가능한 유일한 수치 부분.
- **해석문**: 공개된 구조화 사주 해석 API/DB는 존재하지 않음(고전 원문은 산문이라 그대로 DB 불가). 전통 명리의 표준 매핑 체계를 콘텐츠 DB로 정리 — 재물=재성, 직업=관성, 연애=도화(子午卯酉), 건강=五行-臟腑 대응, 인간관계=식상, 가족=인성. 텍스트는 이 체계 위에서 작성하며 근거 매핑을 코드 주석에 남긴다.
- 하이브리드 원칙: 수치·계산은 검증된 라이브러리, 풀이문은 전통 범주에 근거한 자체 DB(src/content)로 유지. 런타임 외부 호출 없음.

## 심리테스트 채점 신뢰성 설계 (T22)
- 문항 수를 전문 검사 수준으로 올린다: mbti 축당 10문(40문), love·animal 축당 8문(24문), job·color 유형당 8문(24문), stress 20문. 양택이 어려운 문항에는 QuizDef.neutral로 "둘 다 아니다/잘 모르겠다" 선택지(w=N, 득점 없음)를 붙여 억지 응답 노이즈를 제거 — 절반 이상 N이면 결과 화면에 자료 부족 경고. 한두 문항 오선택이 결과를 뒤집지 않게.
- 선택지 방향 혼합: 같은 성향이 항상 첫 번째 선택지에 오던 위치 편향 제거 — 각 가중치가 A/B 양쪽에 배정(색깔은 색당 3:3). "첫 것만 누르는" 답변이 극단 결과를 만들지 않는다.
- 경계선 결과를 숨기지 않는다: 대립 축 |a-b|≤1이면「거의 비슷한 축」표시 + QuizDef.confidence가 결과 확신도(높음/보통/낮음)를 산출해 결과 카드에 표기. 스트레스는 단계 경계값 근처면 보통으로.
- 검증은 src/content/tests.test.ts가 구조적으로 잠근다: 축별 문항 균등·위치 편향·유형 도달 가능성·한 문항 플립 안정성·확신도 경계를 단위 테스트로 고정.
