# Design Document

## Overview

환승역 추천기(`recommend`)는 지금 모든 `routes`의 지하철 정류장을 `flatMap`으로 합쳐 후보로 삼는다. 이 설계는 도메인 규칙("지하철 단일 경로 1개 기준")에 맞추기 위해 후보를 만들기 전에 경로 1개를 고르는 단계를 추가한다.

변경은 두 가지다.

1. 순수 함수 `pickFastestSubwayRoute(routes)`를 추가한다. 버스 Stop이 하나라도 있는 Route를 제외하고, 마지막 Stop의 `elapsedMin`이 가장 작은 Route 1개를 고른다. 동률이면 입력 배열에서 먼저 나온 Route를 고른다.
2. `recommend`는 이 함수가 고른 Route에서만 후보 역을 만들고, 응답의 `routes`에 그 Route 1개만 담는다. 고른 Route가 없으면 택시 추정기를 호출하지 않고 빈 응답을 돌려준다.

도착 시각 계산, 총비용 계산, 최소 비용 선택, 5분 버퍼, 출발역 지하철 요금 0원 규칙은 현재 구현을 그대로 유지한다. 택시 추정이 한 번이라도 실패하면 현재 `Promise.all` 동작대로 예외를 그대로 전파하고 부분 결과를 만들지 않는다.

### 설계 결정

| 결정 | 이유 |
| --- | --- |
| 경로 선택을 별도 순수 함수로 분리 | 외부 호출 없이 입력만으로 결과가 정해져 단위 테스트와 속성 테스트가 쉽다. |
| `recommend.ts` 안에서 `export` | 수정 범위가 `recommend.ts`, `recommend.test.ts`로 제한되어 있다. `index.ts`는 바꾸지 않으므로 외부 모듈에는 노출되지 않는다. 테스트는 `./recommend`에서 직접 import한다. |
| 정렬하지 않고 한 번 순회하며 "엄격히 더 작을 때만 교체" | 동률이면 먼저 나온 Route가 남는다. 정렬 구현의 안정성에 기대지 않는다. |
| `stops`가 빈 Route는 평가 대상에서 제외 | Route_Duration(마지막 Stop의 `elapsedMin`)이 정의되지 않고, 후보 역도 없다. requirements.md에 명시되지 않은 입력이므로 설계에서 정한다. |
| 택시 추정 실패는 잡지 않고 전파 | requirements 3.5. 현재 `Promise.all`이 첫 거부로 전체를 거부한다. 같은 방식을 유지한다. |
| 동률 처리는 기존 `sort` 유지 | `Array.prototype.sort`는 ES2019부터 안정 정렬이다. 비용, 도착 시각이 모두 같으면 `evaluated` 순서(= Stop 순서)가 유지되어 requirements 4.3을 만족한다. |

## Architecture

```mermaid
flowchart TD
    A[recommend 입력: routes, destination, departureAt, arrivalDeadline, estimateTaxi] --> B[pickFastestSubwayRoute]
    B -->|undefined| E[빈 응답: best=null, options=[], routes=[]]
    B -->|Selected_Route| C[subway Stop마다 후보 생성]
    C --> D[estimateTaxi 병렬 호출 Promise.all]
    D -->|하나라도 reject| F[예외 전파, 부분 결과 없음]
    D -->|모두 성공| G[Option 계산: 도착 시각, 총비용, onTime]
    G --> H[onTime 후보를 총비용, 도착 시각 순으로 안정 정렬]
    H --> I[응답: best, options, routes=Selected_Route 1개]
```

`recommender` 폴더는 `shared/types.ts`의 타입과 주입된 `TaxiEstimator`에만 의존한다. 다른 기능 폴더를 import하지 않는다.

## Components and Interfaces

### `pickFastestSubwayRoute` (신규, `recommend.ts`)

```ts
export function pickFastestSubwayRoute(routes: Route[]): Route | undefined;
```

동작:

