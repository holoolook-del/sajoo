# CODE_INDEX
(코드가 생길 때마다 같은 작업에서 갱신한다. 위치가 아니라 하는 일 기준.)

## 날짜·시간
| 이름 | 경로 | 하는 일 | 입력 → 출력 |
| --- | --- | --- | --- |
| todayKST | src/lib/date.ts | KST 기준 '오늘' 날짜 (카드 리셋·일진 판정 단일 함수) | Date? → 'YYYY-MM-DD' |

## 만세력·사주 계산
| 이름 | 경로 | 하는 일 | 입력 → 출력 |
| --- | --- | --- | --- |
| calcSaju | src/lib/engine.ts | 생년월일시→사주팔자·십신·대운·공망 (자시 관법, 생시 null→3주) | SajuBirthInput → Result\<SajuResult\> |
| iljinOf | src/lib/engine.ts | 날짜→일진(그날의 일주) | y,m,d → Iljin |
| yearPillarOf / monthPillarOf | src/lib/engine.ts | 연도→세운, 연·월→월주 (절기 경계 회피) | y[,m] → {korean,hanja} |
| validateBirthInput | src/lib/engine.ts | 생년월일시 입력 검증 (범위·미래·존재 날짜) | SajuBirthInput → Result\<true\> |

## 검증·포맷
| 이름 | 경로 | 하는 일 | 입력 → 출력 |
| --- | --- | --- | --- |
| Result / ok / err | src/lib/result.ts | 계산·검증의 성공/실패 반환 형태 | T → {ok,data}\|{ok:false,error} |
| profileFormSchema | src/features/saju/profile-schema.ts | 프로필 폼 zod 스키마 | 폼값 → 검증/에러메시지 |
| formToBirthInput / formToProfile | src/features/saju/profile-schema.ts | 폼값을 엔진 입력·저장용 Profile로 변환 | ProfileFormValues → SajuBirthInput/Profile |

## 데이터 접근 (storage)
| 이름 | 경로 | 하는 일 | 입력 → 출력 |
| --- | --- | --- | --- |
| saveProfile / loadProfile / hasProfile | src/lib/storage.ts | 프로필 로컬 저장·조회 (키 sajoo:profile) | Profile ↔ 저장소 |
| saveCardDraw / loadCardDraw | src/lib/storage.ts | 날짜별 카드 뽑기 기록 (키 sajoo:card:YYYY-MM-DD) | CardDraw ↔ 저장소 |
| saveFortune / loadFortune | src/lib/storage.ts | 날짜별 운세 기록 (sajoo:fortune:날짜) | FortuneRecord ↔ 저장소 |
| listFortunes / listCardDraws | src/lib/storage.ts | 저장된 운세·카드 기록 목록 (날짜 내림차순) | → FortuneRecord[] / CardDraw[] |
| pruneHistory | src/lib/storage.ts | cutoff 이전 운세·카드 기록 삭제 | 'YYYY-MM-DD' → 저장소 정리 |

## 카드·운세
| 이름 | 경로 | 하는 일 | 입력 → 출력 |
| --- | --- | --- | --- |
| CARD_DECK / getCardById | src/content/cards.ts | 운세카드 24장 정의(등급·오행·해석·조언) + id 조회 | id → CardDef |
| dailyCard | src/features/card/draw.ts | 날짜+사주 시드로 그날의 카드 결정적 선택 | Profile,date → CardDef |
| drawToday / canDrawOn / todaysDraw | src/features/card/draw.ts | 하루 1장 뽑기 기록·조회 (멱등) | Profile,date? → CardDraw |
| interpretSaju | src/lib/interpret.ts | SajuResult → 일간·일지·오행 분포·십신·고민별 해석 조합 | SajuResult → SajuReading |
| branchRelation | src/lib/relations.ts | 지지 두 글자의 관계 (육합→삼합→충→형→해→원진→파) | 지지,지지 → BranchRelation\|null |
| dailyFortune | src/features/fortune/today.ts | 일진×사주 조합(십신·관계·상생상극)→등급·해석 | SajuResult,date → DailyFortune |
| saveTodaysFortune | src/features/fortune/today.ts | 오늘 운세를 FortuneRecord로 기록 (멱등) | SajuResult,date → FortuneRecord |
| buildLuckView | src/features/luck/luck.ts | 대운 타임라인+세운+월운 12개월 (현재 표시·십신) | SajuResult,Profile,date → LuckView |
| compatScore | src/features/compat/compat.ts | 두 사주 궁합 (일간 관계+일지 관계+십신 역할+오행 보완) | SajuResult,SajuResult → CompatResult |
| buildHistory | src/features/history/history.ts | 최근 30일 운세·카드 기록 날짜별 병합+옛 기록 정리 | today?,days → HistoryEntry[] |
| findSinsal | src/lib/sinsal.ts | 신살 판정 (도화·역마·화개·양인·괴강 — 일지 삼합 표준표 기준) | SajuResult → Sinsal[] |
| encodeInvite / decodeInvite / sajuFromHanjaPillars | src/lib/invite.ts | 궁합 초대 링크 — 8글자 한자만 base64 URL 인코딩·복원 (생년월일 미포함) | name,SajuResult ↔ token / token → 최소 SajuResult |
| renderShareImage | src/lib/share-image.ts | 결과 공유 이미지 캔버스 합성 (제목·등급·이미지·풀이문 → 1080×1350 PNG blob) | ShareImageData → Blob |

