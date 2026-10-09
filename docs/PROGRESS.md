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

### 효과음 (T9 후속 → 가챠 연출 + 파일 재생으로 리워크)
- 한 일: ① 카드 씬을 가챠식 3단계로 재작성 — 팬 → 기모으기(소환진 2개 반대회전·카드 떨림·충전 오라·"기가 모이는 중…") → 공개(화면 플래시·회전 광선·화면 진동·발광 파티클 20~30개, 대길/길 확대). ② 사운드를 Web Audio 런타임 합성에서 **미리 렌더한 WAV 파일 재생**(HTMLAudioElement)으로 전환 — 인앱 브라우저(카톡 웹뷰)에서 AudioContext가 잠겨 무음이 되는 문제 해결. scripts/gen-sounds.ts가 pick/charge/reveal 3개 WAV를 PCM 합성(총 ~170KB). 첫 클릭 제스처 안에서 나머지 사운드를 muted play→pause로 언락해 setTimeout 뒤 재생도 동작. sajoo:sound 음소거 유지, SoundToggle 홈·카드 헤더
- 바꾼 파일: scripts/gen-sounds.ts(신규), public/assets/audio/{pick,charge,reveal}.wav(신규), src/lib/sound.ts(재작성), src/components/sound-toggle.tsx(신규), src/features/card/card-scene.tsx(재작성), src/pages/{card,home}.tsx, vite.config.ts(glob에 wav), package.json(gen:sounds)
- 새 공용 코드: playCardPick/Charge/Reveal, isSoundEnabled, setSoundEnabled, SoundToggle (CODE_INDEX 등록)
- 남은 문제: 없음
- 증거: vitest 42/42, e2e 24/24, verify 통과(프리캐시 45개), audit 클린
- 배운 점: 인앱 웹뷰에서 Web Audio API는 resume()이 안 풀리는 경우가 있음 → 파일+HTMLAudioElement+제스처 언락이 정석. WAV 합성은 Node에서 PCM16 직접 렌더링 가능(외부 다운로드·라이선스 불필요)

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

## T10 — 심심풀이 섹션 + 공덕 목탁 + 카드 사운드 버그 수정 (완료)

### 한 일
- `src/pages/moktak.tsx` — 공덕 목탁 미니앱: 탭하면 노크음+스쿼시+물결 파티클, 오늘/누적 카운트(localStorage `sajoo:moktak`, 자정 리셋), 공덕 마일스톤 문구(7/21/54/108/540/1080), 공유 버튼, ←홈 링크
- `src/lib/sound.ts` — 카드 사운드 버그 수정: `primeOthers`가 같은 제스처 안에서 곧바로 재생될 charge까지 무음 프라임 → muted 재생 중 프라임의 pause가 진짜 재생을 잘라 충전음이 안 들리던 문제. `prime(['reveal'])`로 '나중에 자동 재생될 것'만 프라임. `knock` 사운드 추가
- `scripts/gen-sounds.ts` — knock.wav 합성(620Hz 속빈나무 공명+클릭, 0.5s)
- `scripts/gen-images.ts` — illust/moktak(본체), illust/menu-moktak, illust/menu-necut 생성 추가(3장)
- `home.tsx` — 하단에 '심심풀이' 섹션(공덕 목탁 내부 링크 + 민화네컷 외부 링크)
- 라우트 `/moktak` (RequireProfile)
- e2e/moktak.spec.ts 3건 — 섹션 표시/탭 카운트/새로고침 유지

### 검증
- vitest 42/42, e2e 30/30, lint 경고 2(기존), build+SW 49개

## T11 — 배경음악 + 심심풀이 메뉴 통합 수정 (완료)

