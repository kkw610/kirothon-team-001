import type { Option } from "@/shared/types";

const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
});

export const formatTime = (iso: string) => timeFormat.format(new Date(iso));

export const formatWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 택시 요금은 추정치이므로 "약"을 붙인다. */
export const formatTaxiFare = (n: number) => `약 ${formatWon(n)}`;

export const formatKm = (m: number) => `${(m / 1000).toFixed(1)}km`;

/** 60분 미만은 `N분`, 이상은 `N시간 M분`(M이 0이면 `N시간`). */
export function formatDuration(min: number): string {
  const total = Math.max(0, Math.round(min));
  if (total < 60) return `${total}분`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 희망 도착 시각 - 도착 시각(분, 내림). 양수면 여유, 음수면 지각. */
export function diffMinutes(deadlineIso: string, arrivalIso: string): number {
  return Math.floor((new Date(deadlineIso).getTime() - new Date(arrivalIso).getTime()) / 60_000);
}

export function formatMargin(diffMin: number): string {
  if (diffMin > 0) return `${formatDuration(diffMin)} 여유`;
  if (diffMin < 0) return `${formatDuration(-diffMin)} 늦음`;
  return "딱 맞게 도착";
}

/* ---------- 화면 표시 문구 (result-ui-design) ---------- */

export const RECOMMEND_CHIP = "추천 · 제시간 도착 중 가장 싼 방법";
export const LATE_CHIP = "제시간 도착 불가";
export const LATE_HEADLINE = "제시간에 도착하는 방법이 없어요";
export const LOADING_TITLE = "환승이가 갈아탈 역을 찾고 있어요";
export const LOADING_STEPS = [
  "지하철 경로와 역별 도착 시각 조회",
  "역마다 택시 시간·요금 조회",
  "제시간 도착 + 최저 비용 역 고르기",
] as const;
export const LOADING_STEP_MS = 2_500;
export const SLOW_NOTICE = "평소보다 오래 걸리고 있어요. 잠시만 기다려 주세요.";
export const SLOW_THRESHOLD_MS = 30_000;
export const ERROR_TITLE = "경로를 불러오지 못했어요";
export const DEFAULT_ERROR_MESSAGE = "잠시 후 다시 시도해 주세요.";
export const EMPTY_TITLE = "경로를 찾지 못했어요";
export const EMPTY_HINT = "출발지나 도착지를 바꿔 다시 검색해 보세요.";
export const TAXI_FARE_NOTE = "교통상황에 따라 변동";
export const TAXI_FARE_DISCLAIMER = "택시비는 예상 요금이에요. 교통 상황에 따라 달라질 수 있어요.";
export const ON_TIME_LABEL = "제시간";
export const FASTEST_BADGE = "가장 빠름";
export const BEST_BADGE = "추천";

const PLACEHOLDER = "-";

const isValidIso = (iso: unknown): iso is string =>
  typeof iso === "string" && !Number.isNaN(new Date(iso).getTime());

const isFiniteNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** 앞뒤 공백을 제거하고 끝에 "역"이 없으면 붙인다. 빈 값이면 "-". */
export function formatStationName(name: string): string {
  const trimmed = (name ?? "").trim();
  if (trimmed === "") return PLACEHOLDER;
  return trimmed.endsWith("역") ? trimmed : `${trimmed}역`;
}

export function formatTransferHeadline(stopName: string): string {
  return `${formatStationName(stopName)}에서 택시로 갈아타세요`;
}

/** 택시 없이 마지막 역에서 걸어가는 옵션의 제목. */
export function formatWalkHeadline(stopName: string, walkMin: number | undefined): string {
  const walk = isFiniteNumber(walkMin) ? ` (도보 ${formatDuration(walkMin)})` : "";
  return `${formatStationName(stopName)}에서 내려 걸어가세요${walk}`;
}

/** 옵션 종류에 맞는 제목. */
export function formatOptionHeadline(option: Pick<Option, "kind" | "stopName" | "walkMin">): string {
  return option.kind === "walk"
    ? formatWalkHeadline(option.stopName, option.walkMin)
    : formatTransferHeadline(option.stopName);
}

/** "09:12 → 09:28". 유효하지 않은 쪽은 "-". */
export function formatTimeRange(fromIso: string, toIso: string): string {
  return `${safeTime(fromIso)} → ${safeTime(toIso)}`;
}

/** ISO 문자열에 분을 더한 ISO 문자열. 입력이 유효하지 않으면 입력을 그대로 돌려준다. */
export function addMinutes(iso: string, min: number): string {
  if (!isValidIso(iso) || !isFiniteNumber(min)) return iso;
  return new Date(new Date(iso).getTime() + min * 60_000).toISOString();
}

/** diffMin < 0이면 "N분 늦음"(N ≥ 1), 아니면 undefined. */
export function formatLateMinutes(diffMin: number): string | undefined {
  if (!isFiniteNumber(diffMin) || diffMin >= 0) return undefined;
  return `${Math.max(1, Math.round(-diffMin))}분 늦음`;
}

export function safeTime(iso: string | null | undefined): string {
  if (!isValidIso(iso)) return PLACEHOLDER;
  try {
    return formatTime(iso);
  } catch {
    return PLACEHOLDER;
  }
}

export function safeWon(n: number | null | undefined): string {
  return isFiniteNumber(n) ? formatWon(n) : PLACEHOLDER;
}

export function safeMargin(diffMin: number | null | undefined): string {
  return isFiniteNumber(diffMin) ? formatMargin(diffMin) : PLACEHOLDER;
}

/** "09:57 도착 · 3분 여유 · 총 21,350원". 유효하지 않은 값은 그 자리만 "-". */
export function formatArrivalSummary(
  option: Pick<Option, "arrivalTime" | "totalCost">,
  deadlineIso: string,
): string {
  const arrival = safeTime(option?.arrivalTime);
  const diff =
    isValidIso(deadlineIso) && isValidIso(option?.arrivalTime)
      ? diffMinutes(deadlineIso, option.arrivalTime)
      : undefined;
  const margin = safeMargin(diff);
  const cost = isFiniteNumber(option?.totalCost) ? `총 ${formatWon(option.totalCost)}` : PLACEHOLDER;
  return `${arrival} 도착 · ${margin} · ${cost}`;
}

/** 추천 카드의 통계 칸(도착·여유·총비용). 유효하지 않은 값은 "-". */
export function formatArrivalStats(
  option: Pick<Option, "arrivalTime" | "totalCost">,
  deadlineIso: string,
): { label: string; value: string }[] {
  const diff =
    isValidIso(deadlineIso) && isValidIso(option?.arrivalTime)
      ? diffMinutes(deadlineIso, option.arrivalTime)
      : undefined;
  let margin = { label: "여유", value: PLACEHOLDER };
  if (isFiniteNumber(diff)) {
    if (diff > 0) margin = { label: "여유", value: formatDuration(diff) };
    else if (diff === 0) margin = { label: "여유", value: "딱 맞게" };
    else margin = { label: "늦음", value: formatDuration(-diff) };
  }
  return [
    { label: "도착", value: safeTime(option?.arrivalTime) },
    margin,
    { label: "총비용", value: safeWon(option?.totalCost) },
  ];
}
/** 비었거나 공백뿐이면 기본 문구, 아니면 원문 그대로. */
export function resolveErrorMessage(message: string | undefined | null): string {
  if (message === undefined || message === null || message.trim() === "") return DEFAULT_ERROR_MESSAGE;
  return message;
}
