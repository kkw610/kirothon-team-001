/** 탑승 시각을 카카오 미래 길찾기 departure_time으로 바꾸는 순수 함수. */
import { toKstStamp } from "@/shared/time";

/** 이 시간 이내에 탈 예정이면 미래 예측 대신 실시간 길찾기를 쓴다. */
export const REALTIME_WINDOW_MS = 5 * 60_000;
/** 같은 구간의 미래 요청을 캐시로 공유하려고 출발 시각을 이 단위로 올림한다. */
export const DEPARTURE_BUCKET_MIN = 5;

/**
 * 실시간 길찾기를 쓸지, 미래 길찾기의 departure_time을 무엇으로 할지 정한다.
 * - 탑승 시각이 지금부터 5분 이내(또는 과거)면 null: 실시간 길찾기
 * - 그 밖에는 5분 단위로 올림한 시각(Asia/Seoul yyyyMMddHHmm)
 */
export function futureDepartureStamp(boardingAt: Date, now: Date): string | null {
  if (boardingAt.getTime() - now.getTime() <= REALTIME_WINDOW_MS) return null;
  const bucketMs = DEPARTURE_BUCKET_MIN * 60_000;
  return toKstStamp(new Date(Math.ceil(boardingAt.getTime() / bucketMs) * bucketMs));
}
