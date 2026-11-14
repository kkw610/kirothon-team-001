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
  /** "09:12 → 09:28". 택시 대기와 합계 행에는 없다. */
  range?: string;
  duration: string;
  cost: string;
  /** 택시 행에만 있다. */
  note?: string;
}

export function buildBreakdownRows(
  option: Option,
): [BreakdownRow, BreakdownRow, BreakdownRow, BreakdownRow] {
  const { departureTime, arrivalTime, subwayMin, taxiWaitMin, taxiMin } = option;
  const subwayEnd = addMinutes(departureTime, subwayMin);
  const taxiStart = addMinutes(departureTime, subwayMin + taxiWaitMin);

  return [
    {
      kind: "subway",
      label: "지하철",
      range: formatTimeRange(departureTime, subwayEnd),
      duration: formatDuration(subwayMin),
      cost: safeWon(option.subwayFare),
    },
    {
      kind: "taxiWait",
      label: "택시 대기",
      duration: formatDuration(taxiWaitMin),
      cost: safeWon(0),
    },
    {
      kind: "taxi",
      label: "택시",
      range: formatTimeRange(taxiStart, arrivalTime),
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
