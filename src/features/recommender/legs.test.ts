import { describe, expect, it } from "vitest";
import type { Stop } from "@/shared/types";
import { buildLegs } from "./legs";

const stop = (name: string, elapsedMin: number, line?: string): Stop => ({
  name,
  x: 0,
  y: 0,
  elapsedMin,
  mode: "subway",
  line,
});

const stops = [
  stop("이대", 0),
  stop("신촌", 2, "2호선"),
  stop("당산", 10, "2호선"),
  stop("선유도", 12, "9호선"),
  stop("봉은사", 44, "9호선"),
];

describe("buildLegs", () => {
  it("환승역에서 호선별로 구간을 나눈다", () => {
    expect(buildLegs(stops, 4)).toEqual([
      { line: "2호선", fromName: "이대", toName: "당산", startMin: 0, endMin: 10 },
      { line: "9호선", fromName: "당산", toName: "봉은사", startMin: 10, endMin: 44 },
    ]);
  });

  it("환승 전 정류장까지만 타면 한 구간이다", () => {
    expect(buildLegs(stops, 2)).toHaveLength(1);
  });

  it("출발 정류장이거나 호선 정보가 없으면 빈 배열이다", () => {
    expect(buildLegs(stops, 0)).toEqual([]);
    expect(buildLegs([stop("A", 0), stop("B", 3)], 1)).toEqual([]);
  });
});
