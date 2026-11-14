const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatTime = (iso: string) => timeFormat.format(new Date(iso));
export const formatWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export const formatKm = (m: number) => `${(m / 1000).toFixed(1)}km`;
