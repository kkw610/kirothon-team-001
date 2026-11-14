import { describe, expect, it } from "vitest";
import { calculateTaxiFare, fareTableAt, slowSeconds, TAXI_FARE } from "./fare";

// Asia/Seoul(UTC+9) 기준 시각을 만든다.
const kst = (hhmm: string) => new Date(`2026-11-14T${hhmm}:00+09:00`);
const DAY = kst("14:00");

describe("calculateTaxiFare", () => {
  it("기본거리 이내는 기본요금", () => {
    expect(calculateTaxiFare({ distanceM: 0, slowSec: 0, boardingAt: DAY })).toBe(4800);
    expect(calculateTaxiFare({ distanceM: 1600, slowSec: 0, boardingAt: DAY })).toBe(4800);
  });

  it("1.6km 초과 131m마다 100원", () => {
    expect(calculateTaxiFare({ distanceM: 1601, slowSec: 0, boardingAt: DAY })).toBe(4900);
    expect(calculateTaxiFare({ distanceM: 1731, slowSec: 0, boardingAt: DAY })).toBe(4900);
    expect(calculateTaxiFare({ distanceM: 1732, slowSec: 0, boardingAt: DAY })).toBe(5000);
  });

  it("저속 30초는 131m와 같고 거리요금에 더해진다(동시병산)", () => {
    // 1600m + 저속 30초(=131m) -> 1단위
    expect(calculateTaxiFare({ distanceM: 1600, slowSec: 30, boardingAt: DAY })).toBe(4900);
    // 1731m(1단위) + 저속 30초(1단위) -> 2단위
    expect(calculateTaxiFare({ distanceM: 1731, slowSec: 30, boardingAt: DAY })).toBe(5000);
  });

  it("10km, 저속 10분 예시", () => {
    // 10000 + 600*131/30(=2620) = 12620m -> ceil(11020/131)=85단위 -> 4800+8500
    expect(calculateTaxiFare({ distanceM: 10_000, slowSec: 600, boardingAt: DAY })).toBe(13_300);
  });

  it("심야 할증 요금표를 탑승 시각으로 고른다", () => {
    const input = { distanceM: 1731, slowSec: 0 };
    expect(calculateTaxiFare({ ...input, boardingAt: kst("22:30") })).toBe(5800 + 120);
    expect(calculateTaxiFare({ ...input, boardingAt: kst("23:00") })).toBe(6700 + 140);
    expect(calculateTaxiFare({ ...input, boardingAt: kst("01:59") })).toBe(6700 + 140);
    expect(calculateTaxiFare({ ...input, boardingAt: kst("02:00") })).toBe(5800 + 120);
    expect(calculateTaxiFare({ ...input, boardingAt: kst("04:00") })).toBe(4800 + 100);
  });
});

describe("fareTableAt", () => {
  it("시간대 경계", () => {
    expect(fareTableAt(kst("21:59"))).toBe(TAXI_FARE.day);
    expect(fareTableAt(kst("22:00"))).toBe(TAXI_FARE.night20);
    expect(fareTableAt(kst("23:00"))).toBe(TAXI_FARE.night40);
    expect(fareTableAt(kst("02:00"))).toBe(TAXI_FARE.night20);
    expect(fareTableAt(kst("03:59"))).toBe(TAXI_FARE.night20);
    expect(fareTableAt(kst("04:00"))).toBe(TAXI_FARE.day);
  });
});

describe("slowSeconds", () => {
  it("시속 15.72km 미만 구간 시간만 더한다", () => {
    expect(
      slowSeconds([
        { distanceM: 100, durationSec: 60 }, // 6km/h -> 저속
        { distanceM: 1000, durationSec: 60 }, // 60km/h
        { distanceM: 131, durationSec: 30 }, // 15.72km/h -> 저속 아님
        { distanceM: 0, durationSec: 0 },
      ]),
    ).toBe(60);
  });
});
