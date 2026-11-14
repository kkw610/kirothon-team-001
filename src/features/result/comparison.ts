import type { Option } from "@/shared/types";
import { diffMinutes, formatLateMinutes } from "./format";
import { isSameOption, pickFastest } from "./select";

export interface ComparisonRow {
  option: Option;
  isBest: boolean;
  /** best === null 일 때 pickFastest 결과 한 행만 true */
  isFastest: boolean;
  /** diffMinutes(deadline, arrival) < 0 */
  isLate: boolean;
  /** isLate일 때만 "N분 늦음" */
  lateText?: string;
}

export function buildComparisonRows(
  options: Option[],
  best: Option | null,
  deadline: string,
): ComparisonRow[] {
  const fastest = best === null ? pickFastest(options) : undefined;
  return options.map((option) => {
    const diff = diffMinutes(deadline, option.arrivalTime);
    const lateText = formatLateMinutes(diff);
    const row: ComparisonRow = {
      option,
      isBest: isSameOption(best, option),
      isFastest: fastest !== undefined && option === fastest,
      isLate: diff < 0,
    };
    if (row.isLate && lateText !== undefined) row.lateText = lateText;
    return row;
  });
}
