import type { Coordinate, Route, WalkSegment } from "@/shared/types";

/**
 * 도보 추정 상수. TMAP 보행자 API는 별도 상품이라 호출하지 않고 직선거리로 추정한다(design.md D5).
 * - 속도: TMAP 대중교통 응답의 실측 도보(봉은사역 → 코엑스 551m, 494초) ≈ 분당 67m
 * - 우회율: 도로를 따라 걸으므로 직선거리보다 길다. 1.3배로 본다.
 */
export const WALK_SPEED_M_PER_MIN = 67;
export const WALK_DETOUR_FACTOR = 1.3;

const EARTH_RADIUS_M = 6_371_000;

export function straightLineM(a: Coordinate, b: Coordinate): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.y - a.y);
  const dLng = rad(b.x - a.x);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.y)) * Math.cos(rad(b.y)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 두 지점 사이 도보 거리와 시간을 추정한다. */
export function estimateWalk(from: Coordinate, to: Coordinate): WalkSegment {
  const distanceM = Math.round(straightLineM(from, to) * WALK_DETOUR_FACTOR);
  return { distanceM, minutes: round1(distanceM / WALK_SPEED_M_PER_MIN), estimated: true };
}

/** 이웃한 두 역 사이에서 노선이 바뀌었는지(환승) */
function changesLine(prev: string | undefined, next: string | undefined): boolean {
  return prev !== undefined && next !== undefined && prev !== next;
}

/**
 * 목적지까지 직선거리가 가장 짧은 역에서 경로를 끊는다(domain-rules.md, design.md D5).
 * - 그 역이 하차역이 되고, 요금은 그 역 하차 요금(stop.fare), 환승 횟수는 남은 역의 노선 변화로 다시 센다.
 * - 목적지까지는 도보 추정(walkToDestination.estimated = true), totalMin = 그 역 도착 + 추정 도보.
 * - 동률이면 앞쪽(먼저 도착하는) 역을 고른다.
 */
export function truncateAtNearest(route: Route, destination: Coordinate): Route {
  let best = 0;
  let bestM = Infinity;
  route.stops.forEach((stop, i) => {
    const m = straightLineM(stop, destination);
    if (m < bestM) {
      best = i;
      bestM = m;
    }
  });
  const stops = route.stops.slice(0, best + 1);
  const last = stops[stops.length - 1];
  const walk = estimateWalk(last, destination);
  let transferCount = 0;
  for (let i = 1; i < stops.length; i += 1) {
    if (changesLine(stops[i - 1].line, stops[i].line)) transferCount += 1;
  }
  return {
    ...route,
    stops,
    fare: last.fare ?? route.fare,
    totalMin: round1(last.elapsedMin + walk.minutes),
    transferCount,
    walkToDestination: walk,
    truncated: true,
  };
}
