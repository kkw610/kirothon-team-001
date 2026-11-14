# Implementation Plan: 결과 화면 디자인 적용 (result-ui-design)

## Overview

`recommend-result-ui`로 만든 결과 화면의 동작은 그대로 두고, `src/features/result/`와 `src/features/map/`에 디자인(색 토큰, Jua 제목 글꼴, 모양, SVG 아이콘, 마스코트 자리)을 적용한다. 구현 언어는 TypeScript(React, CSS Modules)다. 구현 순서는 다음과 같다.

1. `format.ts` 확장과 공통 헬퍼
2. 순수 함수 계층(표시 상태, 가장 빠른 옵션, 내역 행, 비교 행)
3. CSS와 컴포넌트
4. 지도
5. `app/page.tsx` 배치

제약:

- 기존 `format.test.ts`, `recommend.test.ts`는 수정하지 않는다. 새 테스트는 새 `.test.ts` 파일에 둔다.
- `app/globals.css`, `app/layout.tsx`, `src/shared/`, `package.json`, `src/features/{recommender,places,taxi,transit}/`, `app/api/`는 수정하지 않는다.
- `*.tsx`에는 템플릿 문자열, 문자열 연결, `toLocaleString`으로 만든 표시 문구를 두지 않는다. 문구는 `format.ts`에서 가져온다.
- 속성 기반 테스트는 `fast-check`가 필요하다. `package.json`을 이 스펙에서 고치지 않으므로, 의존성이 없으면 같은 속성을 대표 값과 경계 값 표로 검증하는 예시 기반 테스트로 대신한다.

## Tasks

- [x] 1. 공통 기반: 문구 함수, 글꼴, 아이콘
  - [x] 1.1 `format.ts`에 표시 문구 함수와 상수 추가
    - 기존 export의 시그니처와 반환값은 유지하고 추가만 한다. `formatTime`에는 `hourCycle: "h23"`만 더한다.
    - 추가 함수: `formatStationName`, `formatTransferHeadline`, `formatTimeRange`, `addMinutes`, `formatLateMinutes`, `safeTime`, `safeWon`, `safeMargin`, `formatArrivalSummary`, `resolveErrorMessage`
    - 추가 상수: `RECOMMEND_CHIP`, `LATE_CHIP`, `LATE_HEADLINE`, `LOADING_TITLE`, `SLOW_NOTICE`, `SLOW_THRESHOLD_MS`, `ERROR_TITLE`, `DEFAULT_ERROR_MESSAGE`, `EMPTY_TITLE`, `EMPTY_HINT`, `TAXI_FARE_NOTE`, `FASTEST_BADGE`, `BEST_BADGE`
    - `safe*` 함수는 `undefined`, `null`, `NaN`, 잘못된 날짜에서 예외 없이 "-"를 돌려준다.
    - _Requirements: 공통(표기), 추천 있음(역 이름, 도착 시각, 여유, 총비용, "-" 대체), 제시간 도착 불가("N분 늦음"), 비교표("N분 늦음"), 오류(기본 문구), 동작 보존(문자열은 `format.ts`에서만 생성)_

  - [ ]* 1.2 `format.display.test.ts` 작성 (속성 1, 2, 3, 8)
    - **Property 1: 역 이름 정리는 "역"을 정확히 한 번 붙이고 멱등이다**
    - **Property 2: 시각, 금액, 여유 문구의 형식**
    - **Property 3: 유효하지 않은 값은 "-"가 되고 예외를 던지지 않는다**
    - **Property 8: 오류 문구 대체**
    - 각 테스트에 `Feature: result-ui-design, Property N: ...` 태그 주석을 달고 `numRuns: 100`으로 실행한다.
    - **Validates: Requirements 추천 있음(3.4, 3.5, 3.11), 오류(7.2, 7.3)**

  - [x] 1.3 공통 헬퍼 파일 생성
    - `src/features/result/cx.ts`: falsy 값을 무시하는 `cx(...)`
    - `src/features/result/fonts.ts`: `next/font/google`의 Jua(`weight: "400"`, `display: "swap"`, `variable: "--font-heading"`, `fallback`). 프로젝트 안에서 `next/font/google`을 import하는 유일한 파일로 둔다.
    - `src/features/result/icons.tsx`: `CheckIcon`, `AlertIcon`, `PinIcon`, `ClockIcon`. 항상 `aria-hidden="true"`, `focusable="false"`
    - _Requirements: 공통(Jua 로드 위치, 대체 글꼴), 아이콘과 접근성(SVG 아이콘, aria-hidden)_