## 화면 공용 요소 (컴포넌트, 훅)
| 이름 | 경로 | 하는 일 |
| --- | --- | --- |
| ProfileForm | src/features/saju/profile-form.tsx | 프로필 입력 폼 (검증·에러 표시 포함) |
| useProfile | src/features/saju/use-profile.ts | 프로필 읽기·저장 훅 |
| CardDrawScene | src/features/card/card-scene.tsx | 드래그/휠 덱 넘기기(관성·스냅)→선택→플립→폭발 뽑기 연출 |
| CardFront / CardBack | src/features/card/card-frame.tsx | 카드 앞·뒷면 비주얼 (오행색 테두리) |
| PillarTable | src/features/saju/pillar-table.tsx | 만세력식 팔자표 (십신·천간·지지·주명 행, 오행색) |
| useSaju | src/features/saju/use-saju.ts | 프로필→사주 공용 훅 (페이지 진입점) |
| StateView | src/components/state-view.tsx | 에러/빈 상태 공용 화면 |
| APP_URL / shareResult | src/lib/share.ts | 결과 공유 — navigator.share(카톡 포함 OS 시트) → 미지원·실패 시 클립보드 폴백 | text,title? → 'shared'\|'copied'\|'canceled'\|'failed' |
| ShareButton | src/components/share-button.tsx | 공유 버튼 (shareResult 호출 + 복사 피드백) | text,label? → 버튼 |
| ShareImageButton | src/components/share-image-button.tsx | 결과 이미지+텍스트+링크를 한 번에 공유(파일 공유 미지원 시 PNG 저장 폴백) 버튼 | data,text?,url? → 버튼 |
| TestHubPage | src/pages/test.tsx | 심리테스트 허브 — QUIZZES 전체 목록(썸네일·문항수·지난결과 칩), 프로필 불필요. 라우트 /test | — |
| TestPage | src/pages/test.tsx | 설문형 테스트 공용 러너 (인트로→진행바→양택일·이전문항→결과+공유, 프로필 불필요). 라우트 /test/:id | — |
| QUIZZES / QuizDef | src/content/tests.ts | 테스트 콘텐츠 DB — mbti(축당10문 40문→16타입)·job(RIASEC 24문→6형+보조)·love·animal(축당8문 24문→6유형)·color(색당8문 24문)·stress(20문→4단계 지수). QuizDef.neutral로 문항별 "모르겠다" 선택지(N, 득점 없음). 축별 문항 균등·선택지 방향 혼합(위치 편향 제거). 유형은 strong·scenes·note 포함, QuizDef.confidence로 결과 확신도 산출 | score → code → QuizResultType |
| borderlineAxes | src/content/tests.ts | 경계선 축 판정 — \|a-b\|≤1인 대립 축 라벨 목록. confidence와 결과 바「거의 비슷」표시에 사용 | bars,score → string[] |
| LotsPage | src/pages/lots.tsx | 제비뽑기 — 인원·당첨 수 설정→섞인 제비를 탭으로 공개·결과 공유 (미저장). 라우트 /lots | — |
| playCardPick / playCardCharge / playCardReveal / playKnock / isSoundEnabled / setSoundEnabled / setBgm / syncBgm | src/lib/sound.ts | WAV 효과음·배경음악 재생 (HTMLAudioElement, 인앱 브라우저 대응 제스처 언락 — 나중에 자동 재생될 사운드만 프라임; BGM은 pointerdown 재시도) + 음소거 설정 (키 sajoo:sound) | track? → void |
| MoktakPage | src/pages/moktak.tsx | 공덕 목탁 미니앱 — 탭 카운터(오늘/누적, 키 sajoo:moktak)·마일스톤 문구·공유. 라우트 /moktak | — |
| SleepPage | src/pages/sleep.tsx | 숙면 사운드 라이브러리 — 트랙 선택 재생(배경 BGM 채널 재사용)·수면 타이머(15/30/60분)·공유. 라우트 /sleep | — |
| NightBackdrop | src/components/night-backdrop.tsx | 몽환 밤하늘 배경 — 별 트윙클 캔버스·같은 구름 이미지 2층 드리프트만 (달·인물 제외). fixed -z-10, App 전역 | — |
| BackHome | src/components/back-home.tsx | 상단 홈 복귀 필 버튼 (골드 테두리, 모든 서브페이지 공용) | → Link |
| SoundToggle | src/components/sound-toggle.tsx | 효과음 켜기/끄기 토글 버튼 | → 버튼 |

## 콘텐츠·풀이문
| 이름 | 경로 | 하는 일 | 입력 → 출력 |
| --- | --- | --- | --- |
| ELEMENT_COLOR / ELEMENT_HANJA / ElementKey / TenGodKey | src/content/meta.ts | 오행·십신 공용 메타 (색상·한자·타입) | 오행 → 색상/한자 |
| DAY_MASTER_TEXT / DayMasterSocial / DAY_BRANCH_TEXT / ELEMENT_TEXT / ELEMENT_BALANCE / TEN_GOD_TEXT / CONCERN_TEXT / ELEMENT_HEALTH / HOUR_GUESS / GLOSSARY | src/content/interpret.ts | 풀이문 DB (일간 캐릭터·사회적 면모·일지 12지지·오행·균형·십신·고민 6종·건강 보완·생시 유추·용어 평어) | 키 → 해석 문장 |
| BRANCH_RELATIONS / DAY_GOD_TEXT / RELATION_TEXT / GRADE_SUMMARY / LUCKY / MONTH_GOD_READING | src/content/fortune.ts | 지지 관계 테이블 + 오늘운세·이번 달 풀이문 + 행운 색·방향·아이템 | 지지쌍/십신/등급/오행 → 문장 |
| COMPAT_GRADE_TEXT / COMPAT_RELATION_TEXT / STEM_RELATION_TEXT | src/content/compat.ts | 궁합 풀이문 (일간 관계·지지 관계·등급 요약) | 키 → 해석 문장 |
