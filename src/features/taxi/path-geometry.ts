import { z } from "zod";
import type { Coordinate } from "@/shared/types";
import { TaxiError } from "./errors";

/** 길찾기 응답 중 도로 모양(vertexes)만 읽는다. vertexes는 x, y가 번갈아 들어 있는 숫자 배열이다. */
const pathSchema = z.object({
  routes: z
    .array(
      z.object({
        result_code: z.number(),
        sections: z
          .array(z.object({ roads: z.array(z.object({ vertexes: z.array(z.number()).optional() })).optional() }))
          .optional(),
      }),
    )
    .min(1),
});

/** 지도에 그릴 최대 점 수. 이보다 많으면 일정 간격으로 줄인다 */
export const MAX_PATH_POINTS = 500;

/** [x1, y1, x2, y2, ...]를 좌표 배열로 바꾼다. 홀수 길이면 마지막 값은 버린다. */
export function vertexesToPath(vertexes: number[]): Coordinate[] {
  const path: Coordinate[] = [];
  for (let i = 0; i + 1 < vertexes.length; i += 2) {
    path.push({ x: vertexes[i], y: vertexes[i + 1] });
  }
  return path;
}

/** 바로 앞 점과 같은 점을 지운다. 도로 구간 경계에서 끝점과 시작점이 겹친다. */
function dedupeConsecutive(path: Coordinate[]): Coordinate[] {
  return path.filter((p, i) => i === 0 || p.x !== path[i - 1].x || p.y !== path[i - 1].y);
}

/** 점이 max개를 넘으면 같은 간격으로 max개만 남긴다. 첫 점과 마지막 점은 항상 남는다. */
export function thinPath(path: Coordinate[], max: number = MAX_PATH_POINTS): Coordinate[] {
  if (path.length <= max || max < 2) return path;
  const step = (path.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => path[Math.round(i * step)]);
}

/**
 * 카카오모빌리티 길찾기(summary=false) 응답에서 도로 경로를 꺼낸다.
 * 경로가 없거나 점이 2개 미만이면 NO_ROUTE, 응답 형식이 다르면 UPSTREAM을 던진다.
 */
export function parseTaxiPath(body: unknown): Coordinate[] {
  const parsed = pathSchema.safeParse(body);
  if (!parsed.success) {
    throw new TaxiError("UPSTREAM", "카카오모빌리티 응답 형식이 올바르지 않습니다.");
  }
  const route = parsed.data.routes[0];
  if (route.result_code !== 0) {
    throw new TaxiError("NO_ROUTE", "택시 경로를 찾을 수 없습니다.");
  }
  const all = (route.sections ?? []).flatMap((section) =>
    (section.roads ?? []).flatMap((road) => vertexesToPath(road.vertexes ?? [])),
  );
  const path = dedupeConsecutive(all);
  if (path.length < 2) throw new TaxiError("NO_ROUTE", "택시 경로를 찾을 수 없습니다.");
  return thinPath(path);
}
