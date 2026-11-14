# 인계 문서: 지하철·택시 데이터 계약 (API 파트 → 추천 로직 파트)

이 문서는 `transit`(지하철)과 `taxi`(택시) 기능이 추천 로직(`recommender`)에 **무엇을, 어떤 단위로, 어떻게 계산해서** 넘기는지 정한다. 코드와 다르면 이 문서를 기준으로 코드를 고친다. 타입 정의는 `src/shared/types.ts`에 있다.

- 담당: API 파트(`feat/api`). 받는 쪽: 추천 로직 파트(`src/features/recommender`, `app/api/recommend/route.ts`)
- 검증: 2026-11-14 실제 키로 확인했다. TMAP(신촌역 → 코엑스 16:01, 다음 날 01:30), 전체 흐름(강남역 → 서울역: TMAP → recommend → 카카오).
- 개정 2 (2026-11-14): 지하철 API를 TMAP 대중교통으로 교체. 출발 시각 기준 경로, 대체 경로 옵션, 1~9호선 제한 추가.
- 개정 5 (2026-11-14): 버스 섞인 경로는 1~9호선 앞부분을 목적지에 가장 가까운 역에서 잘라 쓴다(2절). 지하철+도보와 택시를 비교하는 데 쓸 값을 4절에 정리했다.
- 개정 4 (2026-11-14): 도보 구간(`walkFromOrigin`, `walkToDestination`) 추가. 택시 없이 지하철+도보로 가는 기준 옵션을 만들 수 있다(4절).
- 개정 3 (2026-11-14): TMAP 실측 반영. 출발 시각은 운행 여부로만 반영된다(2절, 7절).

## 1. 제공 함수

| 함수 | import | 호출 횟수 | 외부 API |
|---|---|---|---|
| `getTransitRoutes(origin, destination, departureAt?, { maxRoutes? })` → `Promise<Route[]>` | `@/features/transit` | 추천 요청당 1회 | TMAP 대중교통 `transit/routes` |
| `estimateTaxi(from, to, boardingAt?)` → `Promise<TaxiEstimate>` | `@/features/taxi` | 후보 역마다 1회 | 카카오모빌리티 길찾기 (실시간 또는 미래) |

- `origin`, `destination`, `from`, `to`는 `{ x: 경도, y: 위도 }`다.
- `departureAt`은 지하철 출발 시각(`Date`)이고, 생략하면 호출 시점이다. 이 시각에 운행하지 않는 노선(첫차 전, 막차 후)이 있는 경로는 빠진다.
- `maxRoutes`는 1~3이고 기본값은 1이다. 2 이상이면 `routes[0]`(추천 경로) 뒤에 대체 경로가 붙는다.
- `boardingAt`은 택시 탑승 시각(`Date`)이고, 생략하면 호출 시점이다.

## 2. 지하철: `Route`

- `routes[0]`이 추천 경로다. TMAP이 추천한 순서에서 조건에 맞는 첫 경로를 고른다.
- 후보 만들기 (개정 5)
  - 경로 전체가 도보와 **수도권 1~9호선(급행 포함)**이면 그대로 쓴다(완전 경로). 도착 도보는 TMAP 실제 값이다.
  - 버스, 신분당선, 수인분당선 등이 섞이면 **앞에서부터 이어지는 1~9호선 구간만** 쓰고, 그 안에서 **목적지에 가장 가까운 역**에서 끊는다(`truncated: true`). 그 역에서 목적지까지 도보는 직선거리 × 1.3, 분당 67m로 추정한다(`walkToDestination.estimated: true`).
  - 버스로 시작하는 경로처럼 앞부분에 지하철이 없으면 버린다. 앞부분 지하철이 출발 시각에 운행하지 않으면(첫차 전, 막차 후) 버린다.
- 정렬: 택시 없이 목적지까지 걸리는 시간(`totalMin`)이 짧은 순. 같은 역 순서는 하나만 남긴다.
- 대체 경로: 개정 5부터 버스 섞인 경로도 잘라서 후보가 된다. 실측 신촌역 → 코엑스는 완전 경로 1개(44.4분)와 자른 경로 4개(88.6분~)였다.
- `domain-rules.md`가 "경로 1개"이므로 기본값은 1개다. `develop`의 `recommend()`는 받은 경로 중 가장 빠른 지하철 경로 1개(`pickFastestSubwayRoute`)만 평가하므로, `maxRoutes: 3`을 넘겨도 택시 호출 수는 늘지 않는다.

