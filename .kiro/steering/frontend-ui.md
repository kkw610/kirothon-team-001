---
inclusion: fileMatch
fileMatchPattern: "{src/features/result/**,src/features/map/**,app/page.tsx,app/globals.css}"
---
# 결과 화면·지도 UI 가이드

`src/features/result/`, `src/features/map/`, `app/page.tsx`의 화면 규칙이다. 폴더 경계와 import 규칙은 `structure.md`, 추천 계산 규칙은 `domain-rules.md`를 따른다.

## 반응형

모바일 우선으로 작성하고 `min-width` 미디어 쿼리로 넓힌다. 배치 CSS는 `app/page.module.css`에만 둔다(토큰과 `body` 바탕만 `globals.css`에 둔다).

단계마다 한 화면, 본문 컨테이너 폭 3구간.

| 구간 | 본문 컨테이너 폭 |
|---|---|
| 기본 (~767px) | 폭 100%, 좌우 16px |
| 768px~ | 최대 폭 760px |
| 1024px~ | 최대 폭 1200px |

- feature 컴포넌트는 배치를 모른다. 폭은 부모에 맞추고 고정 px 폭을 쓰지 않는다.
- 비교표는 640px 미만에서 행을 카드로 바꾼다(각 `td`의 `data-label`을 라벨로 표시). 그 외 넘칠 수 있는 요소는 `overflow-x: auto`로 감싼다.
- 지도는 SVG `viewBox`로 폭에 맞춰 줄고 늘어난다.
- 터치 대상은 모든 폭에서 높이 44px 이상.

## 담당 범위

| 위치 | 역할 |
|---|---|
| `src/features/result/` | 추천 카드, 비용 내역, 역별 비교표, 로딩·오류·제시간 도착 불가 상태 |
| `src/features/map/` | 지도. 지금은 SVG 자리표시, 나중에 카카오 지도로 교체 |
| `app/page.tsx` | 위 컴포넌트를 배치만 한다. 계산과 표시 로직을 쓰지 않는다 |

## 컴포넌트 규칙

- 컴포넌트는 `RecommendResponse`, `Option` 등 `@/shared/types`의 타입만 props로 받는다. 다른 기능 폴더를 import하지 않는다.
- 외부에서 쓰는 컴포넌트만 폴더의 `index.ts`로 내보낸다.
- `MapView`의 props(`routes`, `destination`, `highlightStopName`)는 카카오 지도로 교체할 때도 유지한다. 필요하면 optional prop만 추가한다.
- `shared/types.ts` 변경은 공통 파일 변경이다. spec의 design.md에 "공통 파일 변경 요청"으로 적고 담당자에게 맡긴다.

## 스타일

- 토큰과 `body` 바탕만 `globals.css`에 둔다. result와 map의 스타일은 각 폴더의 `*.module.css`(CSS Modules)로 둔다.
- 색상 값은 컴포넌트에 직접 쓰지 않고 해당 폴더의 CSS Module 상단 변수로 모아 둔다.

| 용도 | 값 |
|---|---|
| 제시간 도착, 추천 | `#16A34A` |
| 지각, 오류 | `#DC2626` |
| 기본(primary): 추천 강조, 배지, 주요 버튼 | `#8E44D4` (위의 글자는 `#FFFFFF`) |
| primary 연한 배경(추천 행) | `#F3EAFC` |
| 지하철 구간 | `#2E9E4F` (현재 SVG 색 유지) |
| 보조, 제시간 도착 불가 후보 | `#9CA3AF` |

## 표기 규칙

모든 포맷은 `src/features/result/format.ts`의 함수로 한다. 컴포넌트에서 문자열을 직접 조립하지 않는다.

| 대상 | 형식 | 예 |
|---|---|---|
| 금액 | 천 단위 쉼표 + `원` | `1,550원` |
| 택시 요금 | 추정치이므로 `약` 표기, 화면에 "교통상황에 따라 변동" 문구 | `약 9,800원` |
| 시각 | 24시간제 `HH:mm` (Asia/Seoul) | `18:52` |
| 소요 시간 | 60분 미만 `N분`, 이상 `N시간 M분` | `1시간 5분` |
| 여유 | 희망 도착 시각 - 도착 시각 | `4분 여유` |
| 지각 | 도착 시각 - 희망 도착 시각 | `3분 늦음` |

## 상태 화면

결과 영역은 아래 상태를 모두 처리한다.

| 상태 | 판별 | 표시 |
|---|---|---|
| 로딩 | `loading === true` | 스켈레톤 카드와 "경로 계산 중..." |
| 오류 | 요청 실패 | 서버가 준 오류 문구와 다시 시도 버튼 |
| 추천 있음 | `best !== null` | "OO역에서 택시로 갈아타세요", 시간·요금 내역, 비교표 |
| 제시간 도착 불가 | `best === null` 이고 `options.length > 0` | "제시간에 도착하는 방법이 없어요" + 가장 빨리 도착하는 대안과 늦는 시간 |
| 후보 없음 | `options.length === 0` | 경로를 찾지 못했다는 안내 |

- 총비용 내역은 지하철 시간·요금, 택시 대기·시간·요금, 총비용을 모두 보여 준다.
- 비교표에서 추천 행은 강조하고, 제시간에 도착하지 못하는 행은 회색 + "N분 늦음" 텍스트로 구분한다.

## 접근성

- 색상만으로 상태를 구분하지 않는다. 아이콘이나 텍스트를 함께 쓴다.
- 버튼과 탭 대상은 높이 44px 이상.
- 지도에는 `role="img"`와 `aria-label`로 경로 요약을 제공하고, 같은 정보를 카드에서도 텍스트로 보여 준다.
- 오류와 로딩 안내에는 `role="alert"` 또는 `aria-live`를 둔다.
