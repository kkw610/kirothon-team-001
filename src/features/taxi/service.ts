import { MemoryCache } from "@/shared/cache";
import { requireEnv } from "@/shared/env";
import type { Coordinate, TaxiEstimator } from "@/shared/types";
import { TaxiError } from "./errors";
import { futureDepartureStamp } from "./departure";
import { calculateTaxiFare, fareTableAt, slowSeconds } from "./fare";
import { parseKakaoRoute } from "./kakao";
import { Limiter } from "./limiter";

/** 실시간 교통 기준 길찾기 */
const DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/directions";
/** 미래 시각 교통 예측 기준 길찾기(departure_time 필수, 현재 이후) */
const FUTURE_URL = "https://apis-navi.kakaomobility.com/v1/future/directions";
const TIMEOUT_MS = 5000;
const MAX_CONCURRENT = 5;

interface RoadSummary {
  distanceM: number;
  durationSec: number;
  slowSec: number;
}

/** 도로 정보만 캐시한다. 요금은 탑승 시각에 따라 달라지므로 매번 계산한다. */
const cache = new MemoryCache<RoadSummary>(5 * 60 * 1000, 2000);
const limiter = new Limiter(MAX_CONCURRENT);

/** 캐시 키가 같아지도록 좌표를 소수 5자리(약 1m)로 맞춘다. */
function point(c: Coordinate): string {
  return `${c.x.toFixed(5)},${c.y.toFixed(5)}`;
}

async function fetchDirections(
  from: Coordinate,
  to: Coordinate,
  departureStamp: string | null,
): Promise<unknown> {
  const url = new URL(departureStamp ? FUTURE_URL : DIRECTIONS_URL);
  if (departureStamp) url.searchParams.set("departure_time", departureStamp);
  url.searchParams.set("origin", point(from));
  url.searchParams.set("destination", point(to));
  url.searchParams.set("priority", "RECOMMEND");
  // 도로 구간별 거리와 시간이 있어야 저속 구간(시간요금)을 계산할 수 있다.
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
  return response.json().catch(() => {
    throw new TaxiError("UPSTREAM", "카카오모빌리티 응답을 읽지 못했습니다.");
  });
}

/**
 * 두 지점 사이 택시 거리, 시간, 요금을 구한다.
 * 거리와 시간은 카카오모빌리티 자동차 길찾기 값을 쓴다. 탑승 시각이 5분 넘게 뒤면 미래 길찾기로
 * 그 시각(5분 단위 올림)의 교통 예측을, 아니면 실시간 교통을 반영한다.
 * 요금은 응답의 요금 대신 서울시 미터 요금(동시병산, 심야 할증)으로 계산한다.
 * 동시 호출은 5개로 제한하고, 같은 좌표쌍은 캐시와 진행 중 요청 공유로 한 번만 호출한다.
 */
export const estimateTaxi: TaxiEstimator = async (from, to, boardingAt = new Date()) => {
  const stamp = futureDepartureStamp(boardingAt, new Date());
  const key = `${point(from)}->${point(to)}@${stamp ?? "now"}`;
  const road = await cache.getOrLoad(key, () =>
    limiter.run(async () => {
      const route = parseKakaoRoute(await fetchDirections(from, to, stamp));
      return {
        distanceM: route.distanceM,
        durationSec: route.durationSec,
        slowSec: slowSeconds(route.roads),
      };
    }),
  );
  return {
    distanceM: road.distanceM,
    durationSec: road.durationSec,
    slowSec: road.slowSec,
    trafficBasis: stamp ? "predicted" : "realtime",
    surchargeRate: fareTableAt(boardingAt).surchargeRate,
    fare: calculateTaxiFare({ distanceM: road.distanceM, slowSec: road.slowSec, boardingAt }),
  };
};
