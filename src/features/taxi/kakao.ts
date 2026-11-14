import { z } from "zod";
import { TaxiError } from "./errors";

/** 카카오모빌리티 자동차 길찾기(summary=false) 응답 중 사용하는 부분만 정의한다. fare는 읽지 않는다. */
const roadSchema = z.object({
  distance: z.number(),
  duration: z.number(),
});

const directionsSchema = z.object({
  routes: z
    .array(
      z.object({
        result_code: z.number(),
        result_msg: z.string().optional(),
        summary: z
          .object({
            /** 총 거리(m) */
            distance: z.number(),
            /** 총 소요시간(초) */
            duration: z.number(),
          })
          .optional(),
        sections: z.array(z.object({ roads: z.array(roadSchema).optional() })).optional(),
      }),
    )
    .min(1),
});

export interface KakaoRoute {
  distanceM: number;
  durationSec: number;
  /** 도로 구간별 거리와 시간. 저속 구간 판단에 쓴다 */
  roads: Array<{ distanceM: number; durationSec: number }>;
}

/** 응답에서 거리, 소요시간, 도로 구간 목록을 꺼낸다. 경로를 찾지 못했으면 NO_ROUTE를 던진다. */
export function parseKakaoRoute(body: unknown): KakaoRoute {
  const parsed = directionsSchema.safeParse(body);
  if (!parsed.success) {
    throw new TaxiError("UPSTREAM", "카카오모빌리티 응답 형식이 올바르지 않습니다.");
  }
  const route = parsed.data.routes[0];
  if (route.result_code !== 0 || !route.summary) {
    throw new TaxiError("NO_ROUTE", "택시 경로를 찾을 수 없습니다.");
  }
  const roads = (route.sections ?? []).flatMap((section) =>
    (section.roads ?? []).map((road) => ({ distanceM: road.distance, durationSec: road.duration })),
  );
  return { distanceM: route.summary.distance, durationSec: route.summary.duration, roads };
}
