# 설계: 경로 지도 (map-route)

## 데이터 흐름
```
app/page.tsx (클라이언트, 기존)
  1) POST /api/recommend               기존 API. routes, best(없으면 가장 빠른 option)
     결과는 <ResultView aside={...}>의 aside 자리에 지도를 넘긴다(현재 자리표시 div).
  2) buildMapProps(response, origin, destination)   map 기능의 순수 함수. 대상 option, subwayPath, markers 계산
  3) GET  /api/taxi-path?fromX&fromY&toX&toY        신규 API. option.stopCoord -> 목적지 도로 경로
  4) <KakaoMap subwayPath taxiPath taxiFallback markers />   결과 아래에 배치
```
- 지하철 선은 새 API 없이 `Route.stops`에서 출발부터 `option.stopName`까지의 좌표를 자른다.
- 이 계산은 `KakaoMap`에도 `app/page.tsx`에도 두지 않고 `buildMapProps`에 둔다. `app/page.tsx`는 호출과 props 전달만 하므로 D와 충돌할 여지가 줄어든다. `buildMapProps`는 `RecommendResponse` 등 shared 타입만 받으므로 기능 폴더 규칙(structure.md)에 맞는다.
- 대상 옵션은 `ResultView`가 보여 주는 옵션과 같아야 한다. 같은 규칙을 쓴다: `best`, 없으면 도착 시각이 가장 이른 옵션(동률이면 앞쪽). `result/select.ts`의 `pickFastest`와 같은 동작을 `map` 안에 따로 구현한다(기능 폴더 간 import 금지).
- 택시 선은 추천된 한 곳만 필요하므로 `recommend` 응답에 넣지 않고 별도 API로 받는다.

## 결정
- **JS 키는 `NEXT_PUBLIC_KAKAO_JS_KEY` 하나로 쓴다.**
  - `app/page.tsx`가 클라이언트 컴포넌트라 서버에서 prop으로 넘기는 방식은 서버 래퍼가 추가로 필요하다.
  - 카카오 지도 JS 키는 원래 브라우저에 노출되는 키이고 등록한 도메인에서만 동작하므로 이 방식을 쓴다. `shared/env.ts`(server-only)는 거치지 않는다.
  - 기존 `KAKAO_JS_KEY`는 추가가 아니라 **교체**한다. 두 이름이 공존하면 팀원이 어느 쪽을 채워야 하는지 혼동한다.
  - `NEXT_PUBLIC_` 값은 빌드할 때 번들에 들어간다. Vercel에서 값을 바꾸면 재배포가 필요하다.
- **택시 경로는 처음부터 실제 API를 쓴다.**
  - 카카오모빌리티 `GET https://apis-navi.kakaomobility.com/v1/directions`(`origin=x,y`, `destination=x,y`, `summary=false`)의 `routes[0].sections[].roads[].vertexes`(x, y가 번갈아 들어 있는 숫자 배열)를 이어 `Coordinate[]`로 만든다.
  - 점이 500개를 넘으면 일정 간격으로 줄인다. **첫 점과 마지막 점(목적지)은 항상 남긴다.**
- **실패 시 직선 대체.**
  - 호출 실패, 타임아웃(5초), 경로 없음이면 `path = [from, to]`, `fallback: true`를 반환한다.
  - API 라우트는 이 경우에도 200으로 응답하고, 화면은 점선으로 그린다.
- **캐시는 성공 결과만 저장한다.** 같은 좌표 쌍은 `MemoryCache`로 캐시하되, 직선 대체 결과는 저장하지 않는다. 일시 오류가 캐시 시간만큼 고정되는 것을 막는다.
- **`TaxiPath`에는 거리와 시간을 넣지 않는다.** 이미 `Option`에 `taxiMin`, `taxiDistanceM`이 있고, 직선 대체 때 채울 값이 없다.

