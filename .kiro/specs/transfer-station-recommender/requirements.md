# Requirements Document

## Introduction

환승역 추천기(Recommender)는 지하철 경로가 지나는 역 중 택시로 갈아탈 역을 골라, 희망 시각까지 도착하면서 총비용이 가장 낮은 옵션을 추천한다. 담당 범위는 `src/features/recommender/`이다.

`recommend.ts`와 `recommend.test.ts`에는 다음 동작이 이미 구현되어 있다. 이번 Spec은 이 동작을 유지하고, 빠진 동작인 "경로 선택"(Requirement 1)만 새로 구현한다.

- 후보 역별 도착 시각 계산(출발 + 지하철 시간 + 5분 버퍼 + 택시 시간)
- 총비용 = 지하철 요금 + 택시 요금
- 제시간 후보 중 최소 총비용 선택(동률이면 도착이 빠른 쪽)
- 출발역에서 바로 택시를 타면 지하철 요금 0원
- 제시간 후보가 없으면 best = null

Requirement 2부터 4는 이미 구현된 동작을 회귀 방지용으로 명세한 것이다.

## Glossary

- **Recommender**: `recommend` 함수를 제공하는 `src/features/recommender/`의 추천 모듈.
- **Route**: `shared/types.ts`의 경로. 요금(`fare`)과 정류장 목록(`stops`)을 가진다.
- **Stop**: Route의 정류장. 출발지부터의 누적 소요시간(`elapsedMin`)과 교통수단(`mode`)을 가진다.
- **Subway_Only_Route**: 모든 Stop의 `mode`가 `subway`인 Route.
- **Route_Duration**: Route의 마지막 Stop의 `elapsedMin` 값(분).
- **Selected_Route**: 입력 routes 중 Recommender가 평가 대상으로 고른 Subway_Only_Route 1개.
- **Candidate_Stop**: Selected_Route 안에서 `mode`가 `subway`인 Stop. 택시 환승 후보 역이다.
- **Taxi_Estimator**: Candidate_Stop에서 목적지까지의 택시 거리, 시간, 요금을 돌려주는 주입 함수(`TaxiEstimator`).
- **Taxi_Wait_Buffer**: 택시 탑승 전 고정 대기 시간 5분(`TAXI_WAIT_BUFFER_MIN`).
- **Arrival_Time**: 출발 시각 + Candidate_Stop까지의 지하철 시간 + Taxi_Wait_Buffer + 택시 소요 시간.
- **Arrival_Deadline**: 사용자가 입력한 희망 도착 시각.
- **On_Time_Option**: Arrival_Time이 Arrival_Deadline 이하인 Option.
- **Total_Cost**: Candidate_Stop까지의 지하철 요금과 택시 요금의 합(원).
- **Recommend_Response**: `best`, `options`, `routes`를 가진 `RecommendResponse`.

## Requirements

### Requirement 1: 최소시간 지하철 경로 1개 선택

**User Story:** As a 사용자, I want 버스가 없는 지하철 경로 중 가장 빠른 1개만 평가되기를, so that 지하철 단일 경로 기준의 환승역 추천을 받을 수 있다.

#### Acceptance Criteria

1. WHEN routes가 입력되면, THE Recommender SHALL 버스 Stop을 하나도 갖지 않는 Route만 Subway_Only_Route로 분류하여 평가 대상으로 삼고, 버스 Stop을 1개 이상 가진 Route는 평가 대상에서 제외한다.
2. WHEN 평가 대상 Subway_Only_Route가 1개 이상이면, THE Recommender SHALL Route_Duration(분 단위)이 가장 작은 Route 1개를 Selected_Route로 고른다.
3. IF Route_Duration이 가장 작은 Subway_Only_Route가 2개 이상이면, THEN THE Recommender SHALL 입력 배열에서 인덱스가 가장 작은 Route를 Selected_Route로 고른다.
4. THE Recommender SHALL Candidate_Stop을 Selected_Route에 포함된 Stop에서만 가져오며, 평가에서 제외되었거나 선택되지 않은 Route의 Stop은 Candidate_Stop에 포함하지 않는다.
5. WHEN Selected_Route가 정해지면, THE Recommender SHALL Recommend_Response의 routes에 Selected_Route만 정확히 1개 담는다.
6. IF 입력 routes에 Subway_Only_Route가 0개이면, THEN THE Recommender SHALL best를 null, options를 길이 0인 배열, routes를 길이 0인 배열로 하는 Recommend_Response를 오류 없이 돌려준다.
7. IF 입력 routes가 길이 0인 빈 배열이면, THEN THE Recommender SHALL best를 null, options를 길이 0인 배열, routes를 길이 0인 배열로 하는 Recommend_Response를 오류 없이 돌려준다.
8. IF Selected_Route가 없으면, THEN THE Recommender SHALL Taxi_Estimator를 0회 호출한다.
9. WHEN Selected_Route가 정해지면, THE Recommender SHALL 버스 Stop을 1개 이상 가진 Route에 대해 Taxi_Estimator를 0회 호출한다.

