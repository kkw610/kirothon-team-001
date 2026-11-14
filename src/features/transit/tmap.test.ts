import { describe, expect, it } from "vitest";
import { TransitError } from "./errors";
import fixture from "./__fixtures__/tmap-sinchon-coex-20261114-1601.json";
import fixtureNight from "./__fixtures__/tmap-sinchon-coex-20261115-0130.json";
import { isSeoulLine1to9, parseTmapRoutes } from "./tmap";

const st = (index: number, stationName: string, lon: string) => ({ index, stationName, lon, lat: "37.5" });
const walk = (sec: number) => ({ mode: "WALK", sectionTime: sec, distance: 100 });
const subway = (route: string, sec: number, distance: number, stations: ReturnType<typeof st>[]) => ({
  mode: "SUBWAY",
  sectionTime: sec,
  distance,
  route,
  passStopList: { stations },
});

/** 응답 순서: 버스 포함, 신분당선 포함, 1~9호선 경로 A(환승 1회), 1~9호선 경로 B(직통) */
function sample() {
  return {
    metaData: {
      plan: {
        itineraries: [
          { totalTime: 1200, fare: { regular: { totalFare: 1500 } }, legs: [walk(60), { mode: "BUS", sectionTime: 900, route: "간선:146" }, walk(60)] },
          { totalTime: 1000, fare: { regular: { totalFare: 2400 } }, legs: [walk(60), subway("신분당선", 600, 9000, [st(0, "강남", "127.02"), st(1, "양재", "127.03")]), walk(60)] },
          {
            totalTime: "960",
            fare: { regular: { totalFare: "1650" } },
            legs: [
              walk(180),
              subway("수도권2호선", 360, 2000, [st(2, "C", "127.02"), st(0, "A", "127.00"), st(1, "B", "127.01")]),
              walk(120),
              subway("수도권3호선", 240, 12000, [st(0, "C", "127.02"), st(1, "D", "127.03")]),
              walk(60),
            ],
          },
          {
            totalTime: 1080,
            fare: { regular: { totalFare: 1550 } },
            legs: [walk(120), subway("수도권9호선(급행)", 900, 8000, [st(0, "E", "127.00"), st(1, "F", "127.05")]), walk(60)],
          },
        ],
      },
    },
  };
}

const departureAt = new Date("2026-11-14T17:00:00+09:00");
/** 샘플 목적지: D역(127.03) 근처 */
const destination = { x: 127.031, y: 37.5 };
const opts = (maxRoutes: number) => ({ maxRoutes, departureAt, destination });

function codeOf(body: unknown) {
  try {
    parseTmapRoutes(body, opts(1));
  } catch (error) {
    return error instanceof TransitError ? error.code : "OTHER";
  }
  return undefined;
}

