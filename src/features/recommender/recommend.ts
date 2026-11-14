import type {
  Option,
  Place,
  RecommendResponse,
  Route,
  TaxiEstimator,
} from "@/shared/types";
import { buildLegs } from "./legs";
import { TAXI_WAIT_BUFFER_MIN } from "./constants";

export interface RecommendInput {
  routes: Route[];
  destination: Place;
  departureAt: Date;
  arrivalDeadline: Date;
  estimateTaxi: TaxiEstimator;
}

const MIN_MS = 60_000;

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
    .filter(({ stop }) => stop.mode === "subway");

  const evaluated = await Promise.all(
    candidates.map(async ({ stop, index }) => {
      const route = selected;
      const taxi = await estimateTaxi(stop, destination);
      const taxiMin = Math.ceil(taxi.durationSec / 60);
      const arrivalMs =
        departureAt.getTime() +
        (stop.elapsedMin + TAXI_WAIT_BUFFER_MIN) * MIN_MS +
        taxi.durationSec * 1000;
      // 출발 정류장에서 바로 택시를 타면 지하철 요금은 들지 않는다. 구간별 요금은 외부 API 연동 시 반영한다.
      const subwayFare = index === 0 ? 0 : route.fare;
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
