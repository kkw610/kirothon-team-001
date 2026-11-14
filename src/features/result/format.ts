const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
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
