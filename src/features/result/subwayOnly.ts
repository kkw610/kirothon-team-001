import type { Route } from "@/shared/types";
import { addMinutes, diffMinutes } from "./format";

export interface SubwayOnlyLeg {
  line: string;
  fromName: string;
  toName: string;
  /** 이 구간에서 지나는 역 수(탑승역 제외) */
  stationCount: number;
  startMin: number;
  endMin: number;
}

export interface SubwayOnlyPlan {
  legs: SubwayOnlyLeg[];
  /** 출발지에서 목적지까지 총 소요시간(분, 도보 포함) */
  totalMin: number;
  fare: number;
  transferCount: number;
  departureTime: string;
  arrivalTime: string;
  /** 희망 도착 시각 - 도착 시각(분). 음수면 지각 */
  marginMin: number;
  onTime: boolean;
}

/**
 * 지하철만 탈 때의 경로를 화면용 데이터로 바꾼다.
 * 각 정류장의 `line`은 그 정류장에 도착할 때 탄 호선이므로, 호선이 바뀐 정류장이 환승역이다.
 * 정류장이 2개 미만이거나 출발 시각이 없으면 null.
 */
export function buildSubwayOnlyPlan(
  route: Route | undefined,
  fallbackDepartureIso: string | undefined,
  deadlineIso: string,
): SubwayOnlyPlan | null {
  const departureTime = route?.departureTime ?? fallbackDepartureIso;
  if (!route || route.stops.length < 2 || !departureTime) return null;

  const { stops } = route;
  const legs: SubwayOnlyLeg[] = [];
  for (let i = 1; i < stops.length; i++) {
    const stop = stops[i];
    const line = stop.line ?? "지하철";
    const last = legs[legs.length - 1];
    if (last && last.line === line) {
      last.toName = stop.name;
      last.endMin = stop.elapsedMin;
      last.stationCount += 1;
    } else {
      legs.push({
        line,
        fromName: stops[i - 1].name,
        toName: stop.name,
        stationCount: 1,
        startMin: stops[i - 1].elapsedMin,
        endMin: stop.elapsedMin,
      });
    }
  }

  const totalMin = route.totalMin ?? stops[stops.length - 1].elapsedMin;
  const arrivalTime = addMinutes(departureTime, totalMin);
  const marginMin = diffMinutes(deadlineIso, arrivalTime);
  return {
    legs,
    totalMin,
    fare: route.fare,
    transferCount: route.transferCount ?? Math.max(0, legs.length - 1),
    departureTime,
    arrivalTime,
    marginMin,
    onTime: marginMin >= 0,
  };
}
