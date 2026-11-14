import { z } from "zod";
import type { Coordinate, Route } from "@/shared/types";
import { buildRoute, type TransitLeg } from "./build-route";
import { TransitError } from "./errors";
import { truncateAtNearest } from "./walk";

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
type Leg = Itinerary["legs"][number];

/** 앞부분에 넣을 수 있는 구간인지: 도보 또는 1~9호선 지하철 */
function isAllowedLeg(leg: Leg): boolean {
  return leg.mode === "WALK" || (leg.mode === "SUBWAY" && isSeoulLine1to9(leg.route));
}

/** 검색 시각에 운행하는 구간인지(service가 없으면 운행으로 본다) */
function isRunning(leg: Leg): boolean {
  return leg.mode !== "SUBWAY" || leg.service === undefined || leg.service === 1;
}

/**
 * 경로 앞에서부터 도보·1~9호선 지하철만 이어지는 구간을 꺼낸다(design.md D5).
 * - complete: 경로 전체가 해당하면 true
 * - 경로 중간에서 끊기면 끝의 도보(버스 정류장 등으로 가는 길)는 버린다
 */
function allowedPrefix(it: Itinerary): { legs: Leg[]; complete: boolean } {
  const cut = it.legs.findIndex((leg) => !isAllowedLeg(leg));
  if (cut === -1) return { legs: it.legs, complete: true };
  const legs = it.legs.slice(0, cut);
  while (legs.length > 0 && legs[legs.length - 1].mode === "WALK") legs.pop();
  return { legs, complete: false };
}

function toLegs(legs: Leg[]): TransitLeg[] {
  return legs.map((leg): TransitLeg => {
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
  /** 목적지. 경로를 자를 때 가장 가까운 역을 고르고 도보를 추정하는 데 쓴다 */
  destination: Coordinate;
}

/**
 * TMAP 응답을 1~9호선 지하철+도보 경로 후보로 바꾼다(domain-rules.md, design.md D5).
 * 1. 경로 전체가 도보·1~9호선이면 완전 경로(도착 도보는 TMAP 실제 값)
 * 2. 버스·다른 노선이 섞이면 앞의 1~9호선 구간을 목적지에 가장 가까운 역에서 끊는다(도착 도보는 추정)
 * 3. 앞부분에 지하철이 없거나, 앞부분 지하철이 검색 시각에 운행하지 않으면(service 0) 버린다
 * 후보는 totalMin(택시 없이 목적지까지) 오름차순으로 정렬하고 같은 역 순서는 하나만 남긴다.
 * TMAP은 searchDttm에 따라 경로와 소요시간을 바꾸지 않고 운행 여부만 알려 준다(2026-11-14 확인).
 * 후보가 없으면 NO_ROUTE를 던진다.
 */
export function parseTmapRoutes(body: unknown, options: ParseOptions): Route[] {
  failFromError(body);

  const parsed = successSchema.safeParse(body);
  if (!parsed.success) {
    throw new TransitError("UPSTREAM", "TMAP 대중교통 응답 형식이 올바르지 않습니다.");
  }

  const departureTime = options.departureAt.toISOString();
  const candidates: Route[] = [];
  let notRunning = 0;

  for (const it of parsed.data.metaData.plan.itineraries) {
    const prefix = allowedPrefix(it);
    if (!prefix.legs.some((leg) => leg.mode === "SUBWAY")) continue;
    if (!prefix.legs.every(isRunning)) {
      notRunning += 1;
      continue;
    }
    const built = buildRoute(toLegs(prefix.legs), {
      id: "tmap",
      fare: prefix.complete ? it.fare.regular.totalFare : undefined,
      totalMin: prefix.complete ? Math.round((it.totalTime / 60) * 10) / 10 : undefined,
      timeAware: true,
      departureTime,
    });
    if (!built) continue;
    candidates.push(prefix.complete ? built : truncateAtNearest(built, options.destination));
  }

  if (candidates.length === 0) {
    throw new TransitError(
      "NO_ROUTE",
      notRunning > 0
        ? "출발 시각에 운행하는 지하철 경로가 없습니다(첫차 전 또는 막차 후)."
        : "1~9호선으로 갈 수 있는 지하철 경로를 찾을 수 없습니다.",
    );
  }

  const seen = new Set<string>();
  return candidates
    .map((route, order) => ({ route, order }))
    .sort((a, b) => (a.route.totalMin ?? 0) - (b.route.totalMin ?? 0) || a.order - b.order)
    .map(({ route }) => route)
    .filter((route) => {
      const key = route.stops.map((s) => s.name).join(">");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, options.maxRoutes)
    .map((route, i) => ({ ...route, id: `tmap-${i}` }));
}
