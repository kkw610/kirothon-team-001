/**
 * 택시 요금 계산 (순수 함수).
 *
 * TODO: 아래 상수는 서울시 일반택시 요금 기준을 기억해 둔 임시 값이다.
 * 구현 전에 서울시 택시 요금 고시로 확인하고 출처를 적을 것. 심야 할증, 시계 외 할증은 아직 없다.
 */
export const TAXI_FARE = {
  baseFare: 4800,
  baseDistanceM: 1600,
  /** 이 거리를 달릴 때마다 unitFare 추가 */
  distanceUnitM: 131,
  /** 시속 15km 이하 구간에서 이 시간마다 unitFare 추가 */
  timeUnitSec: 31,
  unitFare: 100,
  /** 기본요금 구간을 달리는 데 걸린 것으로 보는 시간 */
  baseDurationSec: 1600 / (15_000 / 3600),
} as const;

/**
 * 거리 기준 단위 수와 시간 기준 단위 수 중 큰 쪽을 적용한다.
 * 시속 15km 이상에서는 거리가, 미만에서는 시간이 더 크게 나와 거리·시간 병산 방식을 근사한다.
 */
export function calculateTaxiFare(distanceM: number, durationSec: number): number {
  const t = TAXI_FARE;
  const distanceUnits = Math.max(0, Math.ceil((distanceM - t.baseDistanceM) / t.distanceUnitM));
  const timeUnits = Math.max(0, Math.ceil((durationSec - t.baseDurationSec) / t.timeUnitSec));
  return t.baseFare + Math.max(distanceUnits, timeUnits) * t.unitFare;
}
