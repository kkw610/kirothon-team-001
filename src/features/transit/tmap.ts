import { z } from "zod";
import type { Route } from "@/shared/types";
import { buildRoute, type TransitLeg } from "./build-route";
import { TransitError } from "./errors";

/**
 * TMAP 대중교통(POST /transit/routes) 응답 중 사용하는 부분만 정의한다.
 * 숫자와 좌표는 문자열로 올 수 있어 coerce하고, 모르는 필드는 무시한다.
 */
const stationSchema = z.object({
  index: z.coerce.number().optional(),
  stationName: z.string(),
  lon: z.coerce.number(),
  lat: z.coerce.number(),
});

const legSchema = z.object({
  /** WALK, SUBWAY, BUS, EXPRESSBUS, TRAIN, AIRPLANE, FERRY 등 */
  mode: z.string(),
  /** 구간 소요시간(초) */
  sectionTime: z.coerce.number(),
  /** 구간 거리(m) */
  distance: z.coerce.number().optional(),
  /** 노선명. 예: "수도권2호선" */
  route: z.string().optional(),
  /** searchDttm 시각에 운행하는지. 1 운행, 0 미운행(첫차 전, 막차 후). 없으면 운행으로 본다 */
  service: z.coerce.number().optional(),
  /** 실제 응답은 stations(2026-11-14 확인). 문서 예시에 따라 stationList도 받는다 */
  passStopList: z
    .object({
      stations: z.array(stationSchema).optional(),
      stationList: z.array(stationSchema).optional(),
    })
    .optional(),
});

const itinerarySchema = z.object({
  /** 총 소요시간(초) */
  totalTime: z.coerce.number(),
  fare: z.object({ regular: z.object({ totalFare: z.coerce.number() }) }),
  legs: z.array(legSchema),
});

const successSchema = z.object({
  metaData: z.object({ plan: z.object({ itineraries: z.array(itinerarySchema) }) }),
});

/** 탐색 결과가 없는 정상 상황. 11 출발지·도착지가 가까움, 12 출발지 정류장 없음, 13 도착지 정류장 없음, 14 결과 없음 */
const NO_ROUTE_STATUS = new Set([11, 12, 13, 14]);

const statusSchema = z.object({
  result: z.object({ status: z.coerce.number(), message: z.string().optional() }),
});
const errorSchema = z.object({
  error: z.object({ code: z.coerce.string().optional(), message: z.string().optional() }),
});

/** 수도권 1~9호선(급행 포함)인지. 예: "수도권2호선", "수도권 9호선(급행)", "9호선" */
export function isSeoulLine1to9(lineName: string | undefined): boolean {
  return lineName !== undefined && /^(수도권\s*)?[1-9]호선/.test(lineName.trim());
}

type Itinerary = z.infer<typeof itinerarySchema>;

/** 도보와 1~9호선 지하철만으로 된 경로인지 */
function isSubwayOnly1to9(it: Itinerary): boolean {
  const subway = it.legs.filter((l) => l.mode === "SUBWAY");
  return (
    subway.length > 0 &&
    it.legs.every((l) => l.mode === "WALK" || l.mode === "SUBWAY") &&
    subway.every((l) => isSeoulLine1to9(l.route))
  );
}

/** 모든 지하철 구간이 검색 시각에 운행하는지 */
function isInService(it: Itinerary): boolean {
  return it.legs.every((l) => l.mode !== "SUBWAY" || l.service === undefined || l.service === 1);
}

function toLegs(it: Itinerary): TransitLeg[] {
  return it.legs.map((leg): TransitLeg => {
    const minutes = leg.sectionTime / 60;
    if (leg.mode === "SUBWAY") {
      const stations = [...(leg.passStopList?.stations ?? leg.passStopList?.stationList ?? [])]
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
        .map((s) => ({ name: s.stationName, x: s.lon, y: s.lat }));
      return { kind: "subway", minutes, distanceM: leg.distance, line: leg.route, stations };
    }
    return { kind: leg.mode === "WALK" ? "walk" : "other", minutes, distanceM: leg.distance };
  });
}

function failFromError(body: unknown): void {
  const status = statusSchema.safeParse(body);
  if (status.success && !("metaData" in (body as object))) {
    if (NO_ROUTE_STATUS.has(status.data.result.status)) {
      console.warn(
        `[transit] TMAP 결과 없음 status=${status.data.result.status} ${status.data.result.message ?? ""}`,
      );
      throw new TransitError("NO_ROUTE", "지하철 경로를 찾을 수 없습니다.");
    }
    throw new TransitError("UPSTREAM", `TMAP 대중교통 오류(status ${status.data.result.status})`);
  }
  const error = errorSchema.safeParse(body);
  if (error.success) {
    throw new TransitError("UPSTREAM", `TMAP 대중교통 오류(${error.data.error.code ?? "unknown"})`);
  }
}

export interface ParseOptions {
  /** 돌려줄 최대 경로 수 */
  maxRoutes: number;
  /** 검색 기준 출발 시각 */
  departureAt: Date;
}

/**
 * TMAP 응답에서 1~9호선 지하철(+도보) 경로를 응답 순서대로 최대 maxRoutes개 Route로 바꾼다.
 * 첫 번째가 추천 경로다. 검색 시각에 운행하지 않는 구간(service 0)이 있는 경로는 뺀다.
 * TMAP은 searchDttm에 따라 경로와 소요시간을 바꾸지 않고 운행 여부만 알려 준다(2026-11-14 확인).
 * 조건을 만족하는 경로가 없으면 NO_ROUTE를 던진다.
 */
export function parseTmapRoutes(body: unknown, options: ParseOptions): Route[] {
  failFromError(body);

  const parsed = successSchema.safeParse(body);
  if (!parsed.success) {
    throw new TransitError("UPSTREAM", "TMAP 대중교통 응답 형식이 올바르지 않습니다.");
  }

  const departureTime = options.departureAt.toISOString();
  const candidates = parsed.data.metaData.plan.itineraries.filter(isSubwayOnly1to9);
  const running = candidates.filter(isInService);
  if (candidates.length > 0 && running.length === 0) {
    throw new TransitError("NO_ROUTE", "출발 시각에 운행하는 지하철 경로가 없습니다(첫차 전 또는 막차 후).");
  }

  const routes: Route[] = [];
  for (const it of running) {
    if (routes.length >= options.maxRoutes) break;
    const route = buildRoute(toLegs(it), {
      id: `tmap-${routes.length}`,
      fare: it.fare.regular.totalFare,
      totalMin: Math.round((it.totalTime / 60) * 10) / 10,
      timeAware: true,
      departureTime,
    });
    if (route) routes.push(route);
  }

  if (routes.length === 0) {
    // 진단용: 받은 경로마다 구간 수단과 노선을 남긴다(예: "WALK>BUS:간선:470>SUBWAY:신분당선").
    const summary = parsed.data.metaData.plan.itineraries
      .map((it) => it.legs.map((l) => (l.mode === "WALK" ? "WALK" : `${l.mode}:${l.route ?? "?"}`)).join(">"))
      .join(" | ");
    console.warn(`[transit] 1~9호선 지하철 전용 경로 없음. 받은 경로: ${summary || "(0개)"}`);
    throw new TransitError("NO_ROUTE", "지하철 경로를 찾을 수 없습니다.");
  }
  return routes;
}