1. `stops.length > 0`이고 모든 Stop의 `mode`가 `"subway"`인 Route만 남긴다.
2. 남은 Route를 입력 순서대로 순회하며, 마지막 Stop의 `elapsedMin`이 현재 최솟값보다 엄격히 작을 때만 선택 Route를 교체한다.
3. 남은 Route가 없으면 `undefined`를 돌려준다.

Route_Duration은 마지막 Stop의 `elapsedMin`이다. Stop 목록은 출발지부터의 누적 시간 순서로 오름차순이라고 가정한다(`shared/types.ts`의 `elapsedMin` 정의).

### `recommend` (수정, `recommend.ts`)

시그니처(`RecommendInput`, 반환 타입 `Promise<RecommendResponse>`)는 바뀌지 않는다.

```ts
const selected = pickFastestSubwayRoute(routes);
if (!selected) return { best: null, options: [], routes: [] };

const candidates = selected.stops
  .map((stop, index) => ({ stop, index }))
  .filter(({ stop }) => stop.mode === "subway");
// 이후 Option 계산은 기존 코드와 같다. route 대신 selected를 쓴다.
// 반환: { best, options, routes: [selected] }
```

- 후보 `index`는 `selected.stops` 안의 위치다. 지금처럼 `index === 0`이면 `subwayFare`를 0으로 한다.
- 선택 Route는 모든 Stop이 지하철이므로 `filter`는 사실상 통과시키지만, 방어적으로 남긴다.
- 선택 Route가 없으면 `estimateTaxi`를 호출하기 전에 반환한다(requirements 1.8).
- 버스 포함 Route와 선택되지 않은 Route는 `estimateTaxi`를 호출하지 않는다(requirements 1.9).

### 변하지 않는 것

`constants.ts`의 `TAXI_WAIT_BUFFER_MIN`, `index.ts`의 export, `shared/types.ts`의 타입은 그대로다.

## Data Models

새 타입은 없다. 기존 `Route`, `Stop`, `Option`, `RecommendResponse`를 그대로 쓴다.

응답 불변식:

| 경우 | `best` | `options` | `routes` |
| --- | --- | --- | --- |
| 지하철 전용 Route가 1개 이상, 제시간 후보 있음 | 최소 비용 Option | 선택 Route의 subway Stop마다 1개 | `[selected]` |
| 지하철 전용 Route가 1개 이상, 제시간 후보 없음 | `null` | 선택 Route의 subway Stop마다 1개 | `[selected]` |
| 지하철 전용 Route 없음 또는 `routes`가 빈 배열 | `null` | `[]` | `[]` |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**속성 통합 검토**

prework에서 PROPERTY로 분류한 항목을 다음과 같이 합쳤다.

- 1.1, 1.2, 1.3은 모두 `pickFastestSubwayRoute`의 선택 규칙이므로 하나의 오라클 비교 속성으로 합친다. 1.4, 1.5도 응답 구조이므로 하나로 합친다.
- 1.9와 2.5는 "선택 Route의 subway Stop마다 정확히 한 번 추정, 한 Option"이라는 같은 사실이라 하나로 합친다.
- 2.3과 2.4는 `onTime = (도착 <= 기한)` 하나로 합친다.
- 3.2와 3.3은 Stop 위치별 지하철 요금 규칙 하나로, 3.1과 3.4는 비용 필드 속성 하나로 합친다.
- 4.1, 4.2, 4.3은 단순 오라클과 `best`를 비교하는 하나의 속성으로 합친다. 4.5는 4.1에 포함되지 않는 "best는 options의 원소이며 onTime"이라는 별도 불변식이므로 따로 둔다.
- 1.6, 1.7, 1.8, 4.4, 3.5는 EDGE_CASE 또는 EXAMPLE이므로 속성이 아닌 단위 테스트로 다룬다.

### Property 1: 경로 선택은 가장 빠른 지하철 전용 Route를 입력 순서 우선으로 고른다

*For any* Route 배열(버스 Stop을 가진 Route, 지하철 전용 Route, 빈 `stops`를 가진 Route 혼합)에 대해, `pickFastestSubwayRoute`의 결과는 "`stops`가 비어 있지 않고 버스 Stop이 없는 Route만 모아 마지막 `elapsedMin`이 최소인 것 중 입력 인덱스가 가장 작은 Route"와 같다. 그런 Route가 없으면 결과는 `undefined`다.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: 응답은 선택 Route 1개만 담고 후보도 그 Route에서만 나온다