## 노선 색상 설계 (2단계)
- **데이터**: `Stop.line`(대중교통 연동이 채움). 환승역은 먼저 탄 노선이므로, 환승 후 첫 구간은 "환승역 -> 다음 역"이 새 노선이다.
- **구간 나누기**: `buildMapProps`가 정류장을 순서대로 보며 `line`이 바뀌면 새 구간을 시작한다. 새 구간의 첫 점은 직전 구간의 마지막 점(환승역)이다. 그래서 선이 끊기지 않고 환승 구간(환승역 -> 다음 역)은 새 노선 색이 된다.
- **색 매핑**: `map/lineColors.ts`의 `lineColor(line?: string): string`. `/([1-9])호선/`로 번호를 뽑아 1~9호선 공식색을 돌려주고, 없으면 기본 회색. 대중교통 연동 쪽의 `isSeoulLine1to9`는 import하지 않고(기능 폴더 간 금지) 같은 기준을 따로 둔다.

  | 호선 | 색 | 호선 | 색 |
  |---|---|---|---|
  | 1 | `#0052A4` | 6 | `#CD7C2F` |
  | 2 | `#00A84D` | 7 | `#747F00` |
  | 3 | `#EF7C1C` | 8 | `#E6186C` |
  | 4 | `#00A5DE` | 9 | `#BDB092` |
  | 5 | `#996CAC` | 기본 | `#6B7280` |

  색 값은 구현 시 공식 노선색과 다시 맞춰 본다.
- **props 변경**: `subwayPath: Coordinate[]`를 `subwaySegments: { line?: string; color: string; path: Coordinate[] }[]`로 바꾼다. 범례용으로 `legend: { line: string; color: string }[]`(경로에 쓰인 노선, 중복 제거)를 `buildMapProps`가 함께 만든다.
- **택시 선 색**: 3호선 주황과 겹치므로 색 또는 두께, 선 스타일(점선은 직선 대체에 쓰이므로 제외)을 조정한다. 정하기 전까지는 현재 주황을 쓴다.
- **파일**: `map/lineColors.ts`(+테스트)와 `buildMapProps.ts`(+테스트), `KakaoMap.tsx`만 바뀐다. API, 공통 타입, 다른 기능 폴더는 바뀌지 않는다.