### 한 일
- `scripts/gen-sounds.ts` — `pad()` 화음 합성 추가. bgm.wav(32s Am→F→C→G 패드+드문 종), temple.wav(32s 저음 드론+범종 8초 간격) 생성 (~1.4MB 각각)
- `src/lib/sound.ts` — BGM 매니저: setBgm/track 선언 + syncBgm(실제 재생 동기화). 자동재생 정책상 제스처 필요 → App에서 pointerdown마다 syncBgm 재시도. 음소거와 연동
- `src/App.tsx` — 마운트 시 setBgm('bgm') + pointerdown 리스너
- `moktak.tsx` — 페이지에 있을 때 setBgm('temple'), 나가면 'bgm' 복귀
- `home.tsx` — 심심풀이를 별도 섹션이 아니라 MENUS 그리드에 통합('지난 30일의 기록' 다음). 외부 링크는 a 태그 분기
- e2e 갱신 — 그리드 기준으로 변경, 30/30 통과

### 검증
- vitest 42/42, e2e 30/30, build+SW 51개(8.9MB)

## T12 — 몽환 배경 + 메뉴 이미지 재생성 + 일지 해석 + seamless BGM + 숙면 사운드 (완료)

### 한 일
- `src/components/night-backdrop.tsx`(신규) — 전 페이지 뒤에 깔리는 몽환 밤하늘: 별 트윙클 캔버스(90개, reduced-motion 대응) + 달(screen 블렌드·숨쉬기) + 구름 2층 무한 드리프트(이중 이미지 translateX -50%) + 하단 창가 소녀 실루엣(방사형 마스크로 가장자리 페이드). App에 전역 마운트
- `scripts/gen-images.ts` — menu-history(달력 스크롤 아카이브), menu-compat(인연의 붉은 실), menu-sleep(창가 잠든 고양이) 재생성 + bg/ 레이어 4장(moon, clouds-a, clouds-b, girl) 신규
- `scripts/gen-sounds.ts` — bell/noise/pad를 wraparound 인덱스로 바꿔 **루프 끝-시작이 물리적으로 이어지는** 완전 루프 생성(bgm·temple·sleep 전부). 수면 트랙 5종 합성(빗소리·파도·모닥불·밤의 숲·웅장한 밤, 각 28s)
- `src/lib/sound.ts` — BGM_FILES에 수면 트랙 등록 + 트랙별 볼륨 맵(수면 음원은 0.5~0.55)
- `src/content/interpret.ts` — DAY_BRANCH_TEXT 신규: 일지 12지지별 내면 해석(nature·title·inner·bond·watch). interpret.ts가 dayBranch로 노출, saju 페이지에 '내면의 나 — 일지' 카드 추가
- `src/pages/sleep.tsx`(신규) — 숙면 사운드 라이브러리: 6트랙 타일(재생 중 이퀄라이저 표시)·자동 끄기 타이머(15/30/60분, 만료 시 완전 정지)·공유·←홈. 라우트 /sleep, 홈 그리드 민화네컷 다음
- `vite.config.ts` — 수면 음원 프리캐시 제외 + CacheFirst 런타임 캐시(sleep-audio, max 8)
- e2e/sleep.spec.ts 3건 — 메뉴 표시·트랙 토글·타이머/홈 복귀

### 새 파일을 만든 이유
- night-backdrop: 전역 배경 컴포넌트는 App이 1회 마운트 — 페이지에 몰아넣으면 라우트마다 별이 리셋됨
- sleep.tsx: 독립 미니앱 라우트 — moktak과 같은 패턴

### 검증
- vitest 42/42, e2e 36/36(수면 3건 신규), build+SW 56항목(9.0MB, 수면 음원 제외 확인), lint 경고 2(기존 card-frame)

### 남은 문제
- 없음 — 실기기에서 bgm/temple 루프 이음새·수면 타이머 실제 소리 확인 필요(H3)

## T12-follow — 피드백 반영 (완료)