describe("parseTmapRoutes", () => {
  it("버스로 시작하거나 1~9호선 앞부분이 없는 경로는 버리고, 택시 없이 가장 빠른 경로를 고른다", () => {
    const [route] = parseTmapRoutes(sample(), opts(1));
    expect(route).toMatchObject({ id: "tmap-0", fare: 1650, totalMin: 16, transferCount: 1, timeAware: true });
    expect(route.truncated).toBeUndefined();
    expect(route.departureTime).toBe(departureAt.toISOString());
    expect(route.stops.map((s) => [s.name, s.elapsedMin, s.line, s.distanceM, s.fare])).toEqual([
      ["A", 3, "수도권2호선", 0, 0],
      ["B", 6, "수도권2호선", 1000, 1550],
      ["C", 9, "수도권2호선", 2000, 1550],
      ["D", 15, "수도권3호선", 14000, 1650],
    ]);
  });

  it("maxRoutes만큼 대체 경로를 totalMin 순으로 붙인다", () => {
    const routes = parseTmapRoutes(sample(), opts(3));
    expect(routes.map((r) => [r.id, r.fare, r.stops.length])).toEqual([
      ["tmap-0", 1650, 4],
      ["tmap-1", 1550, 2],
    ]);
    expect(routes[1].stops[0]).toMatchObject({ name: "E", x: 127, y: 37.5, mode: "subway", line: "수도권9호선(급행)" });
  });

  it("passStopList.stationList 형식도 받는다", () => {
    const body = sample();
    const leg = body.metaData.plan.itineraries[3].legs[1] as { passStopList?: Record<string, unknown> };
    leg.passStopList = { stationList: leg.passStopList?.stations };
    expect(parseTmapRoutes(body, opts(3))[1].stops).toHaveLength(2);
  });

  it("조건을 만족하는 경로가 없으면 NO_ROUTE", () => {
    const body = sample();
    body.metaData.plan.itineraries = body.metaData.plan.itineraries.slice(0, 2);
    expect(codeOf(body)).toBe("NO_ROUTE");
  });

  it("버스가 섞이면 앞의 1~9호선 구간을 목적지에 가장 가까운 역에서 끊고 나머지는 도보로 추정한다", () => {
    const body = {
      metaData: {
        plan: {
          itineraries: [
            {
              totalTime: 2000,
              fare: { regular: { totalFare: 2900 } },
              legs: [
                walk(120),
                // 2호선 A → B → C → D, 목적지는 D(127.03) 근처
                subway("수도권2호선", 600, 3000, [st(0, "A", "127.00"), st(1, "B", "127.01"), st(2, "C", "127.02"), st(3, "D", "127.03"), st(4, "E", "127.04")]),
                walk(90),
                { mode: "BUS", sectionTime: 900, route: "간선:472" },
                walk(60),
              ],
            },
          ],
        },
      },
    };
    const [r] = parseTmapRoutes(body, opts(1));
    expect(r.truncated).toBe(true);
    expect(r.stops.map((s) => s.name)).toEqual(["A", "B", "C", "D"]);
    expect(r.walkToDestination?.estimated).toBe(true);
    expect(r.walkToDestination!.distanceM).toBeLessThan(200);
    // 요금은 버스 포함 요금(2900)이 아니라 D까지 거리비례 운임
    expect(r.fare).toBe(r.stops.at(-1)!.fare);
    expect(r.fare).toBe(1550);
    expect(r.totalMin).toBe(Math.round((r.stops.at(-1)!.elapsedMin + r.walkToDestination!.minutes) * 10) / 10);
  });

  it("같은 역 순서의 후보는 하나만 남긴다", () => {
    const body = sample();
    body.metaData.plan.itineraries.push(structuredClone(body.metaData.plan.itineraries[3]));
    expect(parseTmapRoutes(body, opts(3))).toHaveLength(2);
  });

  it("result.status 11~14는 NO_ROUTE, 그 밖의 status와 error 객체는 UPSTREAM", () => {
    expect(codeOf({ result: { status: 11, message: "출발지/도착지 간 거리가 가까움" } })).toBe("NO_ROUTE");
    expect(codeOf({ result: { status: 14, message: "탐색 결과 없음" } })).toBe("NO_ROUTE");
    expect(codeOf({ result: { status: 99, message: "기타" } })).toBe("UPSTREAM");
    expect(codeOf({ error: { id: "401", code: "INVALID_API_KEY", message: "invalid" } })).toBe("UPSTREAM");
    expect(codeOf({ unexpected: true })).toBe("UPSTREAM");
  });
});

