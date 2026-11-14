import { describe, expect, it } from "vitest";
import type { Route } from "@/shared/types";
import { buildSubwayOnlyPlan } from "./subwayOnly";

const route: Route = {
  id: "r1",
  fare: 1550,
  totalMin: 30,
  stops: [
    { name: "신촌", x: 0, y: 0, elapsedMin: 0, mode: "subway" },
    { name: "이대", x: 0, y: 0, elapsedMin: 2, mode: "subway", line: "2호선" },
    { name: "아현", x: 0, y: 0, elapsedMin: 4, mode: "subway", line: "2호선" },
    { name: "충정로", x: 0, y: 0, elapsedMin: 7, mode: "subway", line: "2호선" },
    { name: "서대문", x: 0, y: 0, elapsedMin: 10, mode: "subway", line: "5호선" },
    { name: "광화문", x: 0, y: 0, elapsedMin: 12, mode: "subway", line: "5호선" },
  ],
};
const DEPARTURE = "2026-11-14T07:00:00.000Z";

describe("buildSubwayOnlyPlan", () => {
  it("호선이 바뀌는 곳에서 구간을 나누고 역 수를 센다", () => {
    const plan = buildSubwayOnlyPlan(route, DEPARTURE, "2026-11-14T08:00:00.000Z");
    expect(plan?.legs).toEqual([
      { line: "2호선", fromName: "신촌", toName: "충정로", stationCount: 3, startMin: 0, endMin: 7 },
      { line: "5호선", fromName: "충정로", toName: "광화문", stationCount: 2, startMin: 7, endMin: 12 },
    ]);
    expect(plan?.transferCount).toBe(1);
  });

  it("도착 시각과 여유를 totalMin 기준으로 계산한다", () => {
    const plan = buildSubwayOnlyPlan(route, DEPARTURE, "2026-11-14T07:35:00.000Z");
    expect(plan?.arrivalTime).toBe("2026-11-14T07:30:00.000Z");
    expect(plan?.marginMin).toBe(5);
    expect(plan?.onTime).toBe(true);
  });

  it("희망 시각을 넘기면 지각으로 본다", () => {
    const plan = buildSubwayOnlyPlan(route, DEPARTURE, "2026-11-14T07:20:00.000Z");
    expect(plan?.marginMin).toBe(-10);
    expect(plan?.onTime).toBe(false);
  });

  it("totalMin이 없으면 마지막 정류장의 누적 시간을 쓴다", () => {
    const plan = buildSubwayOnlyPlan({ ...route, totalMin: undefined }, DEPARTURE, DEPARTURE);
    expect(plan?.totalMin).toBe(12);
  });

  it("경로나 출발 시각이 없으면 null", () => {
    expect(buildSubwayOnlyPlan(undefined, DEPARTURE, DEPARTURE)).toBeNull();
    expect(buildSubwayOnlyPlan({ ...route, stops: route.stops.slice(0, 1) }, DEPARTURE, DEPARTURE)).toBeNull();
    expect(buildSubwayOnlyPlan(route, undefined, DEPARTURE)).toBeNull();
  });
});