*For any* Route 배열과 입력에 대해, 지하철 전용 Route가 1개 이상이면 `response.routes`는 `pickFastestSubwayRoute` 결과 1개만 담고, 모든 `option.routeId`는 그 Route의 `id`와 같다. 지하철 전용 Route가 없으면 `routes`는 빈 배열이다.

**Validates: Requirements 1.4, 1.5**

### Property 3: 후보마다 택시 추정과 Option이 정확히 하나씩 대응한다

*For any* 입력에 대해, `options`의 길이와 `estimateTaxi` 호출 횟수는 선택 Route의 subway Stop 수와 같고, `options`의 `stopName` 순서는 선택 Route의 Stop 순서와 같으며, `estimateTaxi`의 `from`은 선택 Route의 Stop 좌표뿐이다. 선택되지 않은 Route의 Stop으로는 호출하지 않는다.

**Validates: Requirements 1.9, 2.5**

### Property 4: 도착 시각과 onTime 판정

*For any* 출발 시각, 희망 도착 시각, Stop의 `elapsedMin`, 택시 소요 시간에 대해, 각 Option의 `arrivalTime`은 출발 시각 + (`elapsedMin` + `TAXI_WAIT_BUFFER_MIN`)분 + 택시 소요 시간(초)이고, `onTime`은 `arrivalTime <= 희망 도착 시각`과 같다.

**Validates: Requirements 2.1, 2.3, 2.4**

### Property 5: 비용 계산

*For any* 입력에 대해, 각 Option의 `taxiFare`는 `estimateTaxi`가 돌려준 `fare`와 같고, `totalCost = subwayFare + taxiFare`이며, `subwayFare`는 선택 Route의 첫 Stop이면 0, 그 외에는 선택 Route의 `fare` 전체다.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 6: best는 제시간 후보의 최소 비용 옵션이다

*For any* 입력에 대해, `onTime` Option이 하나 이상이면 `best`는 `onTime` Option 중 `totalCost`가 최소이고, 동률이면 `arrivalTime`이 가장 이르고, 그것도 같으면 `options`에서 가장 앞에 있는 Option과 같다. `onTime` Option이 없으면 `best`는 `null`이다. 동률 입력을 자주 만들기 위해 제너레이터는 비용과 시간의 값 범위를 좁게 잡는다.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 7: best는 options의 제시간 원소다

*For any* 입력에 대해, `best`가 `null`이 아니면 `best`는 `options`에 포함되고 `best.onTime`은 `true`다.

**Validates: Requirements 4.5**

## Error Handling

| 상황 | 처리 |
| --- | --- |
| `routes`가 빈 배열 | 예외 없이 `{ best: null, options: [], routes: [] }`. `estimateTaxi` 호출 0회. |
| 모든 Route에 버스 Stop이 있음 | 위와 같다. |
| 일부 Route의 `stops`가 빈 배열 | 평가 대상에서 제외한다. |
| 제시간 후보 없음 | `best = null`, `options`는 모든 후보 유지. |
| `estimateTaxi`가 한 번이라도 reject | `Promise.all`이 첫 거부 사유로 `recommend`를 reject한다. 잡지 않고 부분 결과를 만들지 않는다. 이미 진행 중인 다른 추정 호출의 결과는 버려진다. |

호출부(`app/api/recommend/route.ts`)의 오류 응답 처리는 이 Spec의 범위가 아니다.

## Testing Strategy

### 접근

이 기능은 입력(Route 목록, 시각, 추정기 결과)에서 결과가 결정되는 순수한 계산이다. 외부 호출은 주입된 `TaxiEstimator`뿐이라 가짜 함수로 대체할 수 있다. 그래서 속성 기반 테스트(PBT)가 적합하다. 단위 테스트와 속성 테스트를 함께 쓴다.