describe("parseTmapRoutes 실제 응답 (신촌역 → 코엑스, 2026-11-14 16:01)", () => {
  const at = new Date("2026-11-14T16:01:00+09:00");

  const coex = { x: 127.0588, y: 37.5116 };

  it("택시 없이 가장 빠른 2호선 → 9호선(급행) 완전 경로가 1위, 버스 섞인 경로는 잘라서 뒤에 붙는다", () => {
    const routes = parseTmapRoutes(fixture, { maxRoutes: 3, departureAt: at, destination: coex });
    expect(routes).toHaveLength(3);
    expect(routes.map((x) => x.truncated ?? false)).toEqual([false, true, true]);
    // 2호선 → 3호선 → 버스(강남08) 경로는 압구정에서 끊긴다
    expect(routes[1].stops.at(-1)?.name).toBe("압구정");
    expect(routes.map((x) => x.totalMin)).toEqual([...routes.map((x) => x.totalMin!)].sort((a, b) => a - b));
    const [r] = routes;
    expect(r).toMatchObject({ fare: 1750, totalMin: 44.4, transferCount: 1, timeAware: true });
    expect(r.stops.map((s) => s.name)).toEqual([
      "신촌", "홍대입구", "합정", "당산", "여의도", "노량진", "동작", "고속터미널", "신논현", "선정릉", "봉은사",
    ]);
    expect(r.stops.map((s) => s.line)).toEqual([
      ...Array(4).fill("수도권2호선"),
      ...Array(7).fill("수도권9호선(급행)"),
    ]);
  });

  it("역별 시간·거리·요금이 단조 증가하고 끝값이 경로 값과 맞는다", () => {
    const [r] = parseTmapRoutes(fixture, { maxRoutes: 1, departureAt: at, destination: coex });
    const first = r.stops[0];
    const last = r.stops.at(-1)!;
    expect(first).toMatchObject({ elapsedMin: 2.2, distanceM: 0, fare: 0 }); // 도보 132초
    // 도보 132 + 2호선 477 + 환승 도보 167 + 9호선 1394 = 2170초
    expect(last.elapsedMin).toBe(36.2);
    expect(last.distanceM).toBe(4471 + 15794);
    expect(last.fare).toBe(1750);
    // 도보: 출발지 → 신촌 138m 132초, 봉은사 → 코엑스 551m 494초
    expect(r.walkFromOrigin).toEqual({ distanceM: 138, minutes: 2.2 });
    expect(r.walkToDestination).toEqual({ distanceM: 551, minutes: 8.2 });
    // 택시 없이 지하철+도보로 가는 시간 = 마지막 역 도착 + 도착 도보 = totalMin
    expect(Math.round((last.elapsedMin + r.walkToDestination!.minutes) * 10) / 10).toBe(r.totalMin);
    for (let i = 1; i < r.stops.length; i += 1) {
      expect(r.stops[i].elapsedMin).toBeGreaterThanOrEqual(r.stops[i - 1].elapsedMin);
      expect(r.stops[i].distanceM!).toBeGreaterThanOrEqual(r.stops[i - 1].distanceM!);
      expect(r.stops[i].fare!).toBeGreaterThanOrEqual(r.stops[i - 1].fare!);
    }
  });
});

describe("출발 시각 반영 (실제 응답)", () => {
  it("막차 후(01:30)에는 잘라 쓸 앞부분 지하철도 service 0이라 NO_ROUTE", () => {
    try {
      parseTmapRoutes(fixtureNight, {
        maxRoutes: 1,
        departureAt: new Date("2026-11-15T01:30:00+09:00"),
        destination: { x: 127.0588, y: 37.5116 },
      });
      throw new Error("던져지지 않음");
    } catch (error) {
      expect(error).toBeInstanceOf(TransitError);
      expect((error as TransitError).code).toBe("NO_ROUTE");
      expect((error as TransitError).message).toContain("운행");
    }
  });

  it("운행하지 않는 구간이 있는 경로는 건너뛴다", () => {
    const body = sample();
    const its = body.metaData.plan.itineraries as Array<{ legs: Array<Record<string, unknown>> }>;
    its[2].legs[1].service = 0;
    const routes = parseTmapRoutes(body, opts(3));
    expect(routes.map((r) => r.fare)).toEqual([1550]);
  });
});

describe("isSeoulLine1to9", () => {
  it("1~9호선(급행 포함)만 true", () => {
    expect(isSeoulLine1to9("수도권1호선")).toBe(true);
    expect(isSeoulLine1to9("수도권 2호선")).toBe(true);
    expect(isSeoulLine1to9("수도권9호선(급행)")).toBe(true);
    expect(isSeoulLine1to9("9호선")).toBe(true);
    expect(isSeoulLine1to9("신분당선")).toBe(false);
    expect(isSeoulLine1to9("수도권 경의중앙선")).toBe(false);
    expect(isSeoulLine1to9("인천1호선")).toBe(false);
    expect(isSeoulLine1to9(undefined)).toBe(false);
  });
});
