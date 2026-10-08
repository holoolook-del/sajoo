# TASKS

## 규칙
- 위에서부터 하나씩. 완료하면 [x] 표시하고 커밋한다.
- 사람이 할 일(H)에 도달하면 멈추고 사용자의 완료 확인을 기다린다.

## 목록
- [ ] T0 스캐폴드, 환경 설정, verify 첫 통과, Actions→GitHub Pages 빈 화면 배포 확인
- [x] T1 만세력 엔진 래퍼 + 프로필 입력·저장
  - AC: AC1, AC2(계산부), AC3, AC11
  - 예상 파일: lib/engine.ts, lib/storage.ts, lib/date.ts, content/meta.ts, features/saju/, pages/onboarding.tsx
- [x] T2 운세카드 뽑기 — 존재 이유가 되는 핵심 흐름 (덱 정의→하루 1장 규칙→화려한 연출→결과, 오프라인)
  - AC: AC5, AC6, AC7
  - 위험 등급: 중간(연출 성능). 독립 검토 대상
- [x] T3 사주 풀이 화면 (팔자표·오행·십신·풀이문 조합)
  - AC: AC2(표시부)
- [x] T4 오늘의 운세 (일진×사주 조합, 카드와 연동)
  - AC: AC4
- [x] T5 대운·세운·월운
  - AC: AC9
- [x] T6 궁합 (상대 정보 그때그때 입력·미저장)
  - AC: AC8
- [x] T7 히스토리 30일
  - AC: AC10
- [x] T8 이미지 전량 생성+적용, 한국 전통 디자인 마감 (Gemini → Replicate flux-schnell로 교체)
- [x] T-last 마감: 빈/에러/로딩 상태, AC12(360px), 오프라인 최종(AC7), README, 실기기 체크리스트

## 사람이 할 일 (H)
- [x] H1 Google AI Studio에서 Gemini API 키 발급 → 프로젝트 `.env`에 `GEMINI_API_KEY=` 입력 (필요 시점: T8, 빠를수록 좋음)
- [ ] H2 GitHub 공개 저장소 `sajoo` 생성 + remote 연결 + Pages 활성화 (저장소 생성·push 완료 — Settings→Pages에서 GitHub Actions 선택만 남음)
- [ ] H3 폰에서 배포 URL 열어 홈화면에 추가, 오프라인·카드 뽑기 직접 확인 (필요 시점: T-last)