- [x] 2. 순수 함수 계층
  - [x] 2.1 `viewState.ts`와 `select.ts` 생성
    - `resolveViewState`: loading → error → (options 없음 ? empty : best 있음 ? recommended : late)
    - `pickFastest`: 도착 시각이 가장 이른 옵션, 동률이면 배열 앞쪽
    - `isSameOption`: `routeId`와 `stopName`으로 비교
    - _Requirements: 동작 보존(상태 판별), 추천 있음(추천 카드 위치), 제시간 도착 불가(가장 빠른 옵션, 빈 결과)_

  - [ ]* 2.2 `viewState.test.ts` 작성 (속성 5)
    - **Property 5: 표시 상태 판별은 고정된 우선순위를 따른다**
    - 16가지 조합 기대값 표를 하드코딩한 회귀 테스트를 함께 둔다.
    - **Validates: Requirements 추천 있음(3.1), 제시간 도착 불가(4.1, 4.7), 동작 보존(9.1)**

  - [ ]* 2.3 `select.test.ts` 작성 (속성 6 중 `pickFastest`)
    - **Property 6: 가장 빠른 옵션 선택**
    - 가장 이른 도착 시각, 동률이면 앞쪽 옵션을 검증한다.
    - **Validates: Requirements 제시간 도착 불가(4.5)**

  - [x] 2.4 `breakdown.ts` 생성
    - `buildBreakdownRows(option)`: 지하철, 택시 대기, 택시, 합계 4행을 이 순서로 돌려준다.
    - 시각 범위는 `addMinutes`로 계산한다. 합계 시간은 세 구간의 합, 합계 비용은 `totalCost`이다. 택시 행에만 `TAXI_FARE_NOTE`를 넣는다.
    - _Requirements: 추천 있음(내역 4행, 택시 요금 문구)_

  - [ ]* 2.5 `breakdown.test.ts` 작성 (속성 4)
    - **Property 4: 내역 행은 4개이고 순서, 값, 합계가 일치한다**
    - `totalCost = subwayFare + taxiFare`를 만족하는 `Option` 생성기를 쓴다.
    - **Validates: Requirements 추천 있음(3.7, 3.10)**

  - [x] 2.6 `comparison.ts` 생성
    - `buildComparisonRows(options, best, deadline)`: 행별 `isBest`, `isFastest`, `isLate`, `lateText`
    - 늦음 판정은 `diffMinutes(deadline, arrival) < 0`이다. `isFastest`는 `best === null`일 때 `pickFastest` 결과 한 행에만 `true`다.
    - _Requirements: 제시간 도착 불가("가장 빠름" 배지 1개), 비교표(추천 강조, 늦음 표시)_

  - [ ]* 2.7 `comparison.test.ts` 작성 (속성 6, 7)
    - **Property 6: 가장 빠른 옵션 선택** (비교 행의 `isFastest`가 정확히 1개, `best !== null`이면 0개)
    - **Property 7: 늦음 판정과 "N분 늦음" 문구**
    - **Validates: Requirements 제시간 도착 불가(4.4, 4.6), 비교표(5.2, 5.3, 5.4)**

