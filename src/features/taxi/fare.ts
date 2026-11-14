/**
 * 서울 중형택시 미터 요금 계산 (순수 함수).
 *
 * 출처: https://english.seoul.go.kr/policy/transportation/modes-of-transport/taxi/ (2023-02-01 04:00 적용)
 * - 주간: 기본 4,800원(1.6km), 거리 100원/131m, 시간 100원/30초
 * - 심야 22~23시, 02~04시(20%): 기본 5,800원, 120원/131m, 120원/30초
 * - 심야 23~02시(40%): 기본 6,700원, 140원/131m, 140원/30초
 * - 시속 15.72km 미만으로 달리는 동안은 시간요금과 거리요금을 동시에 센다(동시병산).
 *   15.72km/h는 131m를 30초에 달리는 속도라서, 저속 1초는 131/30m를 더 달린 것과 같다.
 * - 미터 요금은 10원 단위로 반올림한다.
 *
 * 다루지 않는 것: 시계 외 할증(서울 밖 목적지는 서비스 범위 밖), 통행료, 운행 중 시간대가 바뀌는 경우
 * (탑승 시각의 요금표를 끝까지 적용한다).
 */
export interface FareTable {
  baseFare: number;
  unitFare: number;
  /** 주간 대비 할증률 */
  surchargeRate: number;
}

export const TAXI_FARE = {
  baseDistanceM: 1600,
  /** 이 거리를 달릴 때마다 unitFare 추가 */
  distanceUnitM: 131,
  /** 저속 구간에서 이 시간마다 unitFare 추가 */
  timeUnitSec: 30,
  /** 시간요금이 붙는 기준 속도(km/h) */
  lowSpeedKmh: 15.72,
  roundUnit: 10,
  day: { baseFare: 4800, unitFare: 100, surchargeRate: 0 },
  /** 22~23시, 02~04시 */
  night20: { baseFare: 5800, unitFare: 120, surchargeRate: 0.2 },
  /** 23~02시 */
  night40: { baseFare: 6700, unitFare: 140, surchargeRate: 0.4 },
} as const;

const SEOUL_HOUR = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  hour: "numeric",
  hourCycle: "h23",
});

/** 탑승 시각(Asia/Seoul 기준)에 적용되는 요금표 */
export function fareTableAt(at: Date): FareTable {
  const hour = Number(SEOUL_HOUR.format(at));
  if (hour === 23 || hour < 2) return TAXI_FARE.night40;
  if (hour === 22 || (hour >= 2 && hour < 4)) return TAXI_FARE.night20;
  return TAXI_FARE.day;
}

export interface TaxiFareInput {
  /** 총 주행거리(m) */
  distanceM: number;
  /** 시속 15.72km 미만으로 달린 시간의 합(초) */
  slowSec: number;
  /** 택시 탑승 시각. 심야 할증 판단에 쓴다 */
  boardingAt: Date;
}

export function calculateTaxiFare({ distanceM, slowSec, boardingAt }: TaxiFareInput): number {
  const t = TAXI_FARE;
  const table = fareTableAt(boardingAt);
  const meterM = Math.max(0, distanceM) + (Math.max(0, slowSec) * t.distanceUnitM) / t.timeUnitSec;
  const units = Math.max(0, Math.ceil((meterM - t.baseDistanceM) / t.distanceUnitM));
  const fare = table.baseFare + units * table.unitFare;
  return Math.round(fare / t.roundUnit) * t.roundUnit;
}

/** 도로 구간 목록에서 기준 속도 미만으로 달린 시간(초)의 합을 구한다. */
export function slowSeconds(roads: Array<{ distanceM: number; durationSec: number }>): number {
  return roads.reduce((sum, road) => {
    if (road.durationSec <= 0) return sum;
    // 속도 < 131m/30초(=15.72km/h)를 나눗셈 없이 비교해 경계에서 부동소수점 오차를 피한다.
    const slow = road.distanceM * TAXI_FARE.timeUnitSec < TAXI_FARE.distanceUnitM * road.durationSec;
    return slow ? sum + road.durationSec : sum;
  }, 0);
}
