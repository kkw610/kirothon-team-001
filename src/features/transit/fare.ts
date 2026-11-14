/**
 * 수도권 지하철 거리비례 요금 계산 (순수 함수, 성인 교통카드 기준).
 *
 * 출처: https://world.seoul.go.kr/policy/transportation/modes-of-transport/subway/ (2025-06-28 인상 반영)
 * - 기본운임 1,550원(10km까지)
 * - 10km 초과 50km까지 5km마다 100원
 * - 50km 초과 8km마다 100원
 * 조조할인, 청소년·어린이 요금, 버스 환승 요금은 다루지 않는다.
 */
export const SUBWAY_FARE = {
  baseFare: 1550,
  baseDistanceM: 10_000,
  midLimitM: 50_000,
  midUnitM: 5_000,
  farUnitM: 8_000,
  unitFare: 100,
} as const;

export function calculateSubwayFare(distanceM: number): number {
  const f = SUBWAY_FARE;
  if (distanceM <= f.baseDistanceM) return f.baseFare;
  const mid = Math.min(distanceM, f.midLimitM) - f.baseDistanceM;
  const far = Math.max(0, distanceM - f.midLimitM);
  return (
    f.baseFare +
    Math.ceil(mid / f.midUnitM) * f.unitFare +
    Math.ceil(far / f.farUnitM) * f.unitFare
  );
}