### 한 일
- 수면 음원을 합성에서 **실제 무료 음원 다운로드**로 교체: 비=Ylmir(OGA CC0)·파도=Wikimedia Commons(CC BY-SA 4.0)·모닥불=qubodup(OGA CC BY 3.0)·숲=Wolfgang_(OGA CC0)·몽환 멜로디=Kevin MacLeod Dreamy Flashback(CC BY 3.0)·웅장한 밤=Kevin MacLeod Ossuary 6 – Air(CC BY 3.0). sleep 페이지 하단에 출처·라이선스 표기. gen-sounds.ts의 수면 합성 블록 제거
- 구름 톤 불일치: clouds-b가 거의 검정 이미지로 생성되어 두 층 색이 달랐음 → clouds-a 하나로 2층 구성(아래층 좌우반전+느림+낮은 투명도)
- 민화네컷 링크 target=_blank 제거 → 같은 창 이동
- `src/components/back-home.tsx`(신규) — 희미한 '← 홈' 텍스트 링크를 골드 필 버튼으로 교체, 8개 페이지 일괄 적용
- 메뉴 썸네일 3장(history·compat·sleep)을 16:9로 재생성 — 1:1 정사각이 가로 카드에서 좌우 크롭되던 문제 해소

### 검증
- vitest 42/42, e2e 36/36, build+SW 56항목(수면 음원은 여전히 런타임 캐시)


## T12-follow2 — 배경 레이어 축소 (완료)

### 한 일
- 달·창가 소녀 레이어 제거: "헤더에 이미 달 있음·소녀가 조잡" 피드백 → NightBackdrop을 별 트윙클+구름 2층만으로 축소. 미사용 `moonbreathe` 키프레임·bg 이미지 3장(moon/girl/clouds-b) 삭제, gen-images 잡에서도 제외. 프리캐시 56→53

### 검증
- pnpm verify 통과


## T12-follow3 — 카드 크기 확대 (완료)

### 한 일
- 결과 카드 h-44 w-32(128×176) → w-64 h-96(256×384, 정확한 2:3) — 생성 일러스트가 제대로 보이도록
- 뽑기 공개 연출: 뽑힌 카드 reveal 시 scale 1.25→1.9로 확대

### 검증
- pnpm verify 통과


## T13 — 카드 덱 제스처 + 고민별 해석 + 용어 설명 (완료)

### 한 일
- 카드 뽑기를 드래그 캐러셀로 재구현: 12장 덱을 좌우로 밀어 넘김(모멘텀·속도 반영·modifyTarget 스냅), 휠 스크롤 지원, 가운데 카드 강조, 탭으로 선택
- 고민별 해석 6종 추가 — CONCERN_TEXT(재물=재성·직업=관성·연애=도화·인간관계=식상·가족=인성 3단계 톤) + 건강(비어있는 오행→五行-臟腑 보완 조언 동적 생성). interpretSaju.concerns 신설, 사주 페이지「궁금한 것부터」섹션
- 용어 설명 카드(GLOSSARY 9항, 평어 한 줄) + 사주 페이지 하단에 계산·해석 근거 표기
- DECISIONS.md에 해석 DB 근거 결정 기록
- e2e 온보딩 로케이터 strict 충돌 수정(heading 기준)

### 검증
- vitest 43/43 (고민별 해석 테스트 신규), e2e 36/36, build+SW 53항목


## T14 — 기능 확장 팩 (신살·월운·생시유추·행운시간·이미지공유·초대링크·도감·제비뽑기)

