import { describe, expect, it } from "vitest";
import { TaxiError } from "./errors";
import { parseTaxiPath, thinPath, vertexesToPath } from "./path-geometry";

const pt = (i: number) => ({ x: i, y: i * 2 });

describe("vertexesToPath", () => {
  it("x, y 쌍을 좌표로 바꾼다", () => {
    expect(vertexesToPath([1, 2, 3, 4])).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
  });
  it("홀수 길이면 마지막 값을 버린다", () => {
    expect(vertexesToPath([1, 2, 3])).toEqual([{ x: 1, y: 2 }]);
  });
});

describe("thinPath", () => {
  it("max 이하이면 그대로", () => {
    const path = [pt(0), pt(1), pt(2)];
    expect(thinPath(path, 5)).toBe(path);
  });
  it("max개로 줄이고 첫 점과 마지막 점을 남긴다", () => {
    const path = Array.from({ length: 1001 }, (_, i) => pt(i));
    const thin = thinPath(path, 500);
    expect(thin).toHaveLength(500);
    expect(thin[0]).toEqual(pt(0));
    expect(thin.at(-1)).toEqual(pt(1000));
  });
  it("원래 순서를 유지한다", () => {
    const path = Array.from({ length: 77 }, (_, i) => pt(i));
    const xs = thinPath(path, 10).map((p) => p.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });
});

describe("parseTaxiPath", () => {
  const body = (sections: unknown, code = 0) => ({ routes: [{ result_code: code, sections }] });

  it("여러 도로의 vertexes를 이어 붙이고 겹치는 점을 지운다", () => {
    const path = parseTaxiPath(
      body([{ roads: [{ vertexes: [1, 1, 2, 2] }, { vertexes: [2, 2, 3, 3] }] }, { roads: [{ vertexes: [3, 3, 4, 4] }] }]),
    );
    expect(path).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
    ]);
  });

  it("result_code가 0이 아니면 NO_ROUTE", () => {
    expect(() => parseTaxiPath(body([], 104))).toThrowError(expect.objectContaining({ code: "NO_ROUTE" }));
  });

  it("점이 2개 미만이면 NO_ROUTE", () => {
    expect(() => parseTaxiPath(body([{ roads: [{ vertexes: [1, 1] }] }]))).toThrow(TaxiError);
  });

  it("응답 형식이 다르면 UPSTREAM", () => {
    expect(() => parseTaxiPath({ foo: 1 })).toThrowError(expect.objectContaining({ code: "UPSTREAM" }));
  });
});
