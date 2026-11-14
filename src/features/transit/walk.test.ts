import { describe, expect, it } from "vitest";
import type { Route } from "@/shared/types";
import { estimateWalk, straightLineM, truncateAtNearest, WALK_DETOUR_FACTOR, WALK_SPEED_M_PER_MIN } from "./walk";

describe("estimateWalk", () => {
  it("직선거리 × 1.3, 분당 67m로 추정하고 estimated를 표시한다", () => {
    const a = { x: 127.0, y: 37.5 };
    const b = { x: 127.01, y: 37.5 };
    const w = estimateWalk(a, b);
    const expectedM = Math.round(straightLineM(a, b) * WALK_DETOUR_FACTOR);
    expect(w).toEqual({
      distanceM: expectedM,
      minutes: Math.round((expectedM / WALK_SPEED_M_PER_MIN) * 10) / 10,
      estimated: true,
    });
  });

  it("같은 지점이면 0", () => {
    expect(estimateWalk({ x: 127, y: 37.5 }, { x: 127, y: 37.5 })).toEqual({ distanceM: 0, minutes: 0, estimated: true });
  });
});

describe("truncateAtNearest", () => {
  // 2호선 A, B, C -> 환승 -> 3호선 D, E. 목적지는 C 근처(경도 127.021)
  const route: Route = {
    id: "tmap-0",
    fare: 2050,
    stops: [
      { name: "A", x: 127.0, y: 37.5, elapsedMin: 2, mode: "subway", line: "수도권2호선", distanceM: 0, fare: 0 },
      { name: "B", x: 127.01, y: 37.5, elapsedMin: 5, mode: "subway", line: "수도권2호선", distanceM: 900, fare: 1550 },
      { name: "C", x: 127.02, y: 37.5, elapsedMin: 8, mode: "subway", line: "수도권2호선", distanceM: 1800, fare: 1550 },
      { name: "D", x: 127.03, y: 37.51, elapsedMin: 14, mode: "subway", line: "수도권3호선", distanceM: 11000, fare: 1650 },
      { name: "E", x: 127.04, y: 37.52, elapsedMin: 17, mode: "subway", line: "수도권3호선", distanceM: 14000, fare: 1650 },
    ],
    totalMin: 30,
    transferCount: 1,
    walkToDestination: { distanceM: 300, minutes: 4.5 },
  };
  const destination = { x: 127.021, y: 37.5 };

  it("목적지에 가장 가까운 역(C)에서 끊고 이후 역은 버린다", () => {
    const r = truncateAtNearest(route, destination);
    expect(r.stops.map((s) => s.name)).toEqual(["A", "B", "C"]);
    expect(r.truncated).toBe(true);
  });

  it("요금은 끊은 역 하차 요금, 환승 횟수는 남은 역 기준", () => {
    const r = truncateAtNearest(route, destination);
    expect(r.fare).toBe(1550);
    expect(r.transferCount).toBe(0);
  });

  it("도착 도보는 추정, totalMin = 끊은 역 도착 + 추정 도보", () => {
    const r = truncateAtNearest(route, destination);
    expect(r.walkToDestination?.estimated).toBe(true);
    expect(r.walkToDestination!.distanceM).toBeGreaterThan(100);
    expect(r.walkToDestination!.distanceM).toBeLessThan(150); // 경도 0.001도 ≈ 88m × 1.3
    expect(r.totalMin).toBe(Math.round((8 + r.walkToDestination!.minutes) * 10) / 10);
  });

  it("원래 경로는 바꾸지 않는다", () => {
    truncateAtNearest(route, destination);
    expect(route.stops).toHaveLength(5);
    expect(route.truncated).toBeUndefined();
  });
});