### Requirement 2: 후보 역별 도착 시각 계산 (구현됨)

**User Story:** As a 사용자, I want 후보 역마다 도착 시각이 계산되기를, so that 희망 시각에 맞는 역을 알 수 있다.

#### Acceptance Criteria

1. WHEN Candidate_Stop이 평가되면, THE Recommender SHALL Arrival_Time을 출발 시각, 해당 Stop의 `elapsedMin`(분 단위, 0 이상의 정수), Taxi_Wait_Buffer(분), 택시 소요 시간(분)의 합으로 계산한다.
2. THE Recommender SHALL Taxi_Wait_Buffer를 상수 `TAXI_WAIT_BUFFER_MIN` 하나로 참조한다.
3. WHEN Arrival_Time이 Arrival_Deadline 이하이면, THE Recommender SHALL 해당 Option의 `onTime`을 true로 설정한다.
4. WHEN Arrival_Time이 Arrival_Deadline보다 늦으면, THE Recommender SHALL 해당 Option의 `onTime`을 false로 설정한다.
5. THE Recommender SHALL Selected_Route의 Candidate_Stop마다 Option을 정확히 1개씩 `options`에 담는다. 단, Requirement 3.6에 따라 택시 경로가 없는 Candidate_Stop은 뺀다.
6. WHEN Taxi_Estimator를 호출하면, THE Recommender SHALL 택시 탑승 시각(출발 시각 + `elapsedMin` + Taxi_Wait_Buffer)을 `boardingAt`으로 넘긴다. taxi 기능은 이 값으로 교통 예측과 심야 할증을 정한다. (2026-11-14 개정, taxi 연동)

### Requirement 3: 총비용 계산 (구현됨)

**User Story:** As a 사용자, I want 총비용이 정확히 계산되기를, so that 가장 저렴한 환승역을 고를 수 있다.

#### Acceptance Criteria

1. THE Recommender SHALL 각 Option의 Total_Cost를 `subwayFare`와 `taxiFare`의 합으로 계산하며, 모든 금액은 원 단위 정수로 처리한다.
2. WHEN Candidate_Stop에 `fare`(역별 지하철 요금)가 있으면, THE Recommender SHALL `subwayFare`를 그 값으로 설정한다. (2026-11-14 개정, transit 연동)
3. WHEN Candidate_Stop에 `fare`가 없으면, THE Recommender SHALL 첫 번째 Stop(index 0)은 `subwayFare`를 0원으로, 그 밖의 Stop은 Selected_Route의 `fare` 전체 금액으로 설정한다.
4. WHEN Taxi_Estimator가 결과를 돌려주면, THE Recommender SHALL `taxiFare`를 Taxi_Estimator가 돌려준 `fare` 값 그대로(반올림이나 가산 없이) 설정한다.
5. IF Taxi_Estimator 호출이 `code`가 `"NO_ROUTE"`가 아닌 오류로 실패하면, THEN THE Recommender SHALL 해당 요청의 추천 계산을 실패로 종료하고 어떤 Option도 부분 결과로 반환하지 않는다.
6. IF Taxi_Estimator 호출이 `code`가 `"NO_ROUTE"`인 오류로 실패하면, THEN THE Recommender SHALL 그 Candidate_Stop만 `options`에서 빼고 나머지 후보로 계속 계산한다. (2026-11-14 개정, handoff.md 5. 오류 권장)

### Requirement 4: 최소 총비용 역 추천 (구현됨)

**User Story:** As a 사용자, I want 제시간 도착 후보 중 가장 저렴한 역이 추천되기를, so that 늦지 않으면서 비용을 아낄 수 있다.

#### Acceptance Criteria

1. WHEN 평가 결과에 On_Time_Option이 1개 이상 존재하면, THE Recommender SHALL Total_Cost(원 단위 정수)가 가장 낮은 On_Time_Option을 `best`로 설정한다.
2. IF 가장 낮은 Total_Cost를 가진 On_Time_Option이 2개 이상이면, THEN THE Recommender SHALL 그중 Arrival_Time이 가장 이른 Option을 `best`로 설정한다.
3. IF 가장 낮은 Total_Cost와 가장 이른 Arrival_Time이 모두 같은 On_Time_Option이 2개 이상이면, THEN THE Recommender SHALL 평가 순서(입력 후보 목록에서의 순서)상 먼저 나온 Option을 `best`로 설정한다.
4. IF 평가 결과에 On_Time_Option이 0개이면, THEN THE Recommender SHALL `best`를 null로 설정하고, `options`에 평가한 모든 Option을 유지하며(Requirement 3.6으로 빠진 후보 제외), 오류 없이 결과를 반환한다.
5. WHEN `best`가 설정되면, THE Recommender SHALL `best`가 `options`에 포함된 Option 중 하나이며 Arrival_Time이 도착 기한 이내인 Option이 되도록 보장한다.

