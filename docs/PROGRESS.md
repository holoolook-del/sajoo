# PROGRESS

## 현재 상태
- 완료: Phase 0~4, T0~T-last 전부 + 배포·홈 리디자인 + T9 공유성 강화
- 진행 중: 없음 — 모든 개발 태스크 완료
- 다음: H3 폰 설치+오프라인 실기기 확인만 남음 (Pages 배포 완료, https://holoolook-del.github.io/sajoo/)

## 태스크별 기록
### T9 (공유성·콘텐츠 강화)
- 한 일: 일간 해석을 "사주 캐릭터"로 확장 — 10천간 각각에 유형명(예: 「만물을 적시는 이슬」)·키워드 3개·사회적 면모 4종(사람들이 보는 나/내가 잘하는 것/조심할 점/친해지면). 사주 페이지에 골드 테두리 캐릭터 카드, 운세 페이지에 운세 지수(%) 게이지·행운 색/방향/아이템 칩. share.ts(navigator.share→클립보드 폴백)+ShareButton을 사주·운세·카드·궁합 4곳에 배치 — 공유 텍스트는 캐릭터명·키워드·앱 URL만, 생년월일시 미포함. index.html에 OG 메타(카톡 미리보기, og:image=hero.webp 절대경로)
- 바꾼 파일: src/content/interpret.ts(social 필드·DayMasterSocial), src/lib/interpret.ts, src/lib/share.ts(신규), src/components/share-button.tsx(신규), src/pages/{saju,fortune,card,compat}.tsx, src/content/fortune.ts(LUCKY), src/features/fortune/today.ts(luckIndex·lucky), index.html, e2e/fortune.spec.ts(운세 점수→지수 문구), src/lib/interpret.test.ts, src/features/fortune/today.test.ts
- 새 공용 코드: shareResult, ShareButton, DayMasterSocial, LUCKY (CODE_INDEX 등록)
- 남은 문제: 없음
- 증거: vitest 41/41(신규 2건 — 캐릭터 필드·운세 지수 범위), e2e 24/24, e2e:preview AC7 통과, verify 통과, audit:code 클린
- 배운 점: 공유 텍스트에 이름·캐릭터만 넣고 생년월일시는 절대 제외 — URL도 앱 루트만

### 배포·홈 리디자인 (커밋 a8ebc20·968b2ef)
- pnpm/action-setup version 필드가 packageManager와 충돌 → 워크플로우에서 제거. Pages 활성화·Actions 권한은 GitHub API로 직접 설정 완료
- 홈 리디자인: 히어로 배너 + 카드 CTA + 일러스트 메뉴 그리드, 메뉴 썸네일 6장 + 온보딩 배너 1장 생성(텍스트 누출 2장은 소재 바꿔 재생성)

### T-last (마감)
- 한 일: 온보딩 수정 모드(기존 프로필 프리필)+홈 '내 정보 수정' 링크, 카드 씬 lazy 분리(motion 125KB 청크), AC12 360px e2e, AC7 오프라인 e2e, README 작성. **치명 버그 발견·수정**: vite-plugin-pwa의 includeManifestIcons(기본 true)가 assets/icon.png를 revision付き로 추가하고 globPatterns가 같은 파일을 revision:null로 잡아 프리캐시 중복 → workbox `add-to-cache-list-conflicting-entries` throw → install 리스너 미등록 → SW가 캐시 0개로 활성화되는 결함. includeManifestIcons:false로 해결(아이콘은 glob이 담당)
- 바꾼 파일: vite.config.ts, e2e/offline.spec.ts, e2e/viewport.spec.ts(신규), playwright.preview.config.ts(신규), playwright.config.ts, src/pages/onboarding.tsx, src/pages/home.tsx, README.md(신규), docs/*
- 새 공용 코드: 없음
- 남은 문제: card-frame.tsx react-refresh 경고 2건(컴포넌트+상수 혼합 export, 경고 수준으로 수용)
- 증거: vitest 39/39, e2e 24/24, e2e:preview AC7 통과(서버 프로세스 kill로 진짜 오프라인 생성 — SW 프리캐시 34항목으로 운세·카드뽑기·콜드리로드 전부 동작), verify 통과, audit:code 클린
- 배운 점: ① Playwright setOffline/route abort는 SW보다 먼저 요청을 끊어 PWA 오프라인 검증 불가 → 스펙이 vite preview를 spawn+kill해 진짜 오프라인 구현. ② 이미 죽은 프로세스 kill 시 'error' 이벤트가 리스너 없으면 워커를 죽임 → on('error') 필수. ③ SW activated≠오프라인 준비 — 프리캐시 캐시 존재를 직접 검증해야 함

### T8
- 한 일: scripts/gen-images.ts(Replicate flux-schnell — fetch만, Prefer:wait=60 동기, 11초 간격·429 retry_after 재시도, 파일 있으면 스킵), 카드 24장+뒷면+아이콘+히어로 27장 생성→public/assets 번들, card-frame에 생성 이미지 적용(앞면 일러스트+그라데이션 오버레이+scale 1.12 크롭, 뒷면 단청 문양+SVG 폴백), 홈 히어로 배너, PWA 매니페스트 icon.png, workbox glob에 webp 추가, @google/genai 제거
- 바꾼 파일: scripts/gen-images.ts(신규), src/features/card/card-frame.tsx, src/pages/home.tsx, vite.config.ts, .env.example, docs/DECISIONS.md, package.json
- 새 공용 코드: 없음 (스크립트는 개발 도구)
- 남은 문제: 카드 일부에 작은 낙관 도장 잔존 — 민화 양식상 자연스러워 수용 (중앙 텍스트 패널은 전부 제거 확인). 프리캐시 5.3MB
- 다음 할 일: T-last
- 증거: 27장 생성 성공(0 실패, 총 ~$0.08), vitest 39/39, e2e 22/22, verify 통과, audit:code 클린
- 배운 점: flux는 동아시아 화풍+건축물 조합에 현판 글자를 거의 무조건 넣음 — 소재를 비건축 상징으로 바꾸는 게 프롬프트 금지어보다 효과적

### T7
- 한 일: storage에 listFortunes/listCardDraws(날짜 내림차순 목록)·pruneHistory(cutoff 이전 기록 삭제), features/history/history.ts(buildHistory: 운세·카드 기록을 날짜별 병합, 30일 창, 경계 밖 prune), /history 페이지(날짜·일진·등급·요약·뽑은 카드명), e2e AC10
- 바꾼 파일: src/lib/storage.ts, src/features/history/{history,history.test}.ts, src/pages/{history,home}.tsx, src/App.tsx, e2e/history.spec.ts
- 새 공용 코드: listFortunes, listCardDraws, pruneHistory, buildHistory, HistoryEntry
- 남은 문제: 없음
- 다음 할 일: T8 이미지 생성+디자인 마감
- 증거: vitest 39/39, e2e 22/22, verify 통과, audit:code 클린
- 배운 점: localStorage 키 순회는 storage.ts가 단독 소유 — feature는 목록 함수만 호출

### T6
- 한 일: content/compat.ts(궁합 풀이문: 일간 상생·비화·상극, 지지 관계, 등급 요약), features/compat/compat.ts(compatScore: 일간 오행 관계+일지 지지 관계+십신 역할+오행 보완→0~100 점수·등급·해석), /compat 페이지(ProfileForm 재사용, 상대 정보는 React state만 — 미저장 명시). 아키텍처 수정: interpretSaju→lib/interpret.ts, branchRelation→lib/relations.ts 이동(features 간 import 금지 규칙 준수)
- 바꾼 파일: src/lib/{interpret,interpret.test,relations}.ts(신규·이동), src/features/{compat/compat.ts,compat.test.ts}, src/features/fortune/today{,.test}.ts, src/features/saju/profile-form.tsx(submitLabel prop), src/pages/{compat,home,saju}.tsx, src/App.tsx, e2e/compat.spec.ts, src/content/compat.ts
- 새 공용 코드: interpretSaju(lib), branchRelation(lib), compatScore, CompatPage
- 남은 문제: 없음
- 다음 할 일: T7 히스토리 30일 (listRecordDates 복원 필요)
- 증거: vitest 36/36, e2e 20/20, verify 통과, audit:code 클린(knip 클린·jscpd 0)
- 배운 점: features 간 import 금지 규칙 — 공유 도메인 로직은 lib/로. ProfileForm은 submitLabel prop으로 다른 맥락에서 재사용 가능

### T5
- 한 일: engine에 yearPillarOf/monthPillarOf(세운·월주 — 절기 경계 피해 중순 기준), features/luck/luck.ts(buildLuckView: 대운 타임라인+현재 대운 표시·세운·월운 12개월+십신), /luck 페이지. 리팩터링: use-saju.ts(프로필→사주 공용 훅 — 3개 페이지 중복 제거), components/state-view.tsx(공용 에러/빈 상태). e2e helpers.ts 추출(registerProfile 중복 제거)
- 바꾼 파일: src/lib/engine.ts, src/features/luck/{luck,luck.test}.ts, src/features/saju/use-saju.ts, src/components/state-view.tsx, src/pages/{luck,fortune,saju}.tsx, src/lib/storage.ts, e2e/{helpers,luck.spec,card.spec,fortune.spec}.ts
- 새 공용 코드: useSaju, StateView, yearPillarOf/monthPillarOf, buildLuckView
- 남은 문제: 없음
- 다음 할 일: T6 궁합
- 증거: vitest 33/33, e2e 18/18, audit:code 클린
- 배운 점: 같은 calcSaju 블록을 3페이지가 반복 → useSaju 훅이 정석. 대운 나이는 세는나이(현재연도-생년+1) 기준

### T4
- 한 일: engine에 iljinOf(날짜→일진), content/fortune.ts(지지 관계 테이블 육합·삼합·충·형·해·원진·파 + 십신 일진 해석 + 등급 요약), features/fortune/today.ts(dailyFortune: 십신·관계·상생상극 점수→등급, saveTodaysFortune: FortuneRecord 기록), meta.ts에 상생상극 맵(manseryeok 미공개 심볼 자체 구현), /fortune 페이지(일진+등급+해석+카드 연동), storage saveFortune/loadFortune/listRecordDates
- 바꾼 파일: src/lib/{engine,types,storage}.ts, src/content/{meta,fortune}.ts, src/features/fortune/{today,today.test}.ts, src/pages/{fortune,home}.tsx, src/App.tsx, e2e/fortune.spec.ts
- 새 공용 코드: CODE_INDEX 참조
- 남은 문제: 없음
- 다음 할 일: T5 대운·세운·월운
- 증거: vitest 29/29, e2e 16/16, verify 통과
- 배운 점: manseryeok의 ELEMENT_GENERATES 등은 내부 심볼 — 공개 API만 쓰고 나머지 규칙 데이터는 content에 둔다

### T3
- 한 일: content/meta.ts(오행색·한자·십신 키 공용 메타 — card-frame 오행색을 여기로 통합), content/interpret.ts(일간 10천간·오행·십신·균형 풀이문 DB), features/saju/interpret.ts(오행 분포·과다/부족·십신 분포 조합), pillar-table.tsx(만세력식 표: 십신·천간·십신·지지·주명 행, 오행색 글자), saju 페이지 확장(표+일간 해석+오행 차트+십신 해석+공망)
- 바꾼 파일: src/content/{meta,interpret,cards}.ts, src/features/saju/{interpret,interpret.test,pillar-table}, src/pages/saju.tsx, src/features/card/card-frame.tsx
- 새 공용 코드: CODE_INDEX 참조
- 남은 문제: 없음
- 다음 할 일: T4 오늘의 운세
- 증거: vitest 22/22, e2e 12/12, audit:code 클린(복제 0%)
- 배운 점: jscpd가 같은 파일 내 반복 JSX도 잡음 — 표 행은 데이터로 돌리는 게 정석

### T2
- 한 일: 운세카드 덱 24장(content/cards.ts, 대길~대흉·오행·해석·조언 실제 콘텐츠), features/card/draw.ts(날짜+사주 시드 결정적 뽑기, 하루 1장), storage 카드 기록 저장/조회, card-frame(카드 앞·뒷면, 오행색), card-scene(motion 팬아웃→선택→3D플립→금빛 폭발 연출, reduced-motion 대응), /card 페이지, 홈 CTA, e2e AC5·AC6
- 바꾼 파일: src/lib/{types,storage}.ts, src/content/cards.ts, src/features/card/{draw,draw.test,card-frame,card-scene}.tsx, src/pages/{card,home}.tsx, src/App.tsx, e2e/card.spec.ts
- 새 공용 코드: CODE_INDEX 참조
- 새 파일을 만든 이유: DECISIONS 구조 — content=카드 정의 데이터, features/card=뽑기 규칙+연출, pages=화면
- 남은 문제: 청크 >500kB 경고(motion) — T-last에 코드스플릿 검토. knip 잔여 SajuPillar는 의도된 공용 타입
- 다음 할 일: T3 사주 풀이 화면
- 증거: vitest 18/18, e2e 12/12(desktop+mobile: AC5·AC6 포함), verify 통과
- 배운 점: 부채꼴 카드는 앞 카드가 뒤 카드 클릭 영역을 가림 — e2e는 최상위 카드를 클릭

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
