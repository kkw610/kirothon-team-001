# Implementation Plan: 환승역 추천기 경로 선택

## Overview

`recommend`가 모든 Route의 지하철 정류장을 합쳐 후보로 삼는 현재 동작을, "버스 없는 지하철 Route 중 가장 빠른 1개만 평가"하도록 바꾼다. 구현은 순수 함수 `pickFastestSubwayRoute` 추가, `recommend` 연결, 테스트 추가 순서로 진행한다. 언어는 TypeScript(vitest)다.

수정 범위는 `src/features/recommender/recommend.ts`와 `src/features/recommender/recommend.test.ts` 두 파일뿐이다. `index.ts`, `constants.ts`, `shared/types.ts`는 바꾸지 않는다. 기존 테스트 4개의 코드와 단언은 수정하지 않는다. 각 작업은 30분 이내로 끝나는 크기다.

## Tasks

- [x] 1. 경로 선택 구현 (`recommend.ts`)
  - [x] 1.1 `pickFastestSubwayRoute` 함수 추가
    - `recommend.ts`에 `export function pickFastestSubwayRoute(routes: Route[]): Route | undefined`를 추가한다.
    - `stops`가 비어 있지 않고 모든 Stop의 `mode`가 `"subway"`인 Route만 대상으로 한다.
    - 입력 순서대로 한 번 순회하며, 마지막 Stop의 `elapsedMin`이 현재 최솟값보다 엄격히 작을 때만 교체한다(정렬 사용 안 함). 대상이 없으면 `undefined`를 돌려준다.
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 `recommend`가 선택 Route만 평가하도록 수정
    - `recommend` 시작에서 `pickFastestSubwayRoute(routes)`를 호출한다. 결과가 없으면 `estimateTaxi`를 호출하지 않고 `{ best: null, options: [], routes: [] }`를 반환한다.
    - 후보 Stop을 `flatMap` 대신 선택 Route의 `stops`에서만 만든다. `subwayFare`의 index 0 규칙과 `route.fare` 참조는 선택 Route 기준으로 유지한다.
    - 반환값의 `routes`를 `[selected]`로 바꾼다. 도착 시각, 비용, 정렬 로직은 바꾸지 않는다.
    - 기존 테스트 4개가 그대로 통과하는지 확인한다(실행은 사람이 한다).
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.5, 3.5, 5.4_

- [x] 2. 경로 선택 단위 테스트 (`recommend.test.ts`)
  - [x] 2.1 경로 선택 단위 테스트 추가
    - 버스 Stop이 있는 Route와 지하철 전용 Route를 함께 넣으면 버스 Route가 `routes`와 `options`에서 빠지는지 단언한다.
    - 지하철 전용 Route 2개 이상에서 Route_Duration이 최소인 Route만 `routes`에 있고, 더 긴 Route가 없음을 단언한다.
    - Route_Duration이 같으면 입력 순서상 먼저 나온 Route가 선택됨을 단언한다.
    - 기존 4개 테스트는 건드리지 않고 새 `it`만 추가한다.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2_

  - [x] 2.2 빈 입력과 오류 전파 단위 테스트 추가
    - 모든 Route가 버스 Stop을 포함하는 경우와 빈 배열인 경우 각각 `best=null`, `options=[]`, `routes=[]`를 단언하고 예외가 없음을 확인한다.
    - 두 경우 모두 `estimateTaxi` 가짜 함수가 0회 호출됨을 단언한다.
    - `estimateTaxi`가 한 Stop에서 throw하면 `recommend`가 reject되는지 단언한다.
    - _Requirements: 1.6, 1.7, 1.8, 3.5, 5.3_

- [~] 3. 체크포인트 - 단위 테스트 통과 확인
  - 사람이 `npm test`를 실행해 기존 4개와 새 단위 테스트가 모두 통과하는지 확인한다. 질문이 있으면 사용자에게 묻는다.

- [ ] 4. 속성 기반 테스트 (선택, `fast-check` 설치 후에만 진행)
  - 현재 `package.json`에 `fast-check`가 없다. 설치 전에 `fast-check`를 import하면 `recommend.test.ts` 전체가 실패하므로, 설치되지 않았다면 이 묶음 전체를 건너뛴다.
  - [ ]* 4.1 속성 테스트 공통 제너레이터와 Property 1 작성
    - 파일 상단에 `fast-check` import와 제너레이터(버스/지하철 혼합 Route, 누적 `elapsedMin` 오름차순, `fare`는 0 이상 정수, 값 범위를 좁게 한 가짜 추정기, 출발·희망 도착 시각)를 추가한다.
    - `fc.assert` 반복 횟수는 `numRuns: 100` 이상으로 한다. 각 테스트에 `Feature: transfer-station-recommender, Property {번호}: {제목}` 주석을 단다.
    - **Property 1: 경로 선택은 가장 빠른 지하철 전용 Route를 입력 순서 우선으로 고른다**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]* 4.2 Property 2 속성 테스트 작성
    - **Property 2: 응답은 선택 Route 1개만 담고 후보도 그 Route에서만 나온다**
    - **Validates: Requirements 1.4, 1.5**

  - [ ]* 4.3 Property 3 속성 테스트 작성
    - **Property 3: 후보마다 택시 추정과 Option이 정확히 하나씩 대응한다**
    - **Validates: Requirements 1.9, 2.5**

  - [ ]* 4.4 Property 4 속성 테스트 작성
    - **Property 4: 도착 시각과 onTime 판정**
    - **Validates: Requirements 2.1, 2.3, 2.4**

  - [ ]* 4.5 Property 5 속성 테스트 작성
    - **Property 5: 비용 계산**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [ ]* 4.6 Property 6 속성 테스트 작성
    - 동률이 자주 생기도록 비용과 시간 범위를 좁게 잡고, 오라클은 `onTime` 필터 후 첫 번째 최솟값을 고르는 단순 구현으로 한다.
    - **Property 6: best는 제시간 후보의 최소 비용 옵션이다**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 4.7 Property 7 속성 테스트 작성
    - **Property 7: best는 options의 제시간 원소다**
    - **Validates: Requirements 4.5**

- [~] 5. 최종 체크포인트 - `npm test`와 `npm run build` 통과 확인
  - 사람이 `npm test`(vitest 단일 실행)와 `npm run build`를 실행해 둘 다 통과하는지 확인한다. 질문이 있으면 사용자에게 묻는다.

## Notes

- `*` 표시 작업은 선택이며, 건너뛰어도 Requirement 1~5는 단위 테스트로 충족된다.
- 설치, git, 빌드 명령은 사람이 직접 실행한다.
- 사람이 직접 실행할 메모(작업 아님, 폴더 밖 변경):
  - `package.json`: 속성 테스트를 하려면 `npm install -D fast-check`를 실행한다. 설치하지 않으면 작업 4는 건너뛴다.
  - `src/features/result/ResultView.tsx`: `best`가 `null`일 때 `options` 중 도착이 가장 빠른 옵션을 대안으로 표시하는 변경은 담당자가 처리한다.
  - `src/features/taxi/service.ts`: 후보 역마다 호출되는 추정기에 동시 호출 수 제한과 중복 요청 제거를 적용하는 변경은 담당자가 처리한다.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2"] },
    { "id": 6, "tasks": ["4.3"] },
    { "id": 7, "tasks": ["4.4"] },
    { "id": 8, "tasks": ["4.5"] },
    { "id": 9, "tasks": ["4.6"] },
    { "id": 10, "tasks": ["4.7"] }
  ]
}
```
