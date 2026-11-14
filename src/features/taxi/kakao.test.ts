import { describe, expect, it } from "vitest";
import { TaxiError } from "./errors";
import { parseKakaoRoute } from "./kakao";

function codeOf(body: unknown) {
  try {
    parseKakaoRoute(body);
  } catch (error) {
    return error instanceof TaxiError ? error.code : "OTHER";
  }
  return undefined;
}

describe("parseKakaoRoute", () => {
  it("거리, 시간, 도로 구간을 꺼낸다(요금은 무시)", () => {
    const body = {
      routes: [
        {
          result_code: 0,
          result_msg: "길찾기 성공",
          summary: { distance: 1500, duration: 300, fare: { taxi: 17000, toll: 0 } },
          sections: [
            {
              roads: [
                { name: "A", distance: 1000, duration: 100, traffic_speed: 36, vertexes: [] },
                { name: "B", distance: 500, duration: 200, traffic_speed: 9, vertexes: [] },
              ],
            },
          ],
        },
      ],
    };
    expect(parseKakaoRoute(body)).toEqual({
      distanceM: 1500,
      durationSec: 300,
      roads: [
        { distanceM: 1000, durationSec: 100 },
        { distanceM: 500, durationSec: 200 },
      ],
    });
  });

  it("sections가 없으면 roads는 빈 배열", () => {
    const body = { routes: [{ result_code: 0, summary: { distance: 10, duration: 5 } }] };
    expect(parseKakaoRoute(body).roads).toEqual([]);
  });

  it("result_code가 0이 아니면 NO_ROUTE, 형식이 다르면 UPSTREAM", () => {
    expect(codeOf({ routes: [{ result_code: 104, result_msg: "너무 가까움" }] })).toBe("NO_ROUTE");
    expect(codeOf({ unexpected: true })).toBe("UPSTREAM");
  });
});
