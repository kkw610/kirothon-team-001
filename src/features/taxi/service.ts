import { MemoryCache } from "@/shared/cache";
import type { Coordinate, TaxiEstimate, TaxiEstimator } from "@/shared/types";
import { calculateTaxiFare } from "./fare";

const cache = new MemoryCache<TaxiEstimate>(5 * 60 * 1000, 2000);

const EARTH_RADIUS_M = 6_371_000;
const ROAD_FACTOR = 1.35; // 직선거리 대비 도로거리 가정
const AVG_SPEED_MPS = 25_000 / 3600; // 시속 25km 가정

function straightLineM(a: Coordinate, b: Coordinate): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.y - a.y);
  const dLng = rad(b.x - a.x);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.y)) * Math.cos(rad(b.y)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * 두 지점 사이 택시 거리, 시간, 요금을 추정한다.
 * 현재는 직선거리로 추정하는 가짜 구현이다. 카카오모빌리티 연동 시 거리와 시간만 API 값으로 바꾸고,
 * 요금은 계속 calculateTaxiFare로 계산한다.
 */
export const estimateTaxi: TaxiEstimator = async (from, to) => {
  const key = `${from.x},${from.y}->${to.x},${to.y}`;
  return cache.getOrLoad(key, async () => {
    const distanceM = Math.round(straightLineM(from, to) * ROAD_FACTOR);
    const durationSec = Math.round(distanceM / AVG_SPEED_MPS);
    return { distanceM, durationSec, fare: calculateTaxiFare(distanceM, durationSec) };
  });
};
