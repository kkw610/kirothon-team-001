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
}

export interface Route {
  id: string;
  /** 대중교통 요금(원) */
  fare: number;
  stops: Stop[];
}

export interface Option {
  routeId: string;
  /** 택시로 갈아탈 정류장 이름 */
  stopName: string;
  /** 택시로 갈아탈 정류장 좌표 */
  stopCoord: Coordinate;
  /** 출발 시각 (ISO 8601) */
  departureTime: string;
  /** 예상 도착 시각 (ISO 8601) */
  arrivalTime: string;
  /** 희망 도착 시각 이하로 도착하는지 */
  onTime: boolean;
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
}

/** taxi 기능이 구현하고 recommender가 주입받아 쓰는 함수 형태. */
export type TaxiEstimator = (
  from: Coordinate,
  to: Coordinate,
) => Promise<TaxiEstimate>;