- [x] 3. Checkpoint - 순수 함수 확인
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 결과 영역 CSS와 컴포넌트
  - [x] 4.1 `result.module.css` 재작성
    - 맨 위 `.root` 규칙에 Design_Token 변수(`--primary`, `--on-primary`, `--primary-text`, `--primary-soft`, `--surface-tint`, `--ink`, `--text-sub`, `--border`, `--ok`, `--late`, `--late-row`, `--subway`, `--taxi`, `--surface`, `--late-soft`)를 선언한다. 이 선언부 밖에는 hex, rgb, hsl 리터럴을 두지 않는다.
    - `.heading`(`var(--font-heading)`, 대체 글꼴, `font-weight: 400`), `tabular-nums`, 카드 16px, 추천 카드와 늦음 카드 20px, 버튼 12px, 표 셀 8px, 1px `--border`, `box-shadow` 없음
    - margin, padding, gap은 0, 4, 8, 12, 16, 20, 24px만 쓴다. 버튼과 표 행은 최소 44px다.
    - `.mascotSlot`(64px × 64px, `flex: none`), shimmer와 `@media (prefers-reduced-motion: reduce)` 정지, 640px 미만 표를 행 카드로 표시(`td::before`에 `attr(data-label)`), 추천 제목 24px(768px 이상 28px)
    - 오류 본문 `overflow-wrap: anywhere`
    - _Requirements: 공통(색 토큰, 글꼴, 모양, 간격, 대비), 아이콘과 접근성(터치 크기, 동작 줄이기), 비교표(모바일 카드), 마스코트 자리(64px)_

  - [x] 4.2 `RecommendationCard.tsx` 수정, `LateCard.tsx` 생성
    - 추천 카드: `--primary` 배경, `--on-primary` 글자, 칩, `formatTransferHeadline` 제목(Heading_Font), `formatArrivalSummary` 요약, 오른쪽 64px 마스코트 자리(`aria-hidden`)
    - 늦음 카드: 흰 배경, 2px `--late` 테두리, `AlertIcon`이 있는 칩, 제목, `pickFastest` 옵션의 역 이름과 도착 시각과 "N분 늦음"(없으면 "-"), 왼쪽 64px 마스코트 자리
    - 이모지를 쓰지 않고 `icons.tsx`의 아이콘과 텍스트 라벨을 함께 둔다.
    - _Requirements: 추천 있음(추천 카드), 제시간 도착 불가(늦음 카드), 아이콘과 접근성, 마스코트 자리(10.1, 10.2, 10.5, 10.6)_

  - [x] 4.3 `BreakdownCard.tsx` 생성
    - `buildBreakdownRows` 결과 4행을 그린다. 지하철 행 막대는 `--subway`, 택시 대기와 택시 행 막대는 `--taxi`이다.
    - 합계 금액은 `--primary-text`이고 카드 안에서 가장 큰 글자(20px)로 한다. 택시 요금 바로 옆에 "교통상황에 따라 변동" 문구를 표시한다.
    - _Requirements: 추천 있음(내역 카드, 구간 색 막대, 합계 강조, 택시 요금 문구)_

  - [x] 4.4 `ComparisonTable.tsx` 수정
    - `buildComparisonRows`로 행 상태를 정한다. 추천 행은 `--primary-soft` 배경, 왼쪽 4px `--primary` 선, "추천" 알약 배지를 쓴다.
    - 늦은 행은 글자색 `--late-row`, 지연 문구 "N분 늦음"은 `--late`로 표시한다. 늦지 않은 행에는 표시하지 않는다.
    - "가장 빠름" 배지는 한 행에만 표시한다. 숫자 셀은 `tabular-nums`, 오른쪽 정렬이다. 모든 `td`에 `data-label`을 붙인다.
    - _Requirements: 비교표(추천 행, 늦음 행, 숫자 정렬, 모바일 카드와 `data-label`), 제시간 도착 불가("가장 빠름" 배지)_

  - [x] 4.5 `ResultStates.tsx` 수정: `ResultSkeleton`, `ResultError`, `EmptyCard`
    - `ResultSkeleton`: `role="status"`, `aria-live="polite"`, 제목 "경로 계산 중..."(Heading_Font), 추천 카드와 내역 카드와 비교표 모양의 `--surface-tint` 자리표시, 폭 100%, 왼쪽 64px 마스코트 자리. `"use client"`에서 `useEffect`와 `setTimeout(SLOW_THRESHOLD_MS)`로 30초 초과 시 안내 문구를 제목 아래에 추가하고 언마운트 시 타이머를 정리한다.
    - `ResultError`: `role="alert"`, 흰 카드, `AlertIcon`, 제목, `resolveErrorMessage(message)` 본문, `--primary` 배경 "다시 시도" 버튼(12px 모서리, 44px 이상). `onClick`에 기존 `onRetry`를 그대로 연결한다. 왼쪽 64px 마스코트 자리
    - `EmptyCard`: 흰 카드, `PinIcon`, "경로를 찾지 못했어요" 제목, 안내 문구. 마스코트 자리 없음
    - 각 루트에 `jua.variable` 클래스를 붙인다. props 이름, 타입, 필수 여부는 바꾸지 않는다.
    - _Requirements: 로딩(제목, 스켈레톤, 30초 안내), 오류와 후보 없음(오류 카드, 기본 문구, 긴 문구, 재시도, 빈 카드), 아이콘과 접근성(role, 동작 줄이기), 마스코트 자리(10.2)_

  - [x] 4.6 `ResultView.tsx` 수정, `index.ts` 확인
    - `resolveViewState`로 분기한다. recommended는 `RecommendationCard`, `BreakdownCard(best)`, `ComparisonTable` 순서이고, late는 `LateCard`, `BreakdownCard(pickFastest)`, `ComparisonTable`, empty는 `EmptyCard`다.
    - 루트에 `jua.variable`을 붙이고 props는 `result`, `arrivalDeadline`을 유지한다. `index.ts`의 기존 export를 유지하고 필요한 새 컴포넌트를 추가한다.
    - _Requirements: 추천 있음(카드 순서), 제시간 도착 불가, 동작 보존(상태 판별, props 타입)_

  - [ ]* 4.7 정적 검사 테스트 `result.static.test.ts` 작성
    - CSS 소스: `.root` 선언부를 제외하고 색 리터럴 0개, `font-weight`는 400뿐, `box-shadow` 없음, margin/padding/gap은 허용 값뿐
    - `*.tsx` 소스: 이모지, `toLocaleString`, 문자열 조합 없음. `next/font/google` import는 `fonts.ts` 한 곳뿐
    - 토큰 표로 흰 바탕과 `--primary` 바탕의 WCAG 대비 계산(`--ok`는 글자쌍에서 제외)
    - **Validates: Requirements 공통(1.1, 1.5, 1.6, 1.8, 1.9, 1.10), 아이콘과 접근성(2.1), 동작 보존(9.2)**