### 단위 테스트 (`recommend.test.ts`에 추가, 기존 4개는 수정하지 않음)

| 테스트 | 근거 |
| --- | --- |
| 버스 Stop이 있는 Route와 지하철 전용 Route가 함께 입력되면 버스 Route를 `routes`와 `options`에서 제외한다 | requirements 5.1 |
| 지하철 전용 Route가 2개 이상이면 최소 Route_Duration인 Route만 `routes`에 담고 더 긴 Route는 없다 | requirements 5.2 |
| 동률 Route_Duration이면 입력 순서상 먼저 나온 Route를 고른다 | requirements 1.3 |
| 모든 Route가 버스 Stop을 포함하면 `best=null`, `options=[]`, `routes=[]`이고 `estimateTaxi`는 호출되지 않는다 | requirements 5.3, 1.8 |
| 빈 배열이면 위와 같다 | requirements 5.3, 1.7 |
| 추정기가 한 Stop에서 throw하면 `recommend`가 reject된다 | requirements 3.5 |
| 기존 4개 테스트가 그대로 통과한다 | requirements 5.4 |

### 속성 기반 테스트

- 라이브러리: `fast-check`. 직접 구현하지 않는다. 현재 `package.json`에 없으므로 "공통 파일 변경 요청"을 참고한다.
- 각 속성은 속성 테스트 1개로 구현하고, 반복 횟수는 100회 이상(`numRuns: 100` 이상)으로 설정한다.
- 각 테스트에 `Feature: transfer-station-recommender, Property {번호}: {속성 제목}` 형식의 주석을 단다.
- 속성 테스트는 같은 `recommend.test.ts`에 둔다. 파일을 따로 만들지 않는다.
- 제너레이터: Route(버스/지하철 Stop 혼합, 누적 `elapsedMin` 오름차순, `fare`는 0 이상 정수), 가짜 추정기(좌표별로 결정되는 `durationSec`, `fare`), 출발 시각, 희망 도착 시각(출발 시각 주변의 좁은 범위). 동률을 자주 만들기 위해 값 범위를 좁힌다.
- Property 6의 오라클은 `onTime` 필터 후 첫 번째 최솟값을 고르는 단순 구현이다.

### 검증 명령

`npm test`(vitest 단일 실행)와 `npm run build`가 통과해야 한다. 설치와 실행은 사람이 직접 한다.

## 생성/수정할 파일 목록

| 파일 | 작업 | 내용 |
| --- | --- | --- |
| `src/features/recommender/recommend.ts` | 수정 | `pickFastestSubwayRoute` 추가, 후보 생성을 Selected_Route로 제한, 응답 `routes`를 1개로 제한, 선택 Route 없으면 조기 반환 |
| `src/features/recommender/recommend.test.ts` | 수정 | 경로 선택 단위 테스트와 속성 테스트 추가. 기존 4개 테스트는 유지 |
| `.kiro/specs/transfer-station-recommender/design.md` | 생성 | 이 문서 |

`src/features/recommender/index.ts`, `constants.ts`, `src/shared/types.ts`는 변경하지 않는다.

## 공통 파일 변경 요청

구현하지 않으며, 담당자가 필요 시 처리한다.

| 대상 파일 | 변경 내용 | 이유 |
| --- | --- | --- |
| `package.json` | `devDependencies`에 `fast-check` 추가(`npm install -D fast-check`, 사람이 직접 실행) | 속성 기반 테스트에 필요하다. 추가하지 않으면 속성 테스트는 건너뛰고 단위 테스트만 구현한다. |
| `src/features/result/ResultView.tsx` | `best`가 `null`이면 `options` 중 도착이 가장 빠른 옵션을 대안으로 표시 | domain-rules.md의 "제시간 도착 후보가 없으면 가장 빨리 도착하는 후보를 대안으로 보여 준다"를 충족하기 위해서다. |
| `src/features/taxi/service.ts` | 후보 역마다 호출되는 추정기에 동시 호출 수 제한과 중복 요청 제거 적용 | 외부 API 연동 시 호출 한도를 넘지 않게 하기 위해서다. |