### 한 일
- 신살(lib/sinsal.ts): 일지 삼합 표준표로 도화·역마·화개 + 양인·괴강 판정 → 사주 페이지「별자리 기호」섹션 (발견 위치 표시)
- 이번 달 운세 상세: MONTH_GOD_READING(십신별 돈/일/연애/건강 4줄) + 월운 지지 십신 계산 → luck 페이지
- 생시 유추: 생시 미입력 시 12시간대 기질(HOUR_GUESS)에서 골라 시주 재계산 → 사주 페이지
- 오늘의 행운 시간대: 일지 삼합 2개 시간대 칩 → fortune 페이지
- 결과 이미지 공유(lib/share-image.ts + ShareImageButton): 1080×1350 캔버스 합성 → 파일 공유/저장 — 카드·사주 캐릭터·궁합 3곳 연결
- 궁합 초대 링크(lib/invite.ts): 이름+8글자 한자만 base64 (생년월일 미포함, 프라이버시) → ?with= 수신자는 자기 정보만 입력. /compat 라우트 프로필 가드 해제
- 버그 수정: 초대 코드 도입 시 일반 궁합이 나×나를 비교하던 회귀(b=saju→rb.data)
- 카드 도감: history 페이지에 24장 수집 그리드 (뽑은 것만 표시)
- 제비뽑기 /lots: 2~8명·당첨 수 설정→섞인 제비 탭 공개→결과 공유. 홈 심심풀이 메뉴+menu-lots 이미지
- necut: sajoo 팔레트로 디자인 통일 (night 그라데이션·골드 버튼·필 홈링크)

### 새 공용 코드
- findSinsal / encodeInvite·decodeInvite·sajuFromHanjaPillars / renderShareImage / ShareImageButton / LotsPage → CODE_INDEX 등록

### 검증
- vitest 43/43, e2e 38/38 (제비뽑기·초대링크 신규 2종), build+SW 54항목


## T15 — BGM 음량 조정 + 메뉴 이미지 재생성

### 한 일
- 배경음악 음량 하향: bgm 0.3→0.15, temple 0.35→0.22 (수면 트랙은 유지)
- menu-compat 재생성: 까치 둘이 매화 가지에서 붉은 실을 물고 마주보는 구도
- menu-history 재생성: 격자창 달빛 아래 펼쳐진 옛 일기장+붓

### 검증
- pnpm verify 통과 (테스트 43)


## T16 — 카드 덱 원형 회전 + 홈 미뽑기 배지

### 한 일
- 카드 덱을 평면 나열 → 원호 회전(커버플로우)으로 재구현: sin 곡선 배치, 옆 카드는 rotateY·translateZ로 뒤로 휘어짐, 멀면 페이드. 카드가 화면 밖으로 나가지 않음
- 드래그 버그 수정: 트랙이 translateX로 히트박스가 화면 밖으로 나가 드래그가 안 먹던 문제 — useDragControls + dragListener=false + 컨테이너 onPointerDown으로 시작하도록 변경. 모멘텀·스냅 유지
- 홈 카드 CTA에 "오늘 아직 안 뽑음" 배지(펄스 도트) — 미뽑기 시에만 표시

### 검증
- typecheck·lint 통과, vitest 43/43, card e2e 4/4, 빌드+SW 54항목
- 수동 검증(Playwright 스크립트): 드래그 시 카드 위치 변화 + 릴리즈 후 스냅 확인


## T17 — 설문형 테스트 2종 (MBTI·직업성향)

### 한 일
- /test/:id 공용 퀴즈 러너: 인트로→진행바→양택일 12문→결과 카드(스프링 팝)
- MBTI 기질 테스트: 4축 12문 → 16타입 (타입명·설명·태그)
- 직업성향 테스트: RIASEC 6형 12문 → 상위 유형 + 추천 직업
- 공유: 텍스트+이미지(ShareImageButton) — 타입 코드 크게
- 프로필 없이 진입 가능(공유 링크 바이럴 입구), 미등록자 결과에 "사주 보러 가기" CTA
- 홈 메뉴 2종 + 메뉴 이미지 2장 생성

### 검증
- vitest 43/43, e2e 4/4 신규(무프로필 딥링크·직업 결과), 프리캐시 56


## T18 — 테스트 고도화

