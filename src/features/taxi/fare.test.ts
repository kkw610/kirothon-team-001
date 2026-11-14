import { describe, expect, it } from "vitest";
import { calculateTaxiFare, TAXI_FARE } from "./fare";

describe("calculateTaxiFare", () => {
  it("기본거리 이내는 기본요금", () => {
    expect(calculateTaxiFare(1000, 200)).toBe(TAXI_FARE.baseFare);
    expect(calculateTaxiFare(1600, 384)).toBe(TAXI_FARE.baseFare);
  });

  it("빠르게 달리면 거리 기준으로 가산", () => {
    // 1600m 초과 131m당 100원: 1731m -> 1단위
    expect(calculateTaxiFare(1731, 200)).toBe(4900);
    expect(calculateTaxiFare(1732, 200)).toBe(5000);
  });

  it("느리게 달리면 시간 기준으로 가산", () => {
    const fare = calculateTaxiFare(1700, 1200);
    expect(fare).toBeGreaterThan(calculateTaxiFare(1700, 400));
  });
});
