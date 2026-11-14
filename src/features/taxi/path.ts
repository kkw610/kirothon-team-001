import { MemoryCache } from "@/shared/cache";
import { requireEnv } from "@/shared/env";
import type { Coordinate, TaxiPath } from "@/shared/types";
import { TaxiError } from "./errors";
import { parseTaxiPath } from "./path-geometry";

const DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/directions";
const TIMEOUT_MS = 5000;

/** 성공한 도로 경로만 저장한다. 직선 대체는 저장하지 않아 일시 오류가 캐시 시간만큼 고정되지 않는다. */
const cache = new MemoryCache<Coordinate[]>(10 * 60 * 1000, 200);

/** 캐시 키가 같아지도록 좌표를 소수 5자리(약 1m)로 맞춘다. */
function point(c: Coordinate): string {
  return `${c.x.toFixed(5)},${c.y.toFixed(5)}`;
}

async function fetchPath(from: Coordinate, to: Coordinate): Promise<Coordinate[]> {
  const url = new URL(DIRECTIONS_URL);
  url.searchParams.set("origin", point(from));
  url.searchParams.set("destination", point(to));
  url.searchParams.set("priority", "RECOMMEND");
  // 도로 모양(vertexes)은 summary=false일 때만 내려온다.
  url.searchParams.set("summary", "false");
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${requireEnv("KAKAO_REST_API_KEY")}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new TaxiError("UPSTREAM", "카카오모빌리티 API에 연결하지 못했습니다.");
  }
  if (!response.ok) {
    throw new TaxiError("UPSTREAM", `카카오모빌리티 API 오류(HTTP ${response.status})`);
  }
  const body = await response.json().catch(() => {
    throw new TaxiError("UPSTREAM", "카카오모빌리티 응답을 읽지 못했습니다.");
  });
  return parseTaxiPath(body);
}

/**
 * 환승역에서 목적지까지 택시 도로 경로를 구한다(지도에 그리기 위한 좌표 배열).
 * 호출 실패, 타임아웃, 경로 없음이면 [출발, 도착] 직선과 fallback: true를 돌려준다. 예외를 던지지 않는다.
 */
export async function getTaxiPath(from: Coordinate, to: Coordinate): Promise<TaxiPath> {
  const key = `${point(from)}->${point(to)}`;
  const cached = cache.get(key);
  if (cached) return { path: cached, fallback: false };
  try {
    const path = await fetchPath(from, to);
    cache.set(key, path);
    return { path, fallback: false };
  } catch (error) {
    console.warn("taxi path fallback:", error instanceof Error ? error.message : "unknown");
    return { path: [from, to], fallback: true };
  }
}
