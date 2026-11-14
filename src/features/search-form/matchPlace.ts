import type { Place } from "@/shared/types";

/**
 * 입력한 글자에 해당하는 장소를 후보 중에서 고른다.
 * 이름이 같은 후보가 있으면 그것을, 없으면 입력으로 시작하는 첫 후보를 고른다(검색 결과는 정확도순).
 * 지하철역은 "신촌역 2호선"처럼 노선이 붙어 나와서, 노선 없이 "신촌역"만 입력해도 선택되게 하기 위함이다.
 */
export function matchPlace(places: Place[], query: string): Place | null {
  const q = query.trim();
  if (!q) return null;
  return places.find((p) => p.name === q) ?? places.find((p) => p.name.startsWith(q)) ?? null;
}
