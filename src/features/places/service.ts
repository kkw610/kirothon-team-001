import { MemoryCache } from "@/shared/cache";
import { requireEnv } from "@/shared/env";
import type { Place } from "@/shared/types";
import { PlacesError } from "./errors";
import { parseKakaoPlaces } from "./kakao";

const SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const TIMEOUT_MS = 5000;
/** 자동완성 후보 수(카카오 키워드 검색은 한 페이지 최대 15개) */
const RESULT_SIZE = 10;

/** 성공한 검색만 저장된다(실패는 던져지므로 저장되지 않는다). */
const cache = new MemoryCache<Place[]>(10 * 60 * 1000);

async function fetchPlaces(query: string): Promise<Place[]> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("size", String(RESULT_SIZE));
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${requireEnv("KAKAO_REST_API_KEY")}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("환경변수")) throw error;
    throw new PlacesError("카카오 장소 검색 API에 연결하지 못했습니다.");
  }
  if (!response.ok) {
    // 403은 콘솔에서 카카오맵(로컬) 사용 설정이 꺼져 있을 때도 나온다. 응답의 message에 이유가 있다.
    const detail = await response
      .json()
      .then((body: { message?: unknown }) => (typeof body.message === "string" ? body.message.slice(0, 200) : ""))
      .catch(() => "");
    throw new PlacesError(`카카오 장소 검색 API 오류(HTTP ${response.status}) ${detail}`.trim());
  }
  const body = await response.json().catch(() => {
    throw new PlacesError("카카오 장소 검색 응답을 읽지 못했습니다.");
  });
  return parseKakaoPlaces(body);
}

/**
 * 장소 검색(카카오 로컬 키워드 검색). 이름으로 찾아 좌표가 있는 Place 목록을 돌려준다.
 * 검색어가 비어 있으면 호출하지 않고 빈 배열이다. 같은 검색어는 10분간 캐시한다.
 * 호출 실패는 PlacesError로 던진다.
 */
export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  return cache.getOrLoad(q, () => fetchPlaces(q));
}
