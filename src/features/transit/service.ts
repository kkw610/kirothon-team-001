import { MemoryCache } from "@/shared/cache";
import { requireEnv } from "@/shared/env";
import { toKstStamp } from "@/shared/time";
import type { Place, Route } from "@/shared/types";
import { TransitError } from "./errors";
import { parseTmapRoutes } from "./tmap";

const TMAP_TRANSIT_URL = "https://apis.openapi.sk.com/transit/routes";
const TIMEOUT_MS = 5000;
/** 대체 경로를 포함해 돌려줄 수 있는 최대 경로 수 */
export const MAX_ROUTES = 3;
/** 1~9호선·지하철 전용으로 거르기 전에 TMAP에 요청하는 경로 수 */
const REQUEST_COUNT = 10;

/**
 * TMAP 무료 한도가 일 10건이라 같은 구간은 출발 시각 10분 단위로 묶어 캐시한다.
 * TMAP은 출발 시각에 따라 경로와 시간을 바꾸지 않고 운행 여부만 주므로(design.md D1),
 * 10분 안의 차이는 첫차·막차 경계에서만 영향이 있다.
 */
export const CACHE_BUCKET_MIN = 10;
/** 응답 전체(최대 MAX_ROUTES개)를 캐시하고 maxRoutes로 잘라서 돌려준다. */
const cache = new MemoryCache<Route[]>(CACHE_BUCKET_MIN * 60 * 1000);

export interface TransitOptions {
  /** 돌려줄 경로 수(1~3). 기본 1(domain-rules.md: 경로 1개). 2 이상이면 routes[0] 뒤에 대체 경로 */
  maxRoutes?: number;
}

async function fetchTmap(origin: Place, destination: Place, searchDttm: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(TMAP_TRANSIT_URL, {
      method: "POST",
      headers: {
        appKey: requireEnv("TRANSIT_API_KEY"),
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        startX: String(origin.x),
        startY: String(origin.y),
        endX: String(destination.x),
        endY: String(destination.y),
        lang: 0,
        format: "json",
        count: REQUEST_COUNT,
        searchDttm,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new TransitError("UPSTREAM", "TMAP 대중교통 API에 연결하지 못했습니다.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new TransitError("UPSTREAM", `TMAP 대중교통 키 인증 실패(HTTP ${response.status})`);
  }
  if (response.status === 429) {
    throw new TransitError("UPSTREAM", "TMAP 대중교통 호출 한도를 넘었습니다(HTTP 429).");
  }
  // 경로 없음(status 11~14)도 본문으로 판단해야 하므로 4xx 본문은 파서에 넘긴다.
  const body = await response.json().catch(() => undefined);
  if (body === undefined) {
    throw new TransitError("UPSTREAM", `TMAP 대중교통 응답을 읽지 못했습니다(HTTP ${response.status}).`);
  }
  return body;
}

/**
 * 출발지에서 목적지까지 수도권 1~9호선 지하철 경로를 출발 시각 기준으로 찾는다(TMAP 대중교통).
 * routes[0]이 추천 경로이고, maxRoutes가 2 이상이면 대체 경로가 뒤에 붙는다.
 * 같은 출발지, 목적지, 출발 시각(10분 단위)은 10분간 캐시한다. 실패는 TransitError로 던진다.
 */
export async function getTransitRoutes(
  origin: Place,
  destination: Place,
  departureAt: Date = new Date(),
  options: TransitOptions = {},
): Promise<Route[]> {
  const maxRoutes = Math.min(Math.max(1, Math.floor(options.maxRoutes ?? 1)), MAX_ROUTES);
  const searchDttm = toKstStamp(departureAt);
  const bucketMs = CACHE_BUCKET_MIN * 60_000;
  const bucket = toKstStamp(new Date(Math.floor(departureAt.getTime() / bucketMs) * bucketMs));
  const key = `${origin.x},${origin.y}->${destination.x},${destination.y}@${bucket}`;
  const routes = await cache.getOrLoad(key, async () =>
    parseTmapRoutes(await fetchTmap(origin, destination, searchDttm), {
      maxRoutes: MAX_ROUTES,
      departureAt,
    }),
  );
  return routes.slice(0, maxRoutes);
}
