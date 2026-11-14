import { MemoryCache } from "@/shared/cache";
import type { Place, Route } from "@/shared/types";
import { fakeRoutes } from "./fake-data";

const cache = new MemoryCache<Route[]>(5 * 60 * 1000);

/**
 * 출발지에서 목적지까지 지하철 경로 목록을 돌려준다.
 * 현재는 어떤 입력에도 신촌 → 강남 2호선 경로를 돌려주는 가짜 구현이다.
 */
export async function getTransitRoutes(
  origin: Place,
  destination: Place,
): Promise<Route[]> {
  const key = `${origin.x},${origin.y}->${destination.x},${destination.y}`;
  return cache.getOrLoad(key, async () => fakeRoutes());
}