## 컴포넌트
### KakaoMap props
```ts
interface KakaoMapProps {
  subwayPath: Coordinate[];   // 출발 ~ 환승역
  taxiPath: Coordinate[];     // 환승역 ~ 목적지
  taxiFallback: boolean;      // true면 점선
  markers: { kind: "origin" | "transfer" | "destination"; name: string; at: Coordinate }[];
}
```
- SDK는 `//dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false`로 한 번만 로드하고 `kakao.maps.load` 콜백 안에서 지도를 만든다. 이 URL, `kakao.maps.load`, Polyline(`strokeStyle`은 `solid`, `dash` 등), CustomOverlay, `setBounds`는 공식 문서([apis.map.kakao.com](https://apis.map.kakao.com/web/documentation/))로 확인했다. 카카오맵 사용 설정 여부만 콘솔에서 확인이 남았다.
- `Polyline` 두 개(지하철 파랑 실선, 택시 주황 실선 또는 점선), 마커 3개(`CustomOverlay`로 "출발/택시 환승/도착 + 이름" 라벨, 이름은 `textContent`로 넣어 HTML로 해석되지 않게 한다), `LatLngBounds` + `setBounds`로 범위를 맞춘다.
- 타입은 쓰는 API만 `kakao.d.ts`에 최소 선언한다.

### buildMapProps
```ts
buildMapProps(response: RecommendResponse, origin: Place, destination: Place):
  { option: Option; subwayPath: Coordinate[]; markers: KakaoMapProps["markers"] } | null
```
- `response.best`가 있으면 그 옵션, 없으면 `arrivalTime`이 가장 빠른 옵션을 대상으로 한다. 옵션이 없으면 `null`을 반환한다.
- `routes`에서 `option.routeId`의 경로를 찾아 첫 정류장부터 `option.stopName`까지 자른다.

## 생성/수정할 파일 목록
| 구분 | 파일 | 비고 |
|---|---|---|
| 생성 | `src/features/taxi/path.ts` | `getTaxiPath`, `vertexes` 변환 함수. B의 `service.ts`는 건드리지 않는다 |
| 생성 | `src/features/taxi/path.test.ts` | `vertexes` 변환, 간격 줄이기(끝점 보존) |
| 생성 | `app/api/taxi-path/route.ts` | zod 검증 |
| 생성 | `src/features/map/KakaoMap.tsx` | 기존 `MapView.tsx`는 건드리지 않는다 |
| 생성 | `src/features/map/RouteMap.tsx` | 대상 옵션 계산, `/api/taxi-path` 호출, 로딩 상태를 맡는 클라이언트 컴포넌트. `page.tsx`는 이것만 `aside`에 넣는다 |
| 생성 | `src/features/map/buildMapProps.ts` | 순수 함수 |
| 생성 | `src/features/map/buildMapProps.test.ts` | 최고 후보 선택, `best`가 `null`일 때, 경로 자르기 |
| 생성(2단계) | `src/features/map/lineColors.ts`, `lineColors.test.ts` | 노선 이름 -> 색 |
| 생성 | `src/features/map/loadKakaoSdk.ts` | 중복 로드 방지 |
| 생성 | `src/features/map/kakao.d.ts` | 최소 타입 선언 |
| 수정 | `src/features/taxi/index.ts` | `getTaxiPath` export 한 줄 (B에게 알림) |
| 수정 | `src/features/map/index.ts` | `KakaoMap`, `buildMapProps` export (D에게 알림) |
| 수정 | `src/features/map/MapView.tsx` | 주석의 `KAKAO_JS_KEY` 이름만 교체 (D에게 알림) |
| 수정 | `app/page.tsx` | `aside`의 자리표시를 `KakaoMap` 컨테이너로 교체. 택시 경로 fetch는 별도 컴포넌트로 분리해 `page.tsx` 변경을 줄인다 (D와 배치 협의) |
| 수정 | `.env.example` | `KAKAO_JS_KEY`를 `NEXT_PUBLIC_KAKAO_JS_KEY`로 교체 |
| 수정 | `src/shared/env.ts` | `EnvKey`에서 `KAKAO_JS_KEY` 제거 |
| 수정 | `.kiro/steering/structure.md` | 39행과 규칙 5의 JS 키 설명, `/api/taxi-path` 한 줄 |
| 수정 | `.kiro/steering/tech.md` | 환경 변수 표에 `NEXT_PUBLIC_KAKAO_JS_KEY` 추가 |

## 공통 파일 변경 요청
| 파일 | 변경 |
|---|---|
| `src/shared/types.ts` | `TaxiPath { path: Coordinate[]; fallback: boolean }` 추가 |
| `src/shared/env.ts` | `EnvKey`에서 `KAKAO_JS_KEY` 제거 |
| `.env.example` | `KAKAO_JS_KEY`를 `NEXT_PUBLIC_KAKAO_JS_KEY`로 교체 |

## 위험
- 노선 색은 `Stop.line` 값에 의존한다. 가짜 데이터나 연동 실패 시 `line`이 비어 있으면 기본 색 한 가지로 그려진다.
- 카카오 콘솔에 배포 도메인을 등록하지 않으면 배포 환경에서만 지도가 안 뜬다.
- 도메인을 등록해도 지도가 안 뜨면 콘솔의 카카오맵 사용 설정을 확인한다.
- `NEXT_PUBLIC_KAKAO_JS_KEY`는 빌드 시점에 번들에 들어간다. Vercel에서 값을 바꾸면 재배포한다.
- 카카오모빌리티 호출 코드가 B의 `service.ts`와 겹친다. 시간이 나면 공통 호출 부분을 하나로 합친다.