### Requirement 5: 경로 선택 테스트

**User Story:** As a 개발자, I want 경로 선택 동작이 단위 테스트로 검증되기를, so that 이후 변경에서도 회귀를 막을 수 있다.

#### Acceptance Criteria

1. WHEN `recommend()`에 `mode`가 "bus"인 Stop을 1개 이상 포함한 Route와 `mode`가 "subway"인 Stop만 포함한 Route가 함께 입력되면, THE Recommender SHALL 버스 Stop이 포함된 Route를 `routes`와 `options`에서 제외하며, `recommend.test.ts`에 이 동작을 단언하는 테스트가 1개 이상 존재하고 통과한다.
2. WHEN `recommend()`에 Route_Duration이 서로 다른 사용 가능한 Route가 2개 이상 입력되면, THE Recommender SHALL 최소 Route_Duration의 Route만 `routes`에 담으며, `recommend.test.ts`에 이 동작을 단언하는 테스트가 1개 이상 존재하고 통과한다. 이 테스트는 최소 Route_Duration보다 긴 Route가 `routes`에 없음을 단언한다.
3. IF `recommend()`에 입력된 모든 Route가 버스 Stop을 포함하거나 입력 `routes`가 빈 배열이면, THEN THE Recommender SHALL `best`=null, `options`=[], `routes`=[]를 반환하며 예외를 던지지 않는다. `recommend.test.ts`에는 이 두 입력 경우(전부 버스 포함, 빈 배열) 각각에 대해 세 값을 모두 단언하는 테스트가 존재하고 통과한다.
4. WHEN `npm test`(vitest 단일 실행)가 실행되면, THE Recommender SHALL `recommend.test.ts`에 이미 존재하는 4개 테스트(제시간 후보 중 최저 총비용 선택, 출발 정류장 지하철 요금 0원, 제시간 도착 불가 시 `best`=null, 도착 시각이 희망 시각과 같으면 제시간)를 해당 테스트의 코드와 단언을 수정하지 않은 채 모두 통과시키며, 실패 또는 건너뜀 0건이다.
## 생성/수정할 파일 목록

| 파일 | 작업 | 내용 |
| --- | --- | --- |
| `src/features/recommender/recommend.ts` | 수정 | Selected_Route 선택 로직 추가, 응답 `routes`를 1개로 제한 |
| `src/features/recommender/recommend.test.ts` | 수정 | Requirement 1에 대한 테스트 추가 (기존 테스트는 유지) |
| `.kiro/specs/transfer-station-recommender/` | 생성 | 이 Spec 문서 |

`src/features/recommender/index.ts`, `constants.ts`, `shared/types.ts`는 변경하지 않는다.

## API 연동 반영 (2026-11-14, `feat/api` handoff)

transit·taxi 연동 후 다음을 반영했다. 근거는 `.kiro/specs/subway-taxi-api/handoff.md`다.

| 파일 | 변경 |
| --- | --- |
| `src/features/recommender/recommend.ts` | Requirement 2.6(`boardingAt` 전달), 3.2~3.3(역별 요금 우선) |
| `src/features/recommender/recommend.ts` | Requirement 3.5~3.6(택시 `NO_ROUTE` 역만 후보에서 제외) |
| `src/features/recommender/recommend.test.ts` | Requirement 3.5~3.6 테스트 2개 추가 |

`app/api/recommend/route.ts`의 `departureAt` 전달과 오류 코드별 응답(404/502/500, `app/api/recommend/errors.ts`), `recommend.test.ts`의 `from.name` 타입 오류 수정은 develop(PR #6, #7)에 이미 반영되어 있어 그대로 쓴다. 경로는 기본값 1개만 받는다(Requirement 1에 따라 1개만 평가하므로 차이 없음).

## 공통 파일 변경 요청

구현하지 않으며, 담당자가 필요 시 처리한다.

| 대상 파일 | 이유 |
| --- | --- |
| `src/features/result/ResultView.tsx` | `best`가 null일 때 `options` 중 도착이 가장 빠른 옵션을 대안으로 표시해야 한다. domain-rules.md의 "제시간 도착 후보가 없으면 가장 빨리 도착하는 후보를 대안으로 보여 준다"를 충족하기 위해서다. |
| `src/features/taxi/service.ts` | 후보 역마다 Taxi_Estimator를 호출하므로 동시 호출 수 제한과 중복 요청 제거가 필요하다. 외부 API 연동 시 호출 한도를 넘지 않게 하기 위해서다. |
