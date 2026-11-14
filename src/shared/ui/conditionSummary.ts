import type { RecommendRequest } from "@/shared/types";

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** ISO 시각을 KST "HH:mm"으로 바꾼다. 유효하지 않으면 "-"를 돌려준다. */
function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    const parts = timeFormatter.formatToParts(date);
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    if (!hour || !minute) return "-";
    return `${hour}:${minute}`;
  } catch {
    return "-";
  }
}

/**
 * 헤더에 보여 줄 조건 요약 문자열을 만든다.
 * 예: `서울역 → 강남역 · 09:00까지 · 08:10 출발`
 */
export function buildConditionSummary(
  request: RecommendRequest,
  fallbackDepartureTime?: string,
): string {
  const base = `${request.origin.name} → ${request.destination.name} · ${formatTime(request.arrivalTime)}까지`;
  const departure = request.departureTime ?? fallbackDepartureTime;
  return departure ? `${base} · ${formatTime(departure)} 출발` : base;
}