### 한 일
- MBTI 문항 12→16 (축당 4문), 결과에 축별 대립 비율 바(E↔I %), 잘 맞는/부딪히는 타입, 주의할 점, 타입별 accent 컬러
- 직업성향: 상위 1형 + 보조 2형 표시(A+E), 6형 전체 분포 바, 유형별 주의점
- 이전 질문 되돌아가기 버튼(응답 스택), 결과 localStorage 저장(sajoo:test:<id>) → 인트로에 지난 결과 칩
- 공유 이미지에 유형 accent 반영, 보조 유형 포함

### 검증
- vitest 43/43, e2e 4/4 (분포 바·보조 유형 검증 추가), build+SW 56


## T19 — 심리테스트 허브 + 테스트 4종 추가

### 한 일
- `/test` 허브 페이지(TestHubPage): 테스트 목록 카드 리스트 — 썸네일·문항수·지난결과 칩, 프로필 불필요
- 홈 메뉴 MBTI/직업 개별 항목 →「심리테스트」하나로 통합
- 새 테스트: 연애 유형(3축 12문→6유형, 축별 대립바)·본능 동물(3축 12문→6동물)·성격 색깔(6색 자유배점 12문)→스트레스 게이지(12문 hi/lo→4단계, 절대값 바)
- QuizDef에 img 필드, AxisBar에 max 필드(스트레스 지수 절대값 표시용) 추가
- 단일 바 라벨 렌더링을 key+label 중복 → label 단독으로 정리(직업성향 라벨에 코드 포함)
- 테스트 페이지 헤더에「모든 테스트」링크 추가
- 썸네일 5장 생성(menu-test, test-love/animal/stress/color)

### 검증
- vitest 43/43, e2e 48/48 (허브·연애·스트레스 신규), build+SW 61


## T20 — 테스트 결과 콘텐츠 고도화

### 한 일
- 전체 44개 유형의 설명문을 1줄→2~3문장으로 확장하고, 유형별 **강점 3줄**(strong) + **상황별 해석**(scenes — 연애할 때/일할 때/친구 사이에서/지금 필요한 것 등 테스트별 맞춤 라벨) 추가
- QuizResultType에 strong·scenes 필드, QuizDef에 note(근거 표기) 필드 추가
- 각 테스트 근거 표기: MBTI=융 심리유형론·16Personalities 명칭 / 직업성향=홀랜드 RIASEC(실제 진로검사 체계) / 나머지는 자체 제작임을 명시 — 결과·인트로 하단에 노출
- 인트로에 테스트 썸네일 이미지 표시(☯ 이모지 제거)
- 결과 화면에「당신의 강점」「상황별로 보면」섹션 추가

### 검증
- vitest 43/43, e2e test.spec 8/8, build+SW 61


## T21 — 테스트 공유·허브 연결 강화

### 한 일
- 공유 링크를 개별 테스트 딥링크로 교체 — shareResult에 url 파라미터 추가, ShareButton에 url prop
- 결과 화면에「다음 테스트도 해보세요」추천 카드 — 아직 안 한 테스트 2개 썸네일 링크
- 허브 헤더에 진행도 칩(n/6 완료)

### 검증
- typecheck, e2e test.spec 8/8

## T22 — 심리테스트 신뢰성 고도화 (전문기관 수준 지향)

### 배경
- 사용자 지적: 문항이 적으면 1~2개 오선택으로 결과가 완전히 뒤바뀐다. 위치 편향(같은 성향이 항상 첫 선택지)도 발견 — color는 '은백'이 12문 모두 두 번째 위치라 첫 것만 누르면 절대 나오지 않았다.

### 한 일
- 문항 2배: mbti 16→32(축당 8), job/love/animal/color 12→18(축·유형당 6), stress 12→15
- 전 퀴즈 선택지 방향 혼합 — 각 가중치가 A/B 위치에 배정돼 위치 편향 제거
- QuizDef.confidence 추가 — 결과 확신도(높음/보통/낮음)를 결과 카드에 표시. 대립 축은 borderlineAxes로 |a-b|≤1이면「거의 비슷한 축」표기. stress는 경계값(4/8/12) 근처를 보통으로 판정
- 결과 화면에 확신도 카드 + 축 바에 경계선 표시
- src/content/tests.test.ts 신규 — 문항 균등·위치 편향·유형 도달성·한 문항 플립 안정성·확신도 경계 12개 단위 테스트
- e2e/test.spec.ts — 새 문항 수 반영, data-w 선택자로 성향 극을 정확히 선택

