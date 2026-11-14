import type { Stop, SubwayLeg } from "@/shared/types";

/**
 * 출발 정류장에서 `endIndex` 정류장까지의 호선별 탑승 구간을 만든다.
 * 각 정류장의 `line`은 그 정류장에 도착할 때 탄 호선이다. 호선이 바뀐 정류장이 환승역이다.
 * 호선 정보가 없으면 빈 배열을 돌려준다.
 */
export function buildLegs(stops: Stop[], endIndex: number): SubwayLeg[] {
  const legs: SubwayLeg[] = [];
  for (let i = 1; i <= endIndex && i < stops.length; i++) {
    const line = stops[i].line;
    if (!line) continue;
    const prev = stops[i - 1];
    const last = legs[legs.length - 1];
    if (last && last.line === line) {
      last.toName = stops[i].name;
      last.endMin = stops[i].elapsedMin;
    } else {
      legs.push({
        line,
        fromName: prev.name,
        toName: stops[i].name,
        startMin: prev.elapsedMin,
        endMin: stops[i].elapsedMin,
      });
    }
  }
  return legs;
}
