import { describe, expect, it } from "vitest";
import { buildRoute, type TransitLeg } from "./build-route";

// 같은 위도에 경도 간격을 같게 두면 역 사이 직선거리가 같다.
const st = (name: string, x: number) => ({ name, x, y: 37.5 });

/** 도보 3분 -> 2호선 6분 2km(A,B,C) -> 도보 2분(환승) -> 3호선 4분 12km(C,D) -> 도보 1분 */
const legs: TransitLeg[] = [
  { kind: "walk", minutes: 3, distanceM: 200 },
  { kind: "subway", minutes: 6, distanceM: 2000, line: "수도권2호선", stations: [st("A", 127.0), st("B", 127.01), st("C", 127.02)] },
  { kind: "walk", minutes: 2, distanceM: 150 },
  { kind: "subway", minutes: 4, distanceM: 12000, line: "수도권3호선", stations: [st("C", 127.02), st("D", 127.03)] },
  { kind: "walk", minutes: 1, distanceM: 80 },
];
const meta = { id: "r0", fare: 1650, totalMin: 16, timeAware: true, departureTime: "2026-11-14T08:00:00.000Z" };

describe("buildRoute", () => {
  it("역 목록, 누적 시간, 노선(환승역은 한 번만)", () => {
    const route = buildRoute(legs, meta)!;
    expect(route.stops.map((s) => [s.name, s.elapsedMin, s.line])).toEqual([
      ["A", 3, "수도권2호선"],
      ["B", 6, "수도권2호선"],
      ["C", 9, "수도권2호선"],
      ["D", 15, "수도권3호선"],
    ]);
    expect(route).toMatchObject({ totalMin: 16, transferCount: 1, timeAware: true, departureTime: meta.departureTime });
  });

  it("역별 누적 거리와 요금", () => {
    const route = buildRoute(legs, meta)!;
    expect(route.stops.map((s) => [s.name, s.distanceM, s.fare])).toEqual([
      ["A", 0, 0],
      ["B", 1000, 1550],
      ["C", 2000, 1550],
      ["D", 14000, 1650],
    ]);
  });

  it("역별 요금은 경로 요금 이하, 마지막 역은 경로 요금", () => {
    const route = buildRoute(legs, { ...meta, fare: 1550 })!;
    expect(route.stops.every((s) => (s.fare ?? 0) <= 1550)).toBe(true);
    expect(route.stops.at(-1)?.fare).toBe(1550);
  });

  it("구간 거리가 없으면 직선거리로 추정", () => {
    const noDist = legs.map((l) => (l.kind === "subway" ? { ...l, distanceM: undefined } : l));
    const b = buildRoute(noDist, meta)!.stops[1];
    expect(b.distanceM).toBeGreaterThan(850); // 경도 0.01도(위도 37.5) 약 883m
    expect(b.distanceM).toBeLessThan(920);
  });

  it("totalMin이 없으면 구간 시간 합", () => {
    expect(buildRoute(legs, { ...meta, totalMin: undefined })!.totalMin).toBe(16);
  });

  it("출발 도보와 도착 도보를 따로 담는다(환승 도보 제외)", () => {
    const route = buildRoute(legs, meta)!;
    expect(route.walkFromOrigin).toEqual({ distanceM: 200, minutes: 3 });
    expect(route.walkToDestination).toEqual({ distanceM: 80, minutes: 1 });
  });

  it("도착 도보가 없으면 0", () => {
    const route = buildRoute(legs.slice(0, 4), meta)!;
    expect(route.walkToDestination).toEqual({ distanceM: 0, minutes: 0 });
  });

  it("지하철역이 없으면 null", () => {
    expect(buildRoute([{ kind: "walk", minutes: 5 }], meta)).toBeNull();
  });
});
