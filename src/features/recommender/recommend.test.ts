import { describe, expect, it, vi } from "vitest";
import type { Route, TaxiEstimator } from "@/shared/types";
import { recommend } from "./recommend";

const route: Route = {
  id: "r1",
  fare: 1500,
  stops: [
    { name: "A", x: 0, y: 0, elapsedMin: 0, mode: "subway" },
    { name: "B", x: 1, y: 0, elapsedMin: 10, mode: "subway" },
    { name: "C", x: 2, y: 0, elapsedMin: 20, mode: "subway" },
  ],
};

// 정류장 x좌표가 클수록 목적지에 가까움: 택시 5분 단위 감소, 요금 감소
const taxi: TaxiEstimator = async (from) => ({
  distanceM: 0,
  durationSec: (3 - from.x) * 600,
  fare: (3 - from.x) * 5000,
});

const base = {
  routes: [route],
  destination: { name: "D", x: 3, y: 0 },
  departureAt: new Date("2025-01-01T00:00:00Z"),
  estimateTaxi: taxi,
};

describe("recommend", () => {
  it("제시간 후보 중 총비용이 가장 낮은 정류장을 고른다", async () => {
    // A: 5+30=35분/15000, B: 10+5+20=35분/1500+10000, C: 20+5+10=35분/1500+5000
    const res = await recommend({ ...base, arrivalDeadline: new Date("2025-01-01T00:40:00Z") });
    expect(res.best?.stopName).toBe("C");
    expect(res.options).toHaveLength(3);
    expect(res.best).toMatchObject({
      subwayMin: 20,
      taxiWaitMin: 5,
      taxiMin: 10,
      subwayFare: 1500,
      taxiFare: 5000,
      totalCost: 6500,
      onTime: true,
    });
  });

  it("출발 정류장에서 바로 타면 지하철 요금이 0원", async () => {
    const res = await recommend({ ...base, arrivalDeadline: new Date("2025-01-01T00:40:00Z") });
    const first = res.options.find((o) => o.stopName === "A");
    expect(first).toMatchObject({ subwayFare: 0, subwayMin: 0 });
  });

  it("제시간 도착이 불가능하면 best는 null", async () => {
    const res = await recommend({ ...base, arrivalDeadline: new Date("2025-01-01T00:10:00Z") });
    expect(res.best).toBeNull();
    expect(res.options).toHaveLength(3);
    expect(res.options.every((o) => !o.onTime)).toBe(true);
  });

  it("도착 시각이 희망 시각과 같으면 제시간으로 본다", async () => {
    const res = await recommend({ ...base, arrivalDeadline: new Date("2025-01-01T00:35:00Z") });
    expect(res.best).not.toBeNull();
  });
});

describe("recommend 경로 선택", () => {
  const deadline = new Date("2025-01-01T01:00:00Z");

  it("버스 Stop이 있는 Route는 지하철 전용 Route가 있어도 제외된다", async () => {
    const busRoute: Route = {
      id: "bus",
      fare: 1200,
      stops: [
        { name: "A", x: 0, y: 0, elapsedMin: 0, mode: "subway" },
        { name: "Bus", x: 1, y: 0, elapsedMin: 3, mode: "bus" },
      ],
    };
    const res = await recommend({ ...base, routes: [busRoute, route], arrivalDeadline: deadline });
    expect(res.routes.map((r) => r.id)).toEqual(["r1"]);
    expect(res.options.every((o) => o.routeId !== "bus")).toBe(true);
  });

  it("지하철 전용 Route가 여럿이면 소요시간이 최소인 Route만 남는다", async () => {
    const slow: Route = {
      id: "slow",
      fare: 1500,
      stops: [
        { name: "A", x: 0, y: 0, elapsedMin: 0, mode: "subway" },
        { name: "B", x: 1, y: 0, elapsedMin: 40, mode: "subway" },
      ],
    };
    const res = await recommend({ ...base, routes: [slow, route], arrivalDeadline: deadline });
    expect(res.routes.map((r) => r.id)).toEqual(["r1"]);
    expect(res.routes.some((r) => r.id === "slow")).toBe(false);
  });

  it("소요시간이 같으면 먼저 입력된 Route를 선택한다", async () => {
    const twin: Route = { ...route, id: "twin" };
    const res = await recommend({ ...base, routes: [twin, route], arrivalDeadline: deadline });
    expect(res.routes.map((r) => r.id)).toEqual(["twin"]);
  });
});

describe("recommend 빈 입력과 오류 전파", () => {
  const deadline = new Date("2025-01-01T01:00:00Z");
  const emptyResult = { best: null, options: [], routes: [] };

  it("모든 Route에 버스 Stop이 있으면 빈 결과를 반환하고 택시를 호출하지 않는다", async () => {
    const busRoutes: Route[] = ["b1", "b2"].map((id) => ({
      id,
      fare: 1200,
      stops: [
        { name: "A", x: 0, y: 0, elapsedMin: 0, mode: "subway" as const },
        { name: "Bus", x: 1, y: 0, elapsedMin: 3, mode: "bus" as const },
      ],
    }));
    const spy = vi.fn(taxi);
    const res = await recommend({ ...base, routes: busRoutes, arrivalDeadline: deadline, estimateTaxi: spy });
    expect(res).toEqual(emptyResult);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it("routes가 빈 배열이면 빈 결과를 반환하고 택시를 호출하지 않는다", async () => {
    const spy = vi.fn(taxi);
    const res = await recommend({ ...base, routes: [], arrivalDeadline: deadline, estimateTaxi: spy });
    expect(res).toEqual(emptyResult);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it("estimateTaxi가 한 Stop에서 예외를 던지면 recommend가 reject된다", async () => {
    const failing: TaxiEstimator = async (from, to) => {
      if ("name" in from && from.name === "B") throw new Error("taxi failure");
      return taxi(from, to);
    };
    await expect(
      recommend({ ...base, arrivalDeadline: deadline, estimateTaxi: failing }),
    ).rejects.toThrow("taxi failure");
  });
});
describe("recommend 목적지 근처 정류장", () => {
  it("목적지와 같은 위치의 정류장은 택시 후보에서 빼고 택시를 호출하지 않는다", async () => {
    const atDestination: Route = {
      id: "r2",
      fare: 1500,
      stops: [
        { name: "A", x: 127.0, y: 37.5, elapsedMin: 0, mode: "subway" },
        { name: "B", x: 127.01, y: 37.5, elapsedMin: 10, mode: "subway" },
        { name: "도착역", x: 127.02, y: 37.5, elapsedMin: 20, mode: "subway" },
      ],
    };
    const spy = vi.fn(taxi);
    const res = await recommend({
      ...base,
      routes: [atDestination],
      destination: { name: "도착역", x: 127.02001, y: 37.50001 },
      arrivalDeadline: new Date("2025-01-01T02:00:00Z"),
      estimateTaxi: spy,
    });
    expect(res.options.map((o) => o.stopName)).toEqual(["A", "B"]);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
