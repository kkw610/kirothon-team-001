# Requirements Document

## Introduction

`recommend-result-ui` spec으로 만든 결과 화면(동작하는 틀)에 비주얼 디자인을 입힌다. 동작, 데이터, 상태 판별 로직은 바꾸지 않는다. 규칙은 `.kiro/steering/frontend-ui.md`(배치, 상태, 표기)와 `.kiro/steering/design-system.md`(색, 글꼴, 모양)를 따르고, 두 문서가 충돌하면 `frontend-ui.md`를 따른다.

담당 범위는 `src/features/result/`와 `src/features/map/`이다. `app/page.tsx`는 배치만 수정한다. `app/globals.css`, `app/layout.tsx`, `src/shared/types.ts`, `package.json`은 수정하지 않는다.

## Glossary

- **Result_Area**: `src/features/result/`의 컴포넌트(`ResultView`, `RecommendationCard`, `ComparisonTable`, `ResultSkeleton`, `ResultError`)가 그리는 결과 영역
- **Map_View**: `src/features/map/MapView.tsx`가 그리는 SVG 지도 컴포넌트
- **Recommendation_Card**: `best !== null`일 때 결과 영역 맨 위에 표시되는 추천 카드
- **Late_Card**: `best === null`이고 `options.length > 0`일 때 추천 카드 자리에 표시되는 제시간 도착 불가 카드
- **Breakdown_Card**: 지하철, 택시 대기, 택시, 합계의 시간과 비용을 줄마다 보여 주는 카드
- **Comparison_Table**: 역별 후보(`Option`)를 비교하는 표
- **Skeleton**: 로딩 중에 표시되는 자리표시 카드
- **Error_Card**: 요청 실패 시 오류 문구와 다시 시도 버튼을 보여 주는 카드
- **Empty_Card**: `options.length === 0`일 때 표시되는 후보 없음 카드
- **Design_Token**: `design-system.md`의 색 변수(`--primary`, `--on-primary`, `--primary-text`, `--primary-soft`, `--surface-tint`, `--ink`, `--text-sub`, `--border`, `--ok`, `--late`, `--late-row`, `--subway`, `--taxi`)
- **Heading_Font**: Jua(굵기 400)
- **Body_Font**: 기존 본문 글꼴
- **Touch_Target**: 버튼, 표 행 등 사용자가 누르는 요소
- **Best_Option**: 제시간 도착 중 총비용이 가장 낮아 추천된 `Option`
- **Fastest_Option**: `best === null`일 때 `options` 중 도착 시각이 가장 이른 `Option`
- **Mascot_Slot**: 마스코트 "환승이" 그림을 나중에 넣기 위해 비워 두는 자리

## Requirements

### Requirement 1: 디자인 토큰과 글꼴

**User Story:** As a 해커톤 심사위원, I want 서비스가 하나의 톤으로 다듬어져 보이기를, so that 완성도 높은 결과물로 느낀다.

#### Acceptance Criteria

