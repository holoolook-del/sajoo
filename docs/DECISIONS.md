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
