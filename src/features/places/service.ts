import { MemoryCache } from "@/shared/cache";
import type { Place } from "@/shared/types";
import { FAKE_PLACES } from "./fake-data";

const cache = new MemoryCache<Place[]>(10 * 60 * 1000);

/** 장소 검색. 현재는 가짜 데이터에서 이름 부분 일치로 찾는다. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  return cache.getOrLoad(q, async () =>
    FAKE_PLACES.filter((place) => place.name.includes(q)),
  );
}