1. THE Result_Area SHALL `src/features/result/result.module.css`의 모든 색 값(color, background, border-color, fill, stroke)을 해당 파일 상단에 선언한 Design_Token 변수(`var(--...)`)로만 지정하며, 변수 선언부 밖에는 hex, rgb, hsl 리터럴을 0개로 한다.
2. THE Map_View SHALL `src/features/map/`의 CSS Module 안 모든 색 값(color, background, border-color, fill, stroke)을 해당 파일 상단에 선언한 Design_Token 변수(`var(--...)`)로만 지정하며, 변수 선언부 밖에는 hex, rgb, hsl 리터럴을 0개로 한다.
3. THE Result_Area SHALL 추천 문장, 상태 제목, 섹션 제목을 Heading_Font로 표시한다.
4. THE Result_Area SHALL 시간, 요금, 도착 시각, 표 내용을 Body_Font로 표시하고 CSS `font-variant-numeric: tabular-nums`를 적용한다.
5. THE Result_Area SHALL Heading_Font를 사용하는 모든 요소의 font-weight를 400으로 지정하고, 400 외의 굵기 값은 0개로 한다.
6. THE Result_Area SHALL `src/features/result/` 안에서 `next/font/google`로 Heading_Font를 불러오며, 다른 폴더에서는 Heading_Font를 불러오지 않는다.
7. THE Result_Area SHALL 카드 모서리 반경을 16px, Recommendation_Card 모서리 반경을 20px, 버튼 모서리 반경을 12px, 표 셀 모서리 반경을 8px로 지정한다.
8. THE Result_Area SHALL 카드 구분을 `--border` 색 1px solid 테두리로 하고, 카드와 Recommendation_Card에 `box-shadow`를 지정하지 않는다.
9. THE Result_Area SHALL margin, padding, gap 값을 0 또는 4px, 8px, 12px, 16px, 20px, 24px 중에서만 지정한다.
10. THE Result_Area SHALL 흰색(#FFFFFF) 바탕 위에 표시하는 모든 글자의 WCAG 2.1 명도 대비를 일반 글자 4.5:1 이상, 큰 글자(24px 이상, 또는 굵게 표시하는 18.66px 이상) 3:1 이상으로 유지한다.
11. IF `next/font/google`이 Heading_Font를 불러오지 못하면, THEN THE Result_Area SHALL 대체 글꼴로 텍스트를 표시하고, 텍스트가 사라지지 않으며 레이아웃이 깨지지 않도록 유지한다.

### Requirement 2: 아이콘과 접근성

**User Story:** As a 사용자, I want 색을 구분하지 못해도 상태를 알 수 있기를, so that 결과를 정확히 이해한다.

#### Acceptance Criteria

1. THE Result_Area SHALL 모든 상태 표시(로딩, 오류, 빈 결과, 추천 결과의 상태 배지)에 이모지 문자를 사용하지 않고, 인라인 SVG 아이콘 1개와 비어 있지 않은 텍스트 라벨 1개를 함께 표시한다.
2. THE Result_Area SHALL 텍스트 라벨이 함께 표시되는 모든 장식용 SVG 아이콘에 `aria-hidden="true"`를 지정한다.
3. THE Result_Area SHALL 모든 Touch_Target의 렌더링된 높이를 44px 이상, 너비를 44px 이상으로 유지한다.
4. THE Result_Area SHALL 색으로 구분되는 모든 상태에 대해 색과 별개로 텍스트 라벨 또는 아이콘 형태 중 1개 이상을 함께 제공하여, 색을 제거(그레이스케일)한 화면에서도 서로 다른 상태가 서로 다른 텍스트 또는 아이콘으로 구별되도록 한다.
5. WHILE 사용자의 운영체제 또는 브라우저가 동작 줄이기(`prefers-reduced-motion: reduce`)로 설정되어 있는 동안, THE Skeleton SHALL shimmer 애니메이션을 재생하지 않고 정적인 배경으로 표시한다.
6. WHEN 로딩 안내 또는 오류 안내가 Result_Area에 표시되면, THE Result_Area SHALL 오류 안내에는 `role="alert"`를, 로딩 안내에는 `aria-live="polite"` 또는 `role="status"`를 지정하여 보조 기술이 해당 안내 문구를 읽도록 한다.
7. IF 인라인 SVG 아이콘이 렌더링되지 못하면, THEN THE Result_Area SHALL 텍스트 라벨을 그대로 표시하여 상태 정보가 손실되지 않도록 한다.

### Requirement 3: 추천 있음 화면

**User Story:** As a 사용자, I want 결과가 나오면 어느 역에서 내릴지 가장 먼저 눈에 들어오기를, so that 바로 행동할 수 있다.

#### Acceptance Criteria

1. WHEN 추천 결과의 `best`가 `null`이 아니면, THE Result_Area SHALL Recommendation_Card를 Result_Area 안의 첫 번째 요소(Breakdown_Card보다 위)로 표시한다.
2. THE Recommendation_Card SHALL 배경색을 `--primary`로, 글자색을 `--on-primary`로 표시한다.
3. THE Recommendation_Card SHALL "추천 · 제시간 도착 중 가장 싼 방법" 문구를 칩 형태로 표시한다.
4. THE Recommendation_Card SHALL "{역 이름}역에서 택시로 갈아타세요" 문장을 Heading_Font로 표시한다. 이때 {역 이름}은 Best_Option의 환승역 이름이며 역 이름 끝에 "역"이 중복되지 않는다.
5. THE Recommendation_Card SHALL Best_Option의 도착 시각(HH:mm, 24시간제), 여유 시간(분 단위 정수), 총비용(원 단위, 천 단위 쉼표 구분)을 표시한다.
6. WHEN 추천 결과의 `best`가 `null`이 아니면, THE Result_Area SHALL Breakdown_Card를 Recommendation_Card 바로 아래에 흰색(`#FFFFFF`) 배경으로 표시한다.
7. THE Breakdown_Card SHALL 지하철, 택시 대기, 택시, 합계의 4개 행을 이 순서로 표시하며, 각 행에 소요 시간(분 단위 정수)과 비용(원 단위, 천 단위 쉼표 구분)을 표시한다. 지하철, 택시 대기, 택시 행에는 구간 색 막대를 함께 표시한다.
8. THE Breakdown_Card SHALL 지하철 행의 막대를 `--subway` 색으로, 택시 대기 행과 택시 행의 막대를 `--taxi` 색으로 표시한다.
9. THE Breakdown_Card SHALL 합계 금액을 `--primary-text` 색으로 표시하며, 글자 크기는 Breakdown_Card 안의 다른 모든 텍스트보다 크게 한다.
10. WHILE Recommendation_Card 또는 Breakdown_Card에 택시 요금이 표시되는 동안, THE Result_Area SHALL 택시 요금과 같은 줄 또는 바로 옆에 "교통상황에 따라 변동" 문구를 표시한다.
11. IF Best_Option의 도착 시각, 여유 시간, 총비용 중 하나라도 값이 없거나 유효하지 않으면, THEN THE Result_Area SHALL 해당 값 자리에 "-"를 표시하고 나머지 값과 화면 구성은 그대로 유지한다.

### Requirement 4: 제시간 도착 불가 화면

**User Story:** As a 사용자, I want 제시간 도착이 불가능할 때 화면 분위기만 봐도 알기를, so that 다른 계획을 세운다.

#### Acceptance Criteria

1. WHEN 추천 결과가 `best === null`이고 `options.length >= 1`이면, THE Result_Area SHALL Recommendation_Card를 표시하지 않고 같은 위치에 Late_Card를 표시한다.
2. THE Late_Card SHALL 배경색을 흰색(`#FFFFFF`)으로, 테두리를 두께 2px의 `--late` 색 실선으로 표시한다.
3. THE Late_Card SHALL "제시간 도착 불가" 칩과 "제시간에 도착하는 방법이 없어요" 문장을 Heading_Font로 표시한다.
4. WHEN Late_Card가 표시되면, THE Late_Card SHALL Fastest_Option의 역 이름, 도착 시각(24시간제 `HH:MM`), 늦는 분 수(1 이상의 정수, "N분 늦음" 형식)를 표시한다.
5. WHEN 두 개 이상의 옵션이 동일한 가장 이른 도착 시각을 가지면, THE Result_Area SHALL 목록 순서상 첫 번째 옵션을 Fastest_Option으로 선택한다.
6. WHEN Late_Card가 표시되면, THE Comparison_Table SHALL 전체 옵션 중 Fastest_Option 행 1개에만 "가장 빠름" 배지를 표시한다.
7. IF `best === null`이고 `options.length === 0`이면, THEN THE Result_Area SHALL Late_Card를 표시하지 않고 Late_Card와 구분되는 빈 결과 안내 메시지를 표시한다.

### Requirement 5: 비교표

**User Story:** As a 사용자, I want 시간과 요금 숫자를 헷갈리지 않고 비교하기를, so that 후보를 빠르게 고른다.

#### Acceptance Criteria

1. THE Comparison_Table SHALL Best_Option 행을 `--primary-soft` 배경, 왼쪽 4px `--primary` 선, "추천" 알약 배지로 강조한다.
2. WHEN 행의 도착 시각이 희망 도착 시각보다 1분 이상 늦으면, THE Comparison_Table SHALL 해당 행 글자를 `--late-row` 색으로 표시한다.
3. WHEN 행의 도착 시각이 희망 도착 시각보다 1분 이상 늦으면, THE Comparison_Table SHALL 지연 분 수를 정수로 환산한 "N분 늦음"(N은 1 이상의 정수)을 `--late` 색 텍스트로 해당 행에 표시한다.
4. IF 행의 도착 시각이 희망 도착 시각과 같거나 빠르면, THEN THE Comparison_Table SHALL 해당 행에 `--late-row` 색과 "N분 늦음" 텍스트를 표시하지 않는다.
5. THE Comparison_Table SHALL 시간과 금액 열의 숫자를 `tabular-nums`로 표시하고 오른쪽 정렬한다.
6. WHILE 화면 폭이 640px 미만이면, THE Comparison_Table SHALL 각 행을 8px 모서리와 1px `--border` 테두리를 가진 카드로 표시한다.
7. WHILE 화면 폭이 640px 미만이면, THE Comparison_Table SHALL 각 `td`의 `data-label` 값을 해당 셀 값 앞에 라벨로 표시한다.

### Requirement 6: 로딩 화면

**User Story:** As a 사용자, I want 계산 중임을 알기를, so that 기다려야 한다는 것을 이해한다.

#### Acceptance Criteria

1. WHILE `loading === true`, THE Result_Area SHALL "경로 계산 중..." 제목을 Heading_Font로 표시한다.
2. WHILE `loading === true`, THE Skeleton SHALL 추천 카드 1개, Breakdown_Card 1개, 비교표 1개 모양의 자리표시를 각각 `--surface-tint` 배경색으로 표시한다.
3. THE Skeleton SHALL 자신의 폭을 부모 요소 폭의 100%로 설정한다.
4. WHEN `loading`이 `true`에서 `false`로 바뀌면, THE Result_Area SHALL 100ms 이내에 "경로 계산 중..." 제목과 Skeleton을 제거한다.
5. IF `loading`이 `true`로 유지된 시간이 30초를 초과하면, THEN THE Result_Area SHALL 계속 Skeleton을 표시하고 계산이 지연되고 있음을 알리는 안내 문구를 제목 아래에 추가로 표시한다.

### Requirement 7: 오류와 후보 없음 화면

**User Story:** As a 사용자, I want 실패하거나 결과가 없을 때 이유와 다음 행동을 알기를, so that 다시 시도하거나 입력을 바꾼다.

#### Acceptance Criteria

1. IF 추천 요청이 실패하면, THEN THE Error_Card SHALL 흰 배경 카드에 경고 SVG 아이콘, 서버가 준 오류 문구, "다시 시도" 버튼을 표시한다.
2. IF 추천 요청이 실패했고 서버가 오류 문구를 제공하지 않거나 빈 문자열(공백만 있는 경우 포함)을 제공하면, THEN THE Error_Card SHALL 오류 원인을 알리는 기본 안내 문구를 서버 오류 문구 대신 표시하고 "다시 시도" 버튼을 유지한다.
3. IF 서버가 준 오류 문구가 200자를 초과하면, THEN THE Error_Card SHALL 카드 안에서 줄바꿈하여 전체 문구를 표시하고 카드 밖으로 넘치지 않게 한다.
4. THE Error_Card SHALL "다시 시도" 버튼을 `--primary` 배경, `--on-primary` 글자, 12px 모서리로 표시한다.
5. WHEN 사용자가 "다시 시도" 버튼을 누르면, THE Error_Card SHALL 기존 `onRetry` 콜백을 1회 호출한다.
6. WHEN 사용자가 "다시 시도" 버튼을 누르면, THE Error_Card SHALL 입력한 출발지, 도착지, 조건 값을 변경하지 않고 유지한다.
7. IF `options.length === 0`이면, THEN THE Empty_Card SHALL 흰 배경 카드에 "경로를 찾지 못했어요" 제목을 Heading_Font로, 출발지 또는 도착지를 바꿔 다시 검색하라는 안내 문구를 Body_Font로 표시한다.

### Requirement 8: 지도

**User Story:** As a 사용자, I want 추천 경로를 지도에서 한눈에 보기를, so that 이동 흐름을 이해한다.

#### Acceptance Criteria

1. THE Map_View SHALL 지도 카드를 모서리 반경 16px, 배경색 `--surface-tint`로 표시한다.
2. WHERE `highlightStopName`이 주어지고 해당 이름과 일치하는 역이 `routes`에 존재하면, THE Map_View SHALL 해당 역 위치에서 `destination` 위치까지 `--taxi` 색 점선 1개를 그린다.
3. WHERE `highlightStopName`이 주어지고 해당 이름과 일치하는 역이 `routes`에 존재하면, THE Map_View SHALL 해당 역 마커 1개를 `--primary` 색으로 표시하고 나머지 역 마커는 `--primary` 색으로 표시하지 않는다.
4. IF `highlightStopName`이 주어지지 않았거나 `routes`에 일치하는 역이 없으면, THEN THE Map_View SHALL `--taxi` 점선과 `--primary` 강조 마커를 그리지 않고 `routes`와 `destination`은 그대로 표시한다.
5. THE Map_View SHALL 기존 props(`routes`, `destination`, `highlightStopName`)의 이름, 타입, 필수 여부를 변경하지 않는다.
6. WHEN 부모 요소의 폭이 320px에서 1200px 사이로 바뀌면, THE Map_View SHALL SVG `viewBox`의 가로세로 비율을 유지한 채 폭을 부모 폭의 100%로 조절하고 가로 스크롤을 만들지 않는다.
7. THE Map_View SHALL 지도 SVG에 `role="img"`와, 출발지·경유 역·목적지 이름을 포함하는 비어 있지 않은 `aria-label`을 항상 유지한다.

### Requirement 9: 동작 보존과 변경 범위

**User Story:** As a 팀원, I want 디자인 적용이 동작을 바꾸지 않기를, so that 기존 테스트와 다른 담당자 작업이 깨지지 않는다.

#### Acceptance Criteria

1. THE Result_Area SHALL `best`, `options`, `loading`, 오류 여부 네 값의 조합으로 표시 상태(로딩, 오류, 빈 결과, 결과 있음)를 판별하는 기존 로직을 유지하며, 디자인 적용 전후에 동일한 입력 조합 16가지(네 값의 존재/부재 조합)에 대해 동일한 표시 상태를 반환한다.
2. THE Result_Area SHALL 화면에 표시되는 시간, 금액, 여유, 지각 문자열을 `src/features/result/format.ts`에서 export하는 함수의 반환값으로만 만들고, 컴포넌트 파일(`*.tsx`)에는 해당 문자열을 직접 조합하는 코드(템플릿 문자열, 문자열 연결, `toLocaleString` 호출)를 두지 않는다.
3. WHEN 디자인 적용이 끝나면, THE Result_Area SHALL `src/features/result/format.test.ts`와 `src/features/recommender/recommend.test.ts`를 한 줄도 수정하지 않은 상태에서 `vitest --run` 실행 시 실패 0건, 건너뜀 0건으로 통과한다.
4. THE Result_Area SHALL `@/shared/types`에서 import한 타입만 props 타입으로 사용하고, `src/features/result/` 아래 컴포넌트가 다른 feature 폴더(`recommender`, `places`, `taxi`, `transit`)의 타입을 props로 받지 않는다.
5. THE `app/page.tsx` SHALL 결과 영역의 배치 변경(JSX 구조와 `app/page.module.css` 클래스 지정)만 수정하고, 상태 관리, API 호출(`/api/recommend`, `/api/places`), 이벤트 핸들러 코드는 수정하지 않는다.
6. IF 디자인 적용 후 `src/features/result/` 및 `app/page.module.css`와 `app/page.tsx` 외의 파일(`src/shared/`, `src/features/recommender/`, `src/features/places/`, `src/features/taxi/`, `src/features/transit/`, `app/api/`)에 변경이 발견되면, THEN THE Result_Area SHALL 해당 변경을 되돌려 변경 범위를 위 두 경로로 제한한다.

### Requirement 10: 마스코트 자리

**User Story:** As a 디자이너, I want 마스코트를 나중에 넣을 자리를 확보하기를, so that 그림이 준비되면 레이아웃 수정 없이 추가한다.

#### Acceptance Criteria

1. THE Recommendation_Card SHALL Mascot_Slot을 카드의 오른쪽 가장자리에 두고, 너비와 높이를 각각 64px로 고정하여 예약한다.
2. THE Skeleton, Error_Card, Late_Card SHALL Mascot_Slot을 각 카드의 왼쪽 가장자리에 두고, 너비와 높이를 각각 64px로 고정하여 예약한다.
3. WHILE Mascot_Slot에 그림이 없는 상태이면, THE Result_Area SHALL Mascot_Slot의 64px × 64px 영역을 빈 공간으로 유지하고, 카드 내용의 겹침, 잘림, 가로 스크롤 없이 표시한다.
4. WHEN Mascot_Slot에 64px × 64px 크기의 그림이 추가되면, THE Result_Area SHALL 카드의 너비와 카드 내 다른 요소의 위치를 변경하지 않고 그림을 Mascot_Slot 안에 표시한다.
5. THE Result_Area SHALL Recommendation_Card, Skeleton, Error_Card, Late_Card 각각의 상태 의미(추천 결과, 로딩 중, 오류, 지연)를 Mascot_Slot의 그림 유무와 관계없이 텍스트로 전달한다.
6. THE Mascot_Slot SHALL 장식 요소로 취급되어 보조기기(스크린 리더)의 읽기 대상에서 제외된다.

## 범위 밖

- 마스코트 그림 제작
- 도착 시각 슬라이더, 시간·비용 그래프, 카카오 지도
- 입력 폼(`src/features/search-form/`) 디자인
