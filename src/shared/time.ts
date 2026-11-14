/** 시간대 변환 공용 함수. 서비스 시간대는 Asia/Seoul이다(domain-rules.md). */

const KST_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Date를 Asia/Seoul 기준 yyyyMMddHHmm 문자열로 바꾼다. */
export function toKstStamp(at: Date): string {
  const parts = Object.fromEntries(KST_PARTS.formatToParts(at).map((p) => [p.type, p.value]));
  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}`;
}
