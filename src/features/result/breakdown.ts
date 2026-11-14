import type { Option } from "@/shared/types";
import {
  TAXI_FARE_NOTE,
  addMinutes,
  formatDuration,
  formatTaxiFare,
  formatTimeRange,
  safeWon,
} from "./format";

export type BreakdownKind = "subway" | "taxiWait" | "taxi" | "total";

export interface BreakdownRow {
  kind: BreakdownKind;
  label: string;
  /** "09:12 → 09:28 · 설명". 합계 행에는 없다. */
  range?: string;
  duration: string;
  cost: string;
  /** 택시 행에만 있다. */
  note?: string;
}

export interface BreakdownNames {
  /** 출발지 이름. 있으면 지하철 행 제목에 "출발 → 환승역"으로 쓴다. */
  origin?: string;
  /** 도착지 이름. 있으면 택시 행 제목에 "환승역 → 도착"으로 쓴다. */
  destination?: string;
}

export function buildBreakdownRows(
  option: Option,
  names: BreakdownNames = {},
): [BreakdownRow, BreakdownRow, BreakdownRow, BreakdownRow] {
  const { departureTime, arrivalTime, subwayMin, taxiWaitMin, taxiMin } = option;
  const subwayEnd = addMinutes(departureTime, subwayMin);
  const taxiStart = addMinutes(departureTime, subwayMin + taxiWaitMin);

  return [
    {
      kind: "subway",
      label: names.origin ? `지하철 · ${names.origin} → ${option.stopName}` : "지하철",
      range: `${formatTimeRange(departureTime, subwayEnd)} · 열차 대기 포함`,
      duration: formatDuration(subwayMin),
      cost: safeWon(option.subwayFare),
    },
    {
      kind: "taxiWait",
      label: "역 밖으로 나와 택시 승차",
      range: formatTimeRange(subwayEnd, taxiStart),
      duration: formatDuration(taxiWaitMin),
      cost: safeWon(0),
    },
    {
      kind: "taxi",
      label: names.destination ? `택시 · ${option.stopName} → ${names.destination}` : "택시",
      range: `${formatTimeRange(taxiStart, arrivalTime)} · 예상`,
      duration: formatDuration(taxiMin),
      cost: Number.isFinite(option.taxiFare) ? formatTaxiFare(option.taxiFare) : "-",
      note: TAXI_FARE_NOTE,
    },
    {
      kind: "total",
      label: "합계",
      duration: formatDuration(subwayMin + taxiWaitMin + taxiMin),
      cost: safeWon(option.totalCost),
    },
  ];
}
