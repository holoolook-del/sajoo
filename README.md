# SAJOO — 나의 사주

한국식 사주(만세력 정밀 계산)와 매일 뽑는 운세카드가 있는 개인용 PWA. 완전 오프라인 동작, 모든 데이터는 기기에만 저장됩니다.

## 기능

- **사주팔자**: 양력/음력(윤달) 생년월일시 → 사주·십신·오행·공망·대운 (KASI 정본 `manseryeok`, 자시 관법, 생시 모름 → 3주)
- **운세카드**: 매일 자정(KST) 리셋, 하루 1장, 민화풍 일러스트 24장 덱 + 게임식 뽑기 연출
- **오늘의 운세**: 일진×내 사주 조합 (십신·지지 관계·상생상극)
- **대운·세운·월운**: 10년 대운 타임라인 + 올해 세운 + 12개월 월운
- **궁합**: 상대 정보를 그때그때 입력(저장 안 함), 일간·일지·십신·오행 보완 분석
- **기록**: 최근 30일 운세·카드 기록

## 개발

```bash
pnpm install        # 의존성
pnpm dev            # 개발 서버
pnpm verify         # typecheck + lint + test + build
pnpm e2e            # e2e (desktop+mobile)
pnpm e2e:preview    # 오프라인 AC7 검증 (빌드→preview→SW)
pnpm audit:code     # knip + jscpd
pnpm gen:images     # 이미지 재생성 (개발용, .env의 REPLICATE_API_TOKEN 필요)
```

## 구조

`src/lib/` 순수 도메인(엔진 래퍼·저장·날짜·해석·지지관계) · `src/content/` 번들 풀이문·카드·메타 · `src/features/<기능>/` 기능별 UI+로직 · `src/pages/` 화면 · `public/assets/` 생성 이미지(프리캐시) · `e2e/` Playwright · `docs/` SPEC·DECISIONS·TASKS·PROGRESS·CODE_INDEX

## 배포

GitHub Pages (Actions → Pages). 저장소 Settings → Pages → Source를 "GitHub Actions"로 선택하면 push 시 자동 배포. base 경로 `/sajoo/`.

## 개인정보

생년월일시·성별·기록은 localStorage에만 저장 — 외부 전송 없음. 런타임 외부 API 호출 0 (이미지·풀이문 전부 번들).