- [x] 5. 지도
  - [x] 5.1 `mapModel.ts` 생성
    - `buildMapModel`: 노선 선, 정류장, 출발지, 목적지, 그리고 `highlightStopName`과 일치하는 첫 정류장 하나에 대한 `highlight`와 `taxiLine`(그 정류장에서 목적지까지). 일치하는 역이 없으면 `highlight`, `taxiLine`이 없다.
    - `buildMapLabel`: 출발지, 경유 역, 목적지 이름(강조 역이 있으면 포함)을 담은 비어 있지 않은 문자열
    - 기존 좌표 변환 로직을 유지하고 점이 하나일 때 범위가 0이 되는 경우를 처리한다.
    - _Requirements: 지도(택시 점선, 강조 마커 1개, 일치 없음 처리, aria-label)_

  - [ ]* 5.2 `mapModel.test.ts` 작성 (속성 9, 10)
    - **Property 9: 지도 모델의 강조와 택시 점선**
    - **Property 10: 지도 `aria-label`은 비어 있지 않고 이름을 포함한다**
    - **Validates: Requirements 지도(8.2, 8.3, 8.4, 8.7)**

  - [x] 5.3 `map.module.css` 생성, `MapView.tsx` 수정
    - `map.module.css` 맨 위에 색 토큰 변수를 선언하고, 지도 카드(16px, `--surface-tint`), 노선(`--subway`), 택시 점선(`--taxi`, `stroke-dasharray`), 강조 마커(`--primary`) 클래스를 만든다. 선언부 밖에는 색 리터럴을 두지 않는다.
    - `MapView`는 `buildMapModel`, `buildMapLabel`을 사용하고, SVG에 `role="img"`, `aria-label`, `viewBox`를 둔다. 고정 `width`, `height` 속성은 쓰지 않고 CSS로 폭 100%, 가로 스크롤 없음을 만든다.
    - props(`routes`, `destination`, `highlightStopName`)의 이름, 타입, 필수 여부는 바꾸지 않는다.
    - _Requirements: 공통(색 토큰), 지도(카드 모양, 점선, 강조 마커, 반응형, 접근성, props 유지)_

- [x] 6. 페이지 배치
  - [x] 6.1 `app/page.tsx`와 `app/page.module.css`의 결과 영역 배치 조정
    - 결과 영역 JSX 구조와 `page.module.css` 클래스만 수정한다. 상태 관리, `/api/recommend`, `/api/places` 호출, 이벤트 핸들러는 수정하지 않는다.
    - `MapView`에 `highlightStopName`으로 추천 역(또는 늦음 상태의 가장 빠른 옵션이 아닌 `best`)만 전달하고, 지도 카드 클래스를 전역 클래스에서 모듈 클래스 방식으로 맞춘다.
    - _Requirements: 동작 보존(`page.tsx`는 배치만 수정, 변경 범위), 지도_

- [x] 7. Final checkpoint - 전체 확인
  - `vitest --run`, 타입 검사, lint가 통과하는지 확인한다. `format.test.ts`, `recommend.test.ts`에 변경이 없는지, 변경이 허용 경로(`src/features/result/`, `src/features/map/`, `app/page.tsx`, `app/page.module.css`) 안에 있는지 확인한다.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- `*`가 붙은 하위 작업은 선택이며 건너뛸 수 있다.
- 각 작업은 요구사항 문서의 섹션 이름으로 근거를 표시했다. 요구사항 문서의 번호 체계가 `Requirement N` 아래 기준이므로 괄호 안 번호는 `N.항목`이다.
- 속성 기반 테스트(속성 1~10)는 `fast-check`가 필요하다. 설치되어 있지 않으면 `package.json` 담당자에게 `npm i -D fast-check`를 요청하거나 예시 기반 테스트로 대체한다.
- 마스코트 그림 제작, 입력 폼 디자인, 슬라이더, 그래프, 카카오 지도는 범위 밖이다.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "2.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "2.4", "2.6", "4.1", "5.2", "5.3"] },
    { "id": 2, "tasks": ["2.5", "2.7", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 3, "tasks": ["4.6"] },
    { "id": 4, "tasks": ["4.7", "6.1"] }
  ]
}
```
