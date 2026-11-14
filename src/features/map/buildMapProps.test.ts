import { describe, expect, it } from "vitest";
import type { Option, Place, RecommendResponse, Route } from "@/shared/types";
import { buildMapProps } from "./buildMapProps";

const origin: Place = { name: "신촌역", x: 126.93, y: 37.55 };
const destination: Place = { name: "강남역", x: 127.02, y: 37.49 };

const route: Route = {
  id: "r1",
  fare: 1550,
  stops: [
    { name: "A", x: 1, y: 1, elapsedMin: 0, mode: "subway" },
    { name: "B", x: 2, y: 2, elapsedMin: 5, mode: "subway" },
    { name: "C", x: 3, y: 3, elapsedMin: 10, mode: "subway" },
  ],
};

function option(stopName: string, stopCoord: { x: number; y: number }, arrivalTime: string): Option {
  return {
    routeId: "r1",
    stopName,
    stopCoord,
    departureTime: "2025-01-01T00:00:00Z",
    arrivalTime,
    onTime: false,
    subwayMin: 0,
    taxiWaitMin: 5,
    taxiMin: 0,
    taxiDistanceM: 0,
    subwayFare: 0,
    taxiFare: 0,
    totalCost: 0,
  };
}

const optB = option("B", { x: 2, y: 2 }, "2025-01-01T00:40:00Z");
const optC = option("C", { x: 3, y: 3 }, "2025-01-01T00:30:00Z");

describe("buildMapProps", () => {
  it("추천 옵션이 있으면 그 옵션의 환승 정류장까지 지하철 좌표를 자른다", () => {
    const res: RecommendResponse = { best: optB, options: [optB, optC], routes: [route] };
    const props = buildMapProps(res, origin, destination);
    expect(props?.option).toBe(optB);
    expect(props?.subwayPath).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ]);
  });

  it("추천이 없으면 도착이 가장 이른 옵션을 쓴다", () => {
    const res: RecommendResponse = { best: null, options: [optB, optC], routes: [route] };
    expect(buildMapProps(res, origin, destination)?.option).toBe(optC);
  });

  it("마커는 출발, 환승, 도착 순서다", () => {
    const res: RecommendResponse = { best: optB, options: [optB], routes: [route] };
    const markers = buildMapProps(res, origin, destination)?.markers;
    expect(markers?.map((m) => m.kind)).toEqual(["origin", "transfer", "destination"]);
    expect(markers?.[1]).toEqual({ kind: "transfer", name: "B", at: { x: 2, y: 2 } });
    expect(markers?.[0].at).toEqual({ x: origin.x, y: origin.y });
  });

  it("옵션이 없으면 null", () => {
    expect(buildMapProps({ best: null, options: [], routes: [route] }, origin, destination)).toBeNull();
  });

  it("경로나 정류장을 못 찾으면 지하철 선은 빈 배열", () => {
    const res: RecommendResponse = { best: optB, options: [optB], routes: [] };
    expect(buildMapProps(res, origin, destination)?.subwayPath).toEqual([]);
    const ghost = option("Z", { x: 9, y: 9 }, "2025-01-01T00:40:00Z");
    expect(buildMapProps({ best: ghost, options: [ghost], routes: [route] }, origin, destination)?.subwayPath).toEqual([]);
  });

  it("첫 정류장에서 바로 택시를 타면 지하철 좌표는 한 점", () => {
    const first = option("A", { x: 1, y: 1 }, "2025-01-01T00:30:00Z");
    const res: RecommendResponse = { best: first, options: [first], routes: [route] };
    expect(buildMapProps(res, origin, destination)?.subwayPath).toEqual([{ x: 1, y: 1 }]);
  });
});
