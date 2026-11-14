import { describe, expect, it } from "vitest";
import { calculateSubwayFare } from "./fare";

describe("calculateSubwayFare", () => {
  it("10km 이하는 기본운임", () => {
    expect(calculateSubwayFare(0)).toBe(1550);
    expect(calculateSubwayFare(10_000)).toBe(1550);
  });

  it("10km 초과 50km까지 5km마다 100원", () => {
    expect(calculateSubwayFare(10_001)).toBe(1650);
    expect(calculateSubwayFare(15_000)).toBe(1650);
    expect(calculateSubwayFare(15_001)).toBe(1750);
    expect(calculateSubwayFare(50_000)).toBe(2350);
  });

  it("50km 초과 8km마다 100원", () => {
    expect(calculateSubwayFare(50_001)).toBe(2450);
    expect(calculateSubwayFare(58_000)).toBe(2450);
    expect(calculateSubwayFare(58_001)).toBe(2550);
  });
});
