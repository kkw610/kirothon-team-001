import { z } from "zod";
import type { Place } from "@/shared/types";
import { PlacesError } from "./errors";

/** 카카오 로컬 키워드 검색 응답 중 사용하는 부분만 정의한다. x는 경도, y는 위도이고 문자열로 온다. */
const responseSchema = z.object({ documents: z.array(z.unknown()) });
const documentSchema = z.object({
  place_name: z.string().min(1),
  x: z.coerce.number(),
  y: z.coerce.number(),
});

/** 응답에서 장소 목록을 만든다. 형식이 맞지 않는 항목은 건너뛰고, 같은 이름은 먼저 나온 것만 남긴다. */
export function parseKakaoPlaces(body: unknown): Place[] {
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    throw new PlacesError("카카오 장소 검색 응답 형식이 올바르지 않습니다.");
  }
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const raw of parsed.data.documents) {
    const doc = documentSchema.safeParse(raw);
    if (!doc.success || !Number.isFinite(doc.data.x) || !Number.isFinite(doc.data.y)) continue;
    const name = doc.data.place_name.trim();
    if (seen.has(name)) continue;
    seen.add(name);
    places.push({ name, x: doc.data.x, y: doc.data.y });
  }
  return places;
}