### 검증
- verify 통과 (typecheck·lint·vitest 55/55·build+SW 61 프리캐시)
- e2e test.spec 8/8

## T22b — 문항 수 전문 검사 수준으로 추가 확장

### 한 일
- mbti 32→40(축당 10), job/love/animal/color 18→24(유형·축당 8), stress 15→20 — 임계값 5/10/15로 재조정
- QuizDef.neutral — 매 문항에 '둘 다 아니다·잘 모르겠다' 선택지(w=N, 득점 없음) 추가. 억지 양택으로 생기는 노이즈 제거, 절반 이상 N이면 결과에 자료 부족 경고
- 인트로 소요시간을 문항 수 기반으로 자동 계산

### 검증
- verify 통과 (vitest 55/55), e2e test.spec 8/8

## T23 — 이미지+텍스트+링크 한 번에 공유

### 한 일
- shareImageResult에 text/url 인자 추가 — navigator.share({files, text, url})로 이미지와 링크를 동시 전송(카톡 등에서 이미지+링크가 같이 도착)
- ShareImageButton에 text/url props — 미지정 시 카드 데이터로 텍스트 자동 생성 + APP_URL 기본 링크
- test/compat/saju/card 4곳 모두 기존 공유 텍스트를 이미지 공유에도 탑재. 테스트는 딥링크(/test/:id) 유지
- 버튼 라벨을「이미지+링크로 공유하기」로 변경

### 검증
- verify 통과 (vitest 55/55, build+SW 61 프리캐시)

## T24 — 자유 게시판 + 동시접속자 표시 (Firebase)

### 한 일
- Firebase 도입(Spark 무료 플랜): Firestore=글·댓글, RTDB presence=동시접속자 수, 익명 인증으로 소유권
- 새 파일: src/lib/firebase.ts(env 플래그 전용, SDK 미포함), src/features/board/{posts,filter,nickname}.ts, src/pages/board.tsx
- 게시판: 최신 50글 스트림, 글(300자)·댓글(150자), 내 글 삭제, 「내 결과 자랑」— 완료한 테스트 결과를 카드로 첨부
- 동시접속자: presence/{uid} + onDisconnect — 앱 헤더에「● N명 접속 중」실시간 표시
- 방어: 욕설·링크·도배 클라이언트 필터, 작성 간격(글30초·댓글10초), firestore.rules/database.rules.json 서버 검증
- 번들 분리: posts 청크 지연 로드 → 초기 번들 705KB 유지
- 홈 메뉴「자유 게시판」+ menu-board.webp 생성

### 설정(사람이 할 일 H)
1. firebase.google.com에서 무료 프로젝트 생성 → 웹앱 등록
2. Authentication → 익명 로그인 활성화
3. Firestore Database + Realtime Database 생성(Realtime은 URL 복사)
4. firestore.rules → Firestore 규칙 탭, database.rules.json → Realtime 규칙 탭에 각각 붙여넣기
5. GitHub repo → Settings → Secrets and variables → Actions → Variables에
   VITE_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/DATABASE_URL/APP_ID 5개 등록
   → 다음 배포부터 게시판 활성화 (로컬 dev는 같은 5줄을 .env에도)

### 검증
- verify 통과 (vitest 63/63 — 필터·닉네임 신규 8개, build+SW 64 프리캐시)
- e2e 52/52 — board.spec 2개(준비중 화면·홈 메뉴 진입) 포함
- 미검증: 실제 Firebase 연동(글쓰기·접속자 수) — env 설정 후 실기기 확인 필요
