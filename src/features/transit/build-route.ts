import type { Coordinate, Route, Stop, WalkSegment } from "@/shared/types";
import { calculateSubwayFare } from "./fare";

/** API 응답을 이 형태로 바꾼 뒤 buildRoute에 넘긴다. API 형식과 역별 계산을 분리하기 위한 중간 형태다. */
export type TransitLeg =
  | {
      kind: "subway";
      /** 구간 소요시간(분) */
      minutes: number;
      /** 구간 거리(m). 없으면 역 사이 직선거리 합을 쓴다 */
      distanceM?: number;
      line?: string;
      /** 탑승역부터 하차역까지 순서대로 */
      stations: Array<Coordinate & { name: string }>;
    }
  | {
      kind: "walk" | "other";
      minutes: number;
      /** 구간 거리(m). 도보 구간 합계에 쓴다 */
      distanceM?: number;
    };

export interface RouteMeta {
  id: string;
  /** 경로 전체 요금(원). 없으면 역별 거리비례 운임만 쓰고 경로 요금은 마지막 역 운임이다 */
  fare?: number;
  /** 총 소요시간(분). 없으면 구간 시간 합 */
  totalMin?: number;
  timeAware: boolean;
  /** 경로 검색 기준 출발 시각(ISO 8601) */
  departureTime?: string;
}

const EARTH_RADIUS_M = 6_371_000;

function straightLineM(a: Coordinate, b: Coordinate): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.y - a.y);
  const dLng = rad(b.x - a.x);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.y)) * Math.cos(rad(b.y)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** legs[from, to) 중 도보 구간의 거리·시간 합 */
function sumWalk(legs: TransitLeg[], from: number, to: number): WalkSegment {
  let distanceM = 0;
  let minutes = 0;
  for (const leg of legs.slice(from, to)) {
    if (leg.kind !== "walk") continue;
    distanceM += leg.distanceM ?? 0;
    minutes += leg.minutes;
  }
  return { distanceM: Math.round(distanceM), minutes: round1(minutes) };
}

/** 구간 안 역들의 구간 시작부터의 비율(0~1)과 직선거리 합. 좌표가 모두 같으면 역 순서 비율. */
function stationRatios(stations: Coordinate[]): { ratios: number[]; straightM: number } {
  const cumulative = [0];
  for (let i = 1; i < stations.length; i += 1) {
    cumulative.push(cumulative[i - 1] + straightLineM(stations[i - 1], stations[i]));
  }
  const total = cumulative.at(-1) ?? 0;
  const last = stations.length - 1;
  const ratios =
    total > 0
      ? cumulative.map((d) => d / total)
      : stations.map((_, i) => (last > 0 ? i / last : 0));
  return { ratios, straightM: total };
}

/**
 * 구간 목록으로 Route를 만든다. API가 역별 값을 주지 않으므로 다음처럼 추정한다.
 * - 시간·거리: 구간 값을 역 사이 직선거리 비율로 나누고 앞 구간(도보 포함)을 누적한다.
 * - 요금: 탑승역부터 누적 거리로 거리비례 운임을 계산하고 경로 요금 이하로 자른다.
 *   탑승역은 0(타지 않음), 마지막 역은 경로 요금과 같다.
 * - 환승역은 두 구간에 연속으로 나오므로 먼저 나온 것만 남긴다.
 * - 도보: 첫 지하철 앞 도보 합은 walkFromOrigin, 마지막 지하철 뒤 도보 합은 walkToDestination.
 * 지하철역이 하나도 없으면 null을 돌려준다.
 */
export function buildRoute(legs: TransitLeg[], meta: RouteMeta): Route | null {
  const stops: Stop[] = [];
  let timeCursor = 0;
  let distCursor = 0;

  for (const leg of legs) {
    if (leg.kind === "subway" && leg.stations.length > 0) {
      const { ratios, straightM } = stationRatios(leg.stations);
      const legDistance = leg.distanceM && leg.distanceM > 0 ? leg.distanceM : straightM;
      leg.stations.forEach((station, i) => {
        if (stops.at(-1)?.name === station.name) return;
        const distanceM = Math.round(distCursor + legDistance * ratios[i]);
        stops.push({
          name: station.name,
          x: station.x,
          y: station.y,
          elapsedMin: round1(timeCursor + leg.minutes * ratios[i]),
          mode: "subway",
          line: leg.line,
          distanceM,
          fare:
            stops.length === 0
              ? 0
              : Math.min(calculateSubwayFare(distanceM), meta.fare ?? Number.POSITIVE_INFINITY),
        });
      });
      distCursor += legDistance;
    }
    timeCursor += leg.minutes;
  }

  if (stops.length === 0) return null;
  if (stops.length > 1 && meta.fare !== undefined) stops[stops.length - 1].fare = meta.fare;
  const fare = meta.fare ?? stops[stops.length - 1].fare ?? 0;

  const firstSubway = legs.findIndex((l) => l.kind === "subway");
  const lastSubway = legs.length - 1 - [...legs].reverse().findIndex((l) => l.kind === "subway");

  return {
    id: meta.id,
    fare,
    stops,
    totalMin: meta.totalMin ?? round1(timeCursor),
    transferCount: Math.max(0, legs.filter((l) => l.kind === "subway").length - 1),
    timeAware: meta.timeAware,
    departureTime: meta.departureTime,
    walkFromOrigin: sumWalk(legs, 0, firstSubway),
    walkToDestination: sumWalk(legs, lastSubway + 1, legs.length),
  };
}
