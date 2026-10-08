# PROGRESS

## 현재 상태
- 완료: Phase 0~4, T0 스캐폴드, T1 만세력 엔진+프로필 (GitHub push됨)
- 진행 중: 없음 — T2 대기
- 다음: T2 운세카드 뽑기 (핵심 흐름). H2 Pages 활성화는 사용자 작업 대기

## 태스크별 기록
### T1
- 한 일: 만세력 엔진 래퍼(calcSaju·validateBirthInput, 자시 관법, 생시 null→3주), types.ts(Profile), storage.ts(프로필 저장·조회), zod 폼 스키마, ProfileForm, useProfile, /onboarding+/saju 페이지, 프로필 가드, e2e 3건 추가
- 바꾼 파일: src/lib/{engine,engine.test,storage,storage.test,types}.ts, src/features/saju/{profile-schema,profile-form,use-profile}, src/pages/{onboarding,saju,home}.tsx, src/App.tsx, e2e/{smoke,onboarding}.spec.ts
- 새 공용 코드: CODE_INDEX 참조 (calcSaju, validateBirthInput, storage 프로필 함수, ProfileForm, useProfile, profileFormSchema)
- 새 파일을 만든 이유: DECISIONS 폴더 구조대로 기능·계층 분리 (lib=엔진/저장, features=saju 폼, pages=화면)
- 남은 문제: knip이 motion(T2 예정), SajuPillar(공용 반환 타입) 보고 — 의도된 잔여. H2(GitHub Pages 활성화) 사용자 작업 대기 중 — 완료되면 push로 자동 배포
- 다음 할 일: T2 운세카드 뽑기
- 증거: vitest 13/13 통과(engine 10 + storage 2 + date 2), e2e 8/8(desktop+mobile: AC1·AC2·AC3·AC11), verify 통과
- 배운 점: Playwright는 준비 URL이 404면 타임아웃(vite base 경로 끝 슬래시 필요), Windows에서 vite는 ::1에만 바인딩될 수 있어 --host 127.0.0.1 명시

### Phase 4 부트스트랩 / T0
- 한 일: git init(main), .gitignore, .githooks/pre-commit(.env 차단), 전 설정 파일+스캐폴드, pnpm install, verify 첫 통과, e2e 스모크 통과, 첫 커밋. HANBANGCUT-AUTO.md → docs/reference/ 이동
- 바꾼 파일: package.json, vite.config.ts, tsconfig.json, eslint.config.js, playwright.config.ts, knip.json, .jscpd.json, deploy.yml, index.html, src/(main·App·index.css·lib/date·lib/date.test·lib/result·pages/home), e2e/smoke.spec.ts, public/favicon.svg, .env.example
- 새 공용 코드: lib/date.ts todayKST(KST 'YYYY-MM-DD'), lib/result.ts Result/ok/err
- 새 파일을 만든 이유: 스캐폴드 최초 구성(기존 코드 없음)
- 남은 문제: audit:code가 T0 기준 미사용 의존성(manseryeok·motion·zod·result.ts)을 보고 — T1/T2에서 해소됨. PWA 설치용 PNG 아이콘은 T8에서 생성 예정(현재 SVG만). typescript-eslint 미지원으로 TS 7 대신 6.0.3 사용. Playwright는 IPv4(--host 127.0.0.1)+준비URL 끝 슬래시 필요
- 다음 할 일: T1
- 증거: `pnpm verify` 통과(tsc+eslint+vitest 2/2+build/PWA SW 생성), `pnpm e2e` 2/2 통과(desktop+mobile)
- 참고: 이 repo에만 git 신원 설정됨(Devin bot, 로컬 config)

### Phase 1~3
- 한 일: 인터뷰 완료(개인용 한국식 사주 PWA, 완전 오프라인 번들형, 운세카드 핵심) → 구조 설계 승인(Vite+React+TS, manseryeok, localStorage, Pages 배포) → 문서 6종 생성
- 바꾼 파일: docs/INTERVIEW_LOG.md, docs/SPEC.md, docs/DECISIONS.md, docs/TASKS.md, docs/PROGRESS.md, docs/CODE_INDEX.md, AGENTS.md
- 새 공용 코드: 없음(아직 코드 없음)
- 남은 문제: 없음
- 다음 할 일: 사용자 문서 확정 → git init → T0

## 발견 사항 (지금 고치지 않고 적어 둔 것)
- `manseryeok` 라이브러리는 T1에서 설치 후 실제 API(함수명·대운 계산 시그니처) 검증 필요. 문서 기준으로는 사주팔자·십신·대운·공망·야자시 지원