| 필드 | 단위 | 출처 / 계산 | 정확도 |
|---|---|---|---|
| `id` | - | `"tmap-0"`, `"tmap-1"`, ... (0이 추천) | - |
| `fare` | 원 | 완전 경로: TMAP `fare.regular.totalFare`. 자른 경로: 끊은 역까지 거리비례 운임 | 실제 값 / 추정 |
| `totalMin` | 분 | TMAP `totalTime`(초) ÷ 60. **택시 없이** 지하철과 도보로 목적지까지 가는 시간 | 실제 값 |
| `transferCount` | 회 | 지하철 구간 수 − 1 | 실제 값 |
| `timeAware` | - | 출발 시각 기준으로 찾은 경로인지. TMAP은 `true` | - |
| `departureTime` | ISO 8601 | 검색 기준 출발 시각 | - |
| `stops` | - | 지나는 역 순서대로. 첫 역이 탑승역, 마지막 역이 하차역 | 아래 표 |
| `walkFromOrigin` | `{ distanceM, minutes }` | 출발지 → 첫 역 도보. TMAP 첫 `WALK` 구간. `elapsedMin`에 이미 포함 | 실제 값 |
| `walkToDestination` | `{ distanceM, minutes, estimated? }` | 마지막 역 → 목적지 도보. 완전 경로는 TMAP 마지막 `WALK` 구간, 자른 경로는 직선거리 추정(`estimated: true`). `totalMin`에 포함 | 완전 경로 실제 값 / 자른 경로 추정 |
| `truncated` | - | `true`면 버스·다른 노선 앞에서 자른 경로 | - |

### `Stop` (역 하나)

| 필드 | 단위 | 출처 / 계산 | 정확도 |
|---|---|---|---|
| `name` | - | TMAP `passStopList.stationList[].stationName` | 실제 값 |
| `x`, `y` | 경도, 위도 | TMAP `lon`, `lat`. 택시 출발점으로 쓴다 | 실제 값 |
| `mode` | - | 항상 `"subway"` | - |
| `line` | - | TMAP `leg.route` (예: `"수도권2호선"`). 환승역은 먼저 탄 노선 | 실제 값 |
| `elapsedMin` | 분(소수 1자리) | 출발지부터 이 역 도착까지. 아래 계산 A | 추정 |
| `distanceM` | m | 탑승역부터 이 역까지 지하철 누적 거리. 아래 계산 A | 추정 |
| `fare` | 원 | 이 역에서 내릴 때 지하철 요금. 아래 계산 B. **탑승역은 0** | 추정(대부분 실제와 같음) |

**계산 A: 역별 시간과 거리.** TMAP은 구간(같은 노선을 타는 묶음)별 시간(`sectionTime`, 초)과 거리(`distance`, m)만 준다.
1. 구간 안에서 역 사이 직선거리 비율을 구한다.
2. 그 비율로 구간 시간과 구간 거리를 나눠 역마다 배정한다.
3. 앞 구간과 도보(출발지→역, 환승 도보) 시간을 누적한다.
4. 환승역은 두 구간에 모두 나오므로 먼저 나온 것 하나만 남긴다.

