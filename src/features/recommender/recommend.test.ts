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
  // 마지막 역에서 목적지까지 도보 25분 -> 도보 옵션 도착 45분
  walkToDestination: { distanceM: 1800, minutes: 25 },
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
    // A: 3+30=33분/15000, B: 10+3+20=33분/1500+10000, C: 20+3+10=33분/1500+5000, 도보: 45분(늦음)
    const res = await recommend({ ...base, arrivalDeadline: new Date("2025-01-01T00:40:00Z") });
    expect(res.best?.stopName).toBe("C");
    expect(res.options).toHaveLength(4);
    expect(res.best).toMatchObject({
      subwayMin: 20,
      taxiWaitMin: 3,
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
    expect(res.options).toHaveLength(4);
    expect(res.options.every((o) => !o.onTime)).toBe(true);
  });

  it("도착 시각이 희망 시각과 같으면 제시간으로 본다", async () => {
    const res = await recommend({ ...base, arrivalDeadline: new Date("2025-01-01T00:33:00Z") });
    expect(res.best).not.toBeNull();
  });
});

describe("recommend 도보 기준 옵션", () => {
  it("도보로 제시간이면 택시 옵션보다 싸므로 도보 옵션을 추천한다", async () => {
    const res = await recommend({ ...base, arrivalDeadline: new Date("2025-01-01T00:50:00Z") });
    expect(res.best).toMatchObject({
      kind: "walk",
      stopName: "C",
      subwayMin: 20,
      walkMin: 25,
      taxiWaitMin: 0,
      taxiFare: 0,
      totalCost: 1500,
      arrivalTime: "2025-01-01T00:45:00.000Z",
      onTime: true,
    });
  });

  it("도보가 늦고 택시가 제시간이면 택시 옵션을 추천한다", async () => {
    const res = await recommend({ ...base, arrivalDeadline: new Date("2025-01-01T00:40:00Z") });
    expect(res.best?.kind).toBeUndefined();
    expect(res.options.find((o) => o.kind === "walk")?.onTime).toBe(false);
  });

  it("Route.totalMin이 있으면 도보 옵션 도착 시간에 그 값을 쓴다", async () => {
    const res = await recommend({
      ...base,
      routes: [{ ...route, totalMin: 30 }],
      arrivalDeadline: new Date("2025-01-01T00:50:00Z"),
    });
    expect(res.best?.arrivalTime).toBe("2025-01-01T00:30:00.000Z");
  });

  it("도보 정보가 없는 Route는 도보 옵션을 만들지 않는다", async () => {
    const { walkToDestination: _unused, ...noWalk } = route;
    const res = await recommend({
      ...base,
      routes: [noWalk],
      arrivalDeadline: new Date("2025-01-01T00:40:00Z"),
    });
    expect(res.options).toHaveLength(3);
    expect(res.options.some((o) => o.kind === "walk")).toBe(false);
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

  it("estimateTaxi가 code NO_ROUTE로 실패한 Stop은 후보에서만 빠진다", async () => {
    const noRouteAtB: TaxiEstimator = async (from, to) => {
      if (from.x === 1) throw Object.assign(new Error("택시 경로를 찾을 수 없습니다."), { code: "NO_ROUTE" });
      return taxi(from, to);
    };
    const res = await recommend({ ...base, arrivalDeadline: deadline, estimateTaxi: noRouteAtB });
    expect(res.options.map((o) => o.stopName)).toEqual(["A", "C", "C"]);
    expect(res.best?.stopName).toBe("C");
  });

  it("estimateTaxi가 code UPSTREAM으로 실패하면 recommend가 reject된다", async () => {
    const upstream: TaxiEstimator = async () => {
      throw Object.assign(new Error("카카오 장애"), { code: "UPSTREAM" });
    };
    await expect(
      recommend({ ...base, arrivalDeadline: deadline, estimateTaxi: upstream }),
    ).rejects.toThrow("카카오 장애");
  });
});

