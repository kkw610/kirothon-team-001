# 설계: 추천 결과 화면 (recommend-result-ui)

## 데이터 흐름

```
SearchForm --onSubmit(request)--> page.tsx --POST /api/recommend--> RecommendResponse
page.tsx 상태: idle | loading | error | success
success -> ResultView(result, arrivalDeadline) + MapView(routes, destination, highlightStopName)
```

- 화면 상태 분기와 요청은 `page.tsx`가 한다. 표시 로직은 `result/`에 둔다.
- 여유와 지각은 `arrivalDeadline`(요청의 `arrivalTime`)이 필요하다. `page.tsx`가 `ResultView`에 prop으로 넘긴다. 응답 타입은 바꾸지 않는다.
- 제시간 도착 불가의 "가장 빠른 대안"은 `options`에서 도착 시각이 가장 이른 것이다.

## 컴포넌트

| 컴포넌트 | 파일 | props |
|---|---|---|
| `ResultView` | `result/ResultView.tsx` | `result: RecommendResponse`, `arrivalDeadline: string` |
| `RecommendationCard` | `result/RecommendationCard.tsx` | `option: Option`, `arrivalDeadline: string` |
| `ComparisonTable` | `result/ComparisonTable.tsx` | `options: Option[]`, `best: Option \| null`, `arrivalDeadline: string` |
| `ResultSkeleton` | `result/ResultStates.tsx` | 없음 |
| `ResultError` | `result/ResultStates.tsx` | `message: string`, `onRetry: () => void` |
| `MapView` | `map/MapView.tsx` | 기존 유지 |

`result/index.ts`는 `ResultView`, `ResultSkeleton`, `ResultError`를 내보낸다.

## format.ts 추가 함수

| 함수 | 입력 → 출력 |
|---|---|
| `formatDuration(min)` | `65` → `1시간 5분`, `14` → `14분` |
| `diffMinutes(deadlineIso, arrivalIso)` | 분 단위 정수(내림). 양수면 여유, 음수면 지각 |
| `formatMargin(diffMin)` | `4` → `4분 여유`, `-3` → `3분 늦음`, `0` → `딱 맞게 도착` |
| `formatTaxiFare(n)` | `9800` → `약 9,800원` |

## 생성/수정할 파일 목록

| 파일 | 구분 |
|---|---|
| `src/features/result/format.ts` | 수정 |
| `src/features/result/format.test.ts` | 생성 |
| `src/features/result/RecommendationCard.tsx` | 생성 |
| `src/features/result/ComparisonTable.tsx` | 생성 |
| `src/features/result/ResultStates.tsx` | 생성 |
| `src/features/result/ResultView.tsx` | 수정 |
| `src/features/result/index.ts` | 수정 |
| `src/features/result/result.module.css` | 생성 |
| `src/features/map/MapView.tsx` | 수정 (출발지 마커, 라벨) |
| `app/page.tsx` | 수정 (상태 분기, prop 전달, 재시도) |

`app/page.tsx`는 다른 팀원도 고칠 수 있으므로 변경 전에 확인한다.

## 공통 파일 변경 요청

없음. `shared/types.ts`, `app/globals.css`, `package.json`은 수정하지 않는다. 스타일은 `result.module.css`에 둔다.