**계산 B: 역별 지하철 요금.** 수도권 거리비례 운임(성인 카드)을 쓴다. 기본 1,550원(10km까지), 50km까지 5km마다 100원, 그 뒤 8km마다 100원을 더한다. 결과가 `Route.fare`를 넘지 않게 자르고, 마지막 역은 `Route.fare`와 같게 맞춘다. 출처: [서울시 지하철 요금](https://world.seoul.go.kr/policy/transportation/modes-of-transport/subway/)

계산 A와 B는 API와 무관한 `transit/build-route.ts`에 있다.

실측 예 (TMAP, 신촌역 → 코엑스, 2026-11-14 16:01, 2호선 → 당산 환승 → 9호선 급행):
```json
{ "id": "tmap-0", "fare": 1750, "totalMin": 44.4, "transferCount": 1, "timeAware": true,
  "departureTime": "2026-11-14T07:01:00.000Z", "stops": [
  { "name": "신촌", "line": "수도권2호선", "elapsedMin": 2.2, "distanceM": 0, "fare": 0 },
  { "name": "당산", "line": "수도권2호선", "elapsedMin": 10.2, "distanceM": 4471, "fare": 1550 },
  { "name": "동작", "line": "수도권9호선(급행)", "elapsedMin": 24.6, "distanceM": 12394, "fare": 1650 },
  { "name": "봉은사", "line": "수도권9호선(급행)", "elapsedMin": 36.2, "distanceM": 20265, "fare": 1750 }
] }
```
(`x`, `y`, `mode`는 생략, 중간 역 일부와 일부 필드 생략. 전체는 `transit/__fixtures__/`의 실제 응답과 `tmap.test.ts` 참고)

같은 구간을 01:30에 찾으면 2호선·9호선이 운행하지 않아 `TransitError("NO_ROUTE", "출발 시각에 운행하는 지하철 경로가 없습니다...")`가 난다.

## 3. 택시: `TaxiEstimate`

| 필드 | 단위 | 출처 / 계산 | 정확도 |
|---|---|---|---|
| `distanceM` | m | 카카오 `summary.distance` | 실제 값 |
| `durationSec` | 초 | 카카오 `summary.duration`. 교통 기준은 `trafficBasis` | 실제 예측 값 |
| `trafficBasis` | - | `"realtime"`: 호출 시점 교통, `"predicted"`: 탑승 시각의 교통 예측 | - |
| `slowSec` | 초 | 도로 구간 중 시속 15.72km 미만으로 달린 시간의 합 | 추정 |
| `surchargeRate` | - | 탑승 시각의 심야 할증률: 0, 0.2, 0.4 | 규칙 |
| `fare` | 원 | 서울시 중형택시 미터 요금 계산. 아래 계산 C | 추정 |

**교통 기준 선택.** `boardingAt`이 지금부터 5분 이내면 실시간 길찾기(`/v1/directions`)를 쓴다. 5분보다 뒤면 미래 길찾기(`/v1/future/directions`)를 쓰고, `departure_time`은 탑승 시각을 5분 단위로 올림한 값이다.

**계산 C: 택시 요금.** 카카오가 주는 요금 값은 쓰지 않는다(`domain-rules.md`).
```
미터거리 = distanceM + slowSec × 131 / 30        (저속 30초 = 131m, 동시병산)
요금     = 기본요금 + ceil((미터거리 − 1600) / 131) × 단위요금   (10원 단위 반올림)
```
| 탑승 시각 (Asia/Seoul) | 기본요금 | 단위요금 |
|---|---|---|
| 04:00~21:59 | 4,800원 | 100원 |
| 22:00~22:59, 02:00~03:59 | 5,800원 | 120원 |
| 23:00~01:59 | 6,700원 | 140원 |

출처: [서울시 택시 요금](https://english.seoul.go.kr/policy/transportation/modes-of-transport/taxi/)

실측 예 (신촌역 → 코엑스):
| `boardingAt` | 교통 기준 | 거리 | 시간 | 요금 |
|---|---|---|---|---|
| 지금(토 16시대) | realtime | 17,619m | 63분 | 23,600원 |
| 40분 뒤 | predicted | 17,524m | 58분 | 22,500원 |
| 오늘 23:30 | predicted | 20,271m | 27분 | 27,280원(40% 할증) |
| 내일 08:30 | predicted | 15,491m | 30분 | 15,500원 |

## 4. 추천 로직이 쓸 값과 바꿀 곳

### 지하철+도보와 택시 비교에 쓰는 값 (개정 5)
API 파트는 경로를 **1~9호선 지하철 + 마지막 역에서 목적지까지 도보**로 만들어 준다. 비교 로직은 추천 로직 파트가 구현한다.

| 비교 대상 | 도착 시각 | 비용 |
|---|---|---|
| 지하철 + 도보(택시 없음) | 출발 + `route.totalMin` | 마지막 역 `stop.fare` (= `route.fare`) |
| 역 X에서 택시 | 출발 + `X.elapsedMin` + 5분 + `taxi.durationSec` | `X.fare` + `taxi.fare` |

- 도보 거리·시간은 `route.walkToDestination`. `estimated: true`면 직선거리 추정(자른 경로)이다.
- 실측 신촌역 → 코엑스: 완전 경로 `totalMin` 44.4분, `fare` 1,750원, 도착 도보 551m 8.2분(TMAP 실제 값).
- 기본 `maxRoutes: 1`이면 `routes[0]`은 `totalMin`이 가장 짧은 경로다. 여러 경로를 받아 직접 고른다면 마지막 역 `elapsedMin`이 아니라 `totalMin`으로 비교해야 한다(자른 경로는 마지막 역 도착이 빨라도 걷는 시간이 길다).

### 그 밖에 바꿀 곳

```ts
// (1) 택시 탑승 시각을 넘겨 그 시각의 교통 예측과 심야 할증을 반영한다
const boardingAt = new Date(
  departureAt.getTime() + (stop.elapsedMin + TAXI_WAIT_BUFFER_MIN) * MIN_MS,
);
const taxi = await estimateTaxi(stop, destination, boardingAt);

// (2) 역별 지하철 요금을 쓴다 (없으면 기존 방식)
const subwayFare = stop.fare ?? (index === 0 ? 0 : route.fare);
```

도착 시각과 총비용 공식은 `domain-rules.md` 그대로다.

## 5. 오류

| 오류 | `code` | 의미 | 사용자 안내 (권장) |
|---|---|---|---|
| `TransitError` | `NO_ROUTE` | 1~9호선 지하철 경로 없음, 출발 시각에 운행 안 함, 출발지와 도착지가 너무 가까움, 정류장 없음 | 404, `message`를 그대로 보여 줘도 된다 |
| `TransitError` | `UPSTREAM` | TMAP 장애, 타임아웃(5초), 키 인증 실패, 호출 한도 초과 | 502 "일시적인 오류입니다" |
| `TaxiError` | `NO_ROUTE` | 해당 역에서 택시 경로 없음 | 그 후보만 제외하는 것을 권장 |
| `TaxiError` | `UPSTREAM` | 카카오 장애, 타임아웃(5초) | 502 "일시적인 오류입니다" |
| `Error` | - | 환경변수 누락 | 500 |

`app/api/recommend/route.ts`에서 `instanceof`와 `code`로 나눈다. 두 클래스는 각 기능의 `index.ts`에서 import한다.

## 6. 성능과 호출 한도

- TMAP: 추천 요청당 1회. 같은 출발지, 목적지, 출발 시각(10분 단위)은 10분간 캐시한다. 서버를 재시작하면 캐시가 사라진다. **무료 한도 일 10건, 넘으면 차단된다.** 테스트는 `transit/__fixtures__/`의 저장된 응답을 쓰므로 호출하지 않는다.
- 카카오: 후보 역마다 1회이고, 동시에 최대 5개까지 호출한다. 같은 역·목적지·출발 시각(5분 단위)은 5분간 캐시한다. 역 11개 기준 약 1초 걸린다.
- 무료 한도: 카카오 실시간 길찾기 일 10,000건, 미래 길찾기 일 5,000건([카카오모빌리티 요금](https://developers.kakaomobility.com/en/price/)). 후보 역이 25개면 추천 약 200회/일까지 쓸 수 있다.

## 7. 한계 (데모 전에 알아 둘 것)

| 항목 | 상태 |
|---|---|
| **지하철 출발 시각 반영** | **운행 여부만 반영된다.** TMAP은 출발 시각에 따라 경로와 소요시간을 바꾸지 않는다(16:01과 01:30 응답이 같았다). 첫차 전·막차 후 노선은 빠지지만 열차 대기 시간, 시간대별 소요시간 차이는 없다. |
| 지하철 대체 경로 | 1~9호선 지하철만으로 가는 대체 경로는 구간에 따라 없다. 실측 두 구간 모두 1개. |
| 택시 경로의 출발 시각 반영 | 됨(`boardingAt` 기준 교통 예측). |
| 역별 시간 | 구간 시간을 역 사이 거리로 나눈 추정값이다. |
| 자른 경로의 도착 도보 | 직선거리 × 1.3, 분당 67m 추정이다. 큰길, 하천, 철로 때문에 실제로는 더 걸릴 수 있다. |
| 택시 요금 | 미터 요금 추정이다. 실제 요금은 신호와 정체에 따라 다르다. 카카오 자체 예상 요금과 −7%~+15% 차이가 났다. 시계외 할증과 통행료는 없다. |
| 지하철 요금 | 성인 교통카드 기준이다. 조조할인, 청소년 요금, 버스 환승은 없다. |
| TMAP 호출 한도 | 일 10건. 개발과 데모를 합친 숫자다. |
