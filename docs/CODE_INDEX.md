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

## 화면 공용 요소 (컴포넌트, 훅)
| 이름 | 경로 | 하는 일 |
| --- | --- | --- |
| ProfileForm | src/features/saju/profile-form.tsx | 프로필 입력 폼 (검증·에러 표시 포함) |
| useProfile | src/features/saju/use-profile.ts | 프로필 읽기·저장 훅 |

## 콘텐츠·풀이문
| 이름 | 경로 | 하는 일 | 입력 → 출력 |
| --- | --- | --- | --- |

## 화면 공용 요소 (컴포넌트, 훅)
| 이름 | 경로 | 하는 일 |
| --- | --- | --- |
