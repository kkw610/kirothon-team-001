/** 기능 폴더 사이에서 주고받는 공통 타입. 기능 폴더끼리는 이 타입으로만 데이터를 교환한다. */

export interface Coordinate {
  /** 경도 */
  x: number;
  /** 위도 */
  y: number;
}

export interface Place extends Coordinate {
  name: string;
}

export type TransportMode = "subway" | "bus";

export interface Stop extends Coordinate {
  name: string;
  /** 출발지부터의 누적 소요시간(분) */
  elapsedMin: number;
  mode: TransportMode;
  /** 노선 이름(예: "수도권 2호선"). 환승역은 먼저 탄 노선 */
  line?: string;
  /** 탑승역부터 이 역까지 지하철 누적 거리(m, 추정) */
  distanceM?: number;
  /** 출발지에서 이 역까지 타고 내릴 때의 지하철 요금(원). 첫 역(탑승역)은 0 */
  fare?: number;
}

/** 한 호선으로 계속 탄 구간. 호선이 바뀔 때마다 새 구간이 시작된다. */
export interface SubwayLeg {
  line: string;
  fromName: string;
  toName: string;
  /** 출발지부터의 누적 소요시간(분) */
  startMin: number;
  endMin: number;
}

/** 도보 구간 */
export interface WalkSegment {
  /** 거리(m) */
  distanceM: number;
  /** 시간(분, 소수 1자리) */
  minutes: number;
  /** true면 API 값이 아니라 직선거리로 추정한 값 */
  estimated?: boolean;
}

export interface Route {
  id: string;
  /** 대중교통 요금(원). 끝까지 지하철로 갈 때의 요금 */
  fare: number;
  stops: Stop[];
  /** 출발지에서 목적지까지 총 소요시간(분, 도보 포함) */
  totalMin?: number;
  /** 지하철 환승 횟수 */
  transferCount?: number;
  /** 출발 시각을 기준으로 찾은 경로인지 */
  timeAware?: boolean;
  /** 경로 검색 기준 출발 시각 (ISO 8601) */
  departureTime?: string;
  /** 출발지에서 첫 역까지 도보. elapsedMin에 이미 포함된다 */
  walkFromOrigin?: WalkSegment;
  /** 마지막 역에서 목적지까지 도보. 택시 없이 갈 때만 쓴다. totalMin에 포함된다 */
  walkToDestination?: WalkSegment;
  /** true면 버스·1~9호선 외 노선 앞에서 자른 경로. 마지막 역 이후는 도보(추정) 또는 택시 */
  truncated?: boolean;
}

export interface Option {
  /**
   * "taxi": 정류장에서 내려 택시로 간다(없으면 "taxi").
   * "walk": 끝까지 지하철을 타고 마지막 역에서 목적지까지 걸어간다. 택시 필드는 0이다.
   */
  kind?: "walk" | "taxi";
  routeId: string;
  /** 택시로 갈아탈 정류장 이름. kind가 "walk"이면 마지막 역 */
  stopName: string;
  /** 택시로 갈아탈 정류장 좌표. kind가 "walk"이면 마지막 역 */
  stopCoord: Coordinate;
  /** 마지막 역에서 목적지까지 도보 시간(분). kind가 "walk"일 때만 있다 */
  walkMin?: number;
  /** 마지막 역에서 목적지까지 도보 거리(m). kind가 "walk"일 때만 있다 */
  walkDistanceM?: number;
  /** 출발 시각 (ISO 8601) */
  departureTime: string;
  /** 예상 도착 시각 (ISO 8601) */
  arrivalTime: string;
  /** 희망 도착 시각 이하로 도착하는지 */
  onTime: boolean;
  /** 호선별 탑승 구간. 호선 정보가 없는 경로면 비어 있다. */
  legs?: SubwayLeg[];
  /** 지하철 탑승 시간(분). 출발지에서 환승 정류장까지 */
  subwayMin: number;
  /** 택시 탑승 전 고정 대기 시간(분) */
  taxiWaitMin: number;
  /** 택시 이동 시간(분, 올림) */
  taxiMin: number;
  /** 택시 이동 거리(m) */
  taxiDistanceM: number;
  /** 지하철 요금(원) */
  subwayFare: number;
  /** 택시 요금(원) */
  taxiFare: number;
  /** 총비용(원) = subwayFare + taxiFare */
  totalCost: number;
}

export interface RecommendResponse {
  /** 제시간 도착 후보 중 총비용이 가장 낮은 옵션. 없으면 null */
  best: Option | null;
  options: Option[];
  routes: Route[];
}

export interface RecommendRequest {
  origin: Place;
  destination: Place;
  /** 도착해야 하는 시각 (ISO 8601) */
  arrivalTime: string;
  /** 출발 시각 (ISO 8601). 생략하면 서버 현재 시각 */
  departureTime?: string;
}

export interface TaxiEstimate {
  distanceM: number;
  durationSec: number;
  /** 거리와 시간으로 직접 계산한 요금(원) */
  fare: number;
  /** 시속 15.72km 미만으로 달린 시간(초). 시간요금 계산 근거 */
  slowSec?: number;
  /** 적용한 할증률. 0(주간), 0.2, 0.4(심야) */
  surchargeRate?: number;
  /** 소요시간의 교통 기준. realtime: 호출 시점 교통, predicted: 탑승 시각의 교통 예측 */
  trafficBasis?: "realtime" | "predicted";
}

/**
 * taxi 기능이 구현하고 recommender가 주입받아 쓰는 함수 형태.
 * boardingAt(택시 탑승 시각)으로 심야 할증을 판단한다. 생략하면 호출 시점의 현재 시각이다.
 */
export type TaxiEstimator = (
  from: Coordinate,
  to: Coordinate,
  boardingAt?: Date,
) => Promise<TaxiEstimate>;

export type ApiErrorCode = "INVALID_REQUEST" | "NO_ROUTE" | "UPSTREAM_ERROR" | "SERVER_ERROR";

/** API 오류 응답 본문. error는 사용자에게 보여 줘도 되는 문장이다. */
export interface ApiErrorBody {
  error: string;
  /**
   * INVALID_REQUEST(400): 요청 형식 오류
   * NO_ROUTE(404): 조건에 맞는 경로가 없음(정상적인 "결과 없음")
   * UPSTREAM_ERROR(502): 외부 API 호출 실패(연결, 인증, 한도, 응답 형식)
   * SERVER_ERROR(500): 그 밖의 서버 오류(설정 누락, 버그)
   */
  code: ApiErrorCode;
  /** 오류가 난 외부 API. NO_ROUTE, UPSTREAM_ERROR에서만 있다 */
  source?: "transit" | "taxi" | "places";
}

/** 환승역에서 목적지까지 택시로 가는 도로 경로(지도용). */
export interface TaxiPath {
  /** 출발에서 도착 순서의 좌표. 길찾기에 실패하면 [출발, 도착] 두 점 */
  path: Coordinate[];
  /** true면 도로 경로를 못 구해 직선으로 대신한 것 */
  fallback: boolean;
}
