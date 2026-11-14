import type { Option } from "@/shared/types";

/** 도착 시각이 가장 이른 옵션. 동률이면 배열 앞쪽. 빈 배열이면 undefined. */
export function pickFastest(options: Option[]): Option | undefined {
  let fastest: Option | undefined;
  let fastestTime = Infinity;
  for (const option of options) {
    const time = Date.parse(option.arrivalTime);
    if (fastest === undefined || time < fastestTime) {
      fastest = option;
      fastestTime = time;
    }
  }
  return fastest;
}

/** routeId와 stopName이 모두 같으면 같은 옵션으로 본다. */
export function isSameOption(a: Option | null, b: Option): boolean {
  return a !== null && a.routeId === b.routeId && a.stopName === b.stopName;
}
