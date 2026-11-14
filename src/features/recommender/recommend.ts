import type {
  Option,
  Place,
  RecommendResponse,
  Route,
  TaxiEstimate,
  TaxiEstimator,
} from "@/shared/types";
import { buildLegs } from "./legs";
import { NEAR_DESTINATION_M, TAXI_WAIT_BUFFER_MIN } from "./constants";

export interface RecommendInput {
  routes: Route[];
  destination: Place;
  departureAt: Date;
  arrivalDeadline: Date;
  estimateTaxi: TaxiEstimator;
}

const MIN_MS = 60_000;
const EARTH_RADIUS_M = 6_371_000;

/** 두 좌표 사이 직선거리(m, 하버사인) */
function distanceM(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.y - a.y) * rad;
  const dLon = (b.x - a.x) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.y * rad) * Math.cos(b.y * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * 택시 추정기가 "경로 없음"으로 실패했는지. 기능 폴더끼리 import하지 않으므로
 * TaxiError 클래스 대신 code 필드("NO_ROUTE")로 판단한다(handoff.md 5. 오류).
 */
function isNoRouteError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "NO_ROUTE"
  );
}

/**
 * 지하철 전용 Route 중 마지막 Stop의 elapsedMin이 가장 작은 Route 1개를 고른다.
 * 정렬하지 않고 입력 순서대로 한 번 순회하며, 엄격히 더 작을 때만 교체하므로
 * 동률이면 먼저 나온 Route가 남는다. 해당하는 Route가 없으면 undefined.
 */
export function pickFastestSubwayRoute(routes: Route[]): Route | undefined {
  let picked: Route | undefined;
  let minDuration = Infinity;
  for (const route of routes) {
    const { stops } = route;
    if (stops.length === 0) continue;
    if (!stops.every((stop) => stop.mode === "subway")) continue;
    const duration = stops[stops.length - 1].elapsedMin;
    if (picked === undefined || duration < minDuration) {
      picked = route;
      minDuration = duration;
    }
  }
  return picked;
}

/**
 * 지하철로 끝까지 간 뒤 마지막 역에서 목적지까지 걸어가는 옵션.
 * 도착 = 출발 + 마지막 역까지 지하철 시간 + 도보 시간(Route.totalMin이 있으면 그 값), 총비용 = 경로 요금.
 * 도보 정보(walkToDestination)가 없으면 목적지까지 걷는 시간을 알 수 없으므로 만들지 않는다.
 */
function buildWalkOption(
  route: Route,
  departureAt: Date,
  arrivalDeadline: Date,
): { option: Option; arrivalMs: number } | null {
  const walk = route.walkToDestination;
  const last = route.stops[route.stops.length - 1];
  if (!walk || !last) return null;
  const totalMin = route.totalMin ?? last.elapsedMin + walk.minutes;
  const arrivalMs = departureAt.getTime() + totalMin * MIN_MS;
  return {
    arrivalMs,
    option: {
      kind: "walk",
      routeId: route.id,
      stopName: last.name,
      stopCoord: { x: last.x, y: last.y },
      departureTime: departureAt.toISOString(),
      arrivalTime: new Date(arrivalMs).toISOString(),
      onTime: arrivalMs <= arrivalDeadline.getTime(),
      subwayMin: last.elapsedMin,
      walkMin: walk.minutes,
      walkDistanceM: walk.distanceM,
      taxiWaitMin: 0,
      taxiMin: 0,
      taxiDistanceM: 0,
      subwayFare: route.fare,
      taxiFare: 0,
      totalCost: route.fare,
    },
  };
}

/**
 * 경로의 각 지하철 정류장을 택시 환승 후보로 평가하고 추천 옵션을 고른다.
 *
 * 도착 시각 = 출발 + 정류장까지 지하철 시간 + 5분 버퍼 + 택시 시간
 * 총비용   = 정류장까지 지하철 요금 + 택시 요금
 * 제시간(도착 <= 희망 시각) 후보 중 총비용 최소, 같으면 도착이 빠른 쪽을 고른다.
 */
export async function recommend(input: RecommendInput): Promise<RecommendResponse> {
  const { routes, destination, departureAt, arrivalDeadline, estimateTaxi } = input;

  const selected = pickFastestSubwayRoute(routes);
  if (!selected) return { best: null, options: [], routes: [] };

  const candidates = selected.stops
    .map((stop, index) => ({ stop, index }))
    .filter(({ stop }) => stop.mode === "subway")
    .filter(({ stop }) => distanceM(stop, destination) > NEAR_DESTINATION_M);

  const results = await Promise.all(
    candidates.map(async ({ stop, index }) => {
      const route = selected;
      // 택시 탑승 시각 = 출발 + 정류장까지 지하철 시간 + 대기 버퍼. 교통 예측과 심야 할증 판단에 쓴다.
      const boardingMs =
        departureAt.getTime() + (stop.elapsedMin + TAXI_WAIT_BUFFER_MIN) * MIN_MS;
      let taxi: TaxiEstimate;
      try {
        taxi = await estimateTaxi(stop, destination, new Date(boardingMs));
      } catch (error) {
        // 이 역에서만 택시 경로가 없으면 후보에서 뺀다. 그 밖의 오류(외부 API 장애 등)는 전체 실패로 올린다.
        if (isNoRouteError(error)) return null;
        throw error;
      }
      const taxiMin = Math.ceil(taxi.durationSec / 60);
      const arrivalMs = boardingMs + taxi.durationSec * 1000;
      // 역별 지하철 요금(stop.fare)을 우선 쓴다. 없으면 첫 역은 0, 나머지는 끝까지 가는 요금으로 대체한다.
      const subwayFare = stop.fare ?? (index === 0 ? 0 : route.fare);
      const option: Option = {
        routeId: route.id,
        stopName: stop.name,
        stopCoord: { x: stop.x, y: stop.y },
        departureTime: departureAt.toISOString(),
        arrivalTime: new Date(arrivalMs).toISOString(),
        legs: buildLegs(route.stops, index),
        onTime: arrivalMs <= arrivalDeadline.getTime(),
        subwayMin: stop.elapsedMin,
        taxiWaitMin: TAXI_WAIT_BUFFER_MIN,
        taxiMin,
        taxiDistanceM: taxi.distanceM,
        subwayFare,
        taxiFare: taxi.fare,
        totalCost: subwayFare + taxi.fare,
      };
      return { option, arrivalMs };
    }),
  );
  const evaluated = results.filter(
    (r): r is { option: Option; arrivalMs: number } => r !== null,
  );

  // 택시 없이 끝까지 지하철을 타고 마지막 역에서 걸어가는 기준 옵션. 도보 정보가 있을 때만 만든다.
  const walkOption = buildWalkOption(selected, departureAt, arrivalDeadline);
  if (walkOption) evaluated.push(walkOption);

  const onTime = evaluated
    .filter(({ option }) => option.onTime)
    .sort(
      (a, b) =>
        a.option.totalCost - b.option.totalCost || a.arrivalMs - b.arrivalMs,
    );

  return {
    best: onTime[0]?.option ?? null,
    options: evaluated.map(({ option }) => option),
    routes: [selected],
  };
}
